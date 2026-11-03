// Member 6 - announcement business rules.
const announcementModel = require('../models/announcement.model');
const enrollmentModel = require('../models/enrollment.models');
const enrollmentService = require('./enrollment.service');
const notificationService = require('./notification.service');
const access = require('./access.service');
const { requireFields, assertEnum } = require('../lib/validate');
const { pick, toMysqlDate } = require('../utils/sql');
const AppError = require('../utils/AppError');

const STATUSES = ['draft', 'published', 'archived'];

// Course managers see everything; other staff and enrolled students see published, unexpired items.
async function canManage(user, courseId) {
  try { await access.assertCourseManager(user, courseId); return true; } catch (e) { return false; }
}

async function assertCanRead(user, courseId) {
  if (access.isStaff(user)) return;
  if (!(await enrollmentService.isEnrolled(user.user_id, courseId))) {
    throw new AppError('Enroll in this course to see its announcements', 403);
  }
}

async function listByCourse(courseId, user) {
  await access.getCourseOrFail(courseId);
  await assertCanRead(user, courseId);
  const manager = await canManage(user, courseId);
  return announcementModel.findByCourse(courseId, { visibleOnly: !manager });
}

async function getById(announcementId, user) {
  const a = await announcementModel.findById(announcementId);
  if (!a) throw new AppError('Announcement not found', 404);
  await assertCanRead(user, a.course_id);
  const expired = a.expires_at && new Date(a.expires_at) < new Date();
  if (!(await canManage(user, a.course_id)) && (a.status !== 'published' || expired)) {
    throw new AppError('Announcement not found', 404);
  }
  return a;
}

async function notifyStudents(announcement) {
  const studentIds = await enrollmentModel.findActiveStudentIds(announcement.course_id);
  await Promise.all(
    studentIds.map((id) =>
      notificationService.notify({
        user_id: id,
        title: `New announcement: ${announcement.title}`,
        message: announcement.content.slice(0, 200),
        notification_type: 'announcement',
        reference_id: announcement.announcement_id,
      })
    )
  );
}

async function create(courseId, body, user) {
  await access.assertCourseManager(user, courseId);
  requireFields(body, ['title', 'content']);
  assertEnum(body.status, STATUSES, 'status');

  const expires_at = toMysqlDate(body.expires_at);
  if (expires_at === undefined) throw new AppError('expires_at is not a valid date', 400);

  const status = body.status || 'published';
  const id = await announcementModel.create({
    course_id: courseId,
    author_id: user.user_id,
    title: String(body.title).trim(),
    content: body.content,
    status,
    published_at: status === 'published' ? new Date() : null,
    expires_at,
  });
  const announcement = await announcementModel.findById(id);
  if (status === 'published') await notifyStudents(announcement);
  return announcement;
}

async function update(announcementId, body, user) {
  const current = await announcementModel.findById(announcementId);
  if (!current) throw new AppError('Announcement not found', 404);
  await access.assertCourseManager(user, current.course_id);
  assertEnum(body.status, STATUSES, 'status');

  const fields = pick(body, ['title', 'content', 'status']);
  if (body.expires_at !== undefined) {
    const d = toMysqlDate(body.expires_at);
    if (d === undefined) throw new AppError('expires_at is not a valid date', 400);
    fields.expires_at = d;
  }
  const justPublished = fields.status === 'published' && current.status !== 'published';
  if (justPublished) fields.published_at = new Date();
  if (!Object.keys(fields).length) throw new AppError('No valid fields to update', 400);

  await announcementModel.update(announcementId, fields);
  const updated = await announcementModel.findById(announcementId);
  if (justPublished) await notifyStudents(updated);
  return updated;
}

async function remove(announcementId, user) {
  const current = await announcementModel.findById(announcementId);
  if (!current) throw new AppError('Announcement not found', 404);
  await access.assertCourseManager(user, current.course_id);
  await announcementModel.remove(announcementId);
}

module.exports = { listByCourse, getById, create, update, remove };
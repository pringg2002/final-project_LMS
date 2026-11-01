// Member 6 - enrollment business rules (SQLite compatible).
const enrollmentModel = require('../models/enrollment.models');
const userModel = require('../models/user.models');
const access = require('./access.service');
const notificationService = require('./notification.service');
const { ROLES } = require('../lib/roles');
const { requireFields, assertEnum, assertNumber } = require('../lib/validate');
const AppError = require('../utils/AppError');

const STATUSES = ['active', 'completed', 'dropped'];

async function list(user, { courseId } = {}) {
  if (user.role === ROLES.STUDENT) return enrollmentModel.findAll({ studentId: user.user_id, courseId });
  if (user.role === ROLES.INSTRUCTOR) return enrollmentModel.findAll({ instructorId: user.user_id, courseId });
  return enrollmentModel.findAll({ courseId });
}

// Students may see only their own; instructors only enrollments in their courses; admins all.
function assertCanView(enrollment, user) {
  const ok =
    user.role === ROLES.ADMIN ||
    (user.role === ROLES.STUDENT && enrollment.student_id === user.user_id) ||
    (user.role === ROLES.INSTRUCTOR && enrollment.instructor_id === user.user_id);
  if (!ok) throw new AppError('You cannot access this enrollment', 403);
}

async function getById(enrollmentId, user) {
  const enrollment = await enrollmentModel.findById(enrollmentId);
  if (!enrollment) throw new AppError('Enrollment not found', 404);
  assertCanView(enrollment, user);
  return enrollment;
}

// Student: POST { course_id } enrolls themselves.  Staff: POST { course_id, student_id } enrolls a student.
async function create(body, user) {
  requireFields(body, ['course_id']);
  const course = await access.getCourseOrFail(Number(body.course_id));

  let studentId = user.user_id;
  if (user.role !== ROLES.STUDENT) {
    requireFields(body, ['student_id']);
    await access.assertCourseManager(user, course.course_id);
    const student = await userModel.findById(Number(body.student_id));
    if (!student || student.role !== ROLES.STUDENT) throw new AppError('student_id must belong to a student', 400);
    studentId = student.user_id;
  } else if (course.status !== 'published') {
    throw new AppError('Course not found', 404); // students cannot see unpublished courses
  }

  const existing = await enrollmentModel.findByStudentCourse(studentId, course.course_id);
  let enrollmentId;
  if (existing && existing.status !== 'dropped') {
    throw new AppError('Student is already enrolled in this course', 409);
  } else if (existing) {
    await enrollmentModel.update(existing.enrollment_id, { status: 'active' }); // re-enroll after dropping
    enrollmentId = existing.enrollment_id;
  } else {
    enrollmentId = await enrollmentModel.create({ student_id: studentId, course_id: course.course_id });
  }

  await notificationService.notify({
    user_id: studentId,
    title: 'Enrollment confirmed',
    message: `You are enrolled in ${course.course_code} - ${course.course_name}.`,
    notification_type: 'system',
    reference_id: course.course_id,
  });
  return enrollmentModel.findById(enrollmentId);
}

async function update(enrollmentId, body, user) {
  const enrollment = await enrollmentModel.findById(enrollmentId);
  if (!enrollment) throw new AppError('Enrollment not found', 404);
  assertEnum(body.status, STATUSES, 'status');
  assertNumber(body.final_score, 'final_score', { min: 0, max: 100 });

  const fields = {};
  if (user.role === ROLES.STUDENT) {
    if (enrollment.student_id !== user.user_id) throw new AppError('You can only change your own enrollment', 403);
    if (body.status !== 'dropped' || body.final_score !== undefined || body.completion_date !== undefined) {
      throw new AppError('Students can only drop their own enrollment (status: "dropped")', 403);
    }
    fields.status = 'dropped';
  } else {
    await access.assertCourseManager(user, enrollment.course_id);
    if (body.status !== undefined) fields.status = body.status;
    if (body.final_score !== undefined) fields.final_score = body.final_score;
    if (fields.status === 'completed') fields.completion_date = new Date().toISOString();
  }
  if (!Object.keys(fields).length) throw new AppError('No valid fields to update', 400);

  await enrollmentModel.update(enrollmentId, fields);
  return enrollmentModel.findById(enrollmentId);
}

async function remove(enrollmentId, user) {
  const enrollment = await enrollmentModel.findById(enrollmentId);
  if (!enrollment) throw new AppError('Enrollment not found', 404);
  await access.assertCourseManager(user, enrollment.course_id);
  await enrollmentModel.remove(enrollmentId);
}

// True when the student currently has an active or completed enrollment in the course.
async function isEnrolled(studentId, courseId) {
  const e = await enrollmentModel.findByStudentCourse(studentId, courseId);
  return !!e && e.status !== 'dropped';
}

// REPORT 6 (enrollments FULL OUTER JOIN activity, via LEFT JOIN UNION LEFT JOIN)
const activityReport = () => enrollmentModel.getEnrollmentActivityReport();

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  isEnrolled,
  activityReport,
};
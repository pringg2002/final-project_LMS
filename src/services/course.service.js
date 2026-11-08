const courseModel = require('../models/course.models');
const userModel = require('../models/user.models');
const access = require('./access.service');
const { ROLES } = require('../lib/roles');
const { requireFields, assertEnum, parseId } = require('../lib/validate');
const { pick } = require('../utils/sql');
const AppError = require('../utils/AppError');

const STATUSES = ['draft', 'published', 'archived'];

async function list(user) {
  if (user.role === ROLES.ADMIN) return courseModel.findAll({ all: true });
  if (user.role === ROLES.INSTRUCTOR) return courseModel.findAll({ instructorId: user.user_id });
  return courseModel.findAll({ studentId: user.user_id });
}

async function getById(courseId, user) {
  const course = await access.getCourseOrFail(courseId);
  if (user.role === ROLES.INSTRUCTOR && course.instructor_id !== user.user_id) throw new AppError('Course not found', 404);
  if (user.role === ROLES.STUDENT) {
    const enrollment = await require('../models/enrollment.models').findByStudentCourse(user.user_id, courseId);
    if (course.status !== 'published' || !enrollment || enrollment.status === 'dropped') throw new AppError('Course not found', 404);
  }
  return course;
}

async function create(body, user) {
  requireFields(body, ['course_code', 'course_name']);
  assertEnum(body.status, STATUSES, 'status');

  if (!access.isAdmin(user)) throw new AppError('Only admins can create courses', 403);
  if (body.instructor_id === undefined) throw new AppError('Choose an instructor for this course', 400);
  let instructor_id = user.user_id;
  if (access.isAdmin(user) && body.instructor_id !== undefined) {
    const owner = await userModel.findById(parseId(body.instructor_id, 'instructor_id'));
    if (!owner || owner.role !== ROLES.INSTRUCTOR) {
      throw new AppError('instructor_id must belong to an instructor', 400);
    }
    instructor_id = owner.user_id;
  }

  const id = await courseModel.create({
    course_code: String(body.course_code).trim().toUpperCase(),
    course_name: String(body.course_name).trim(),
    description: body.description ?? null,
    instructor_id,
    status: body.status,
  });
  return courseModel.findById(id);
}

async function update(courseId, body, user) {
  await access.assertCourseManager(user, courseId);
  assertEnum(body.status, STATUSES, 'status');

  const fields = pick(body, ['course_code', 'course_name', 'description', 'status']);
  if (fields.course_code) fields.course_code = String(fields.course_code).trim().toUpperCase();
  if (body.instructor_id !== undefined) {
    if (!access.isAdmin(user)) throw new AppError('Only an admin can reassign the instructor', 403);
    fields.instructor_id = parseId(body.instructor_id, 'instructor_id');
    const owner = await userModel.findById(fields.instructor_id);
    if (!owner || owner.role !== ROLES.INSTRUCTOR) throw new AppError('Choose a valid instructor', 400);
  }
  if (!Object.keys(fields).length) throw new AppError('No valid fields to update', 400);

  await courseModel.update(courseId, fields);
  return courseModel.findById(courseId);
}

async function remove(courseId, user) {
  await access.assertCourseManager(user, courseId);
  await courseModel.remove(courseId);
}

const modulesReport = () => courseModel.getCourseModulesReport();

module.exports = { list, getById, create, update, remove, modulesReport };
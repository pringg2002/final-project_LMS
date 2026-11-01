const enrollmentService = require('../services/enrollment.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');

exports.list = async (req, res) => {
  const courseId = req.query.course_id ? parseId(req.query.course_id, 'course_id') : undefined;
  success(res, await enrollmentService.list(req.user, { courseId }), 'Enrollments retrieved successfully');
};

exports.get = async (req, res) =>
  success(res, await enrollmentService.getById(parseId(req.params.id), req.user), 'Enrollment retrieved successfully');

exports.create = async (req, res) =>
  created(res, await enrollmentService.create(req.body, req.user), 'Enrolled successfully');

exports.update = async (req, res) =>
  success(res, await enrollmentService.update(parseId(req.params.id), req.body, req.user), 'Enrollment updated successfully');

exports.remove = async (req, res) => {
  await enrollmentService.remove(parseId(req.params.id), req.user);
  success(res, null, 'Enrollment deleted successfully');
};
const courseService = require('../services/course.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');
exports.list = async (req, res) => success(res, await courseService.list(req.user), 'Courses retrieved successfully');
exports.get = async (req, res) =>
  success(res, await courseService.getById(parseId(req.params.id), req.user), 'Course retrieved successfully');
exports.create = async (req, res) =>
  created(res, await courseService.create(req.body, req.user), 'Course created successfully');
exports.update = async (req, res) =>
  success(res, await courseService.update(parseId(req.params.id), req.body, req.user), 'Course updated successfully');
exports.remove = async (req, res) => {
  await courseService.remove(parseId(req.params.id), req.user);
  success(res, null, 'Course deleted successfully');
};
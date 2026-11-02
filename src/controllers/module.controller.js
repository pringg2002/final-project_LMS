const moduleService = require('../services/module.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');
exports.listByCourse = async (req, res) =>
  success(res, await moduleService.listByCourse(parseId(req.params.courseId, 'courseId'), req.user), 'Modules retrieved successfully');
exports.createInCourse = async (req, res) =>
  created(res, await moduleService.create(parseId(req.params.courseId, 'courseId'), req.body, req.user), 'Module created successfully');
exports.get = async (req, res) =>
  success(res, await moduleService.getById(parseId(req.params.id), req.user), 'Module retrieved successfully');
exports.update = async (req, res) =>
  success(res, await moduleService.update(parseId(req.params.id), req.body, req.user), 'Module updated successfully');
exports.remove = async (req, res) => {
  await moduleService.remove(parseId(req.params.id), req.user);
  success(res, null, 'Module deleted successfully');
};
exports.listPrerequisites = async (req, res) =>
  success(res, await moduleService.listPrerequisites(parseId(req.params.moduleId, 'moduleId'), req.user), 'Prerequisites retrieved successfully');
exports.addPrerequisite = async (req, res) =>
  created(res, await moduleService.addPrerequisite(parseId(req.params.moduleId, 'moduleId'), req.body, req.user), 'Prerequisite added successfully');
exports.removePrerequisite = async (req, res) => {
  await moduleService.removePrerequisite(parseId(req.params.id), req.user);
  success(res, null, 'Prerequisite removed successfully');
};
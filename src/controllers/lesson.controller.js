lesson.controller.js


const lessonService = require('../services/lesson.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');

exports.listByModule = async (req, res) =>
  success(res, await lessonService.listByModule(parseId(req.params.moduleId, 'moduleId'), req.user), 'Lessons retrieved successfully');

exports.createInModule = async (req, res) =>
  created(res, await lessonService.create(parseId(req.params.moduleId, 'moduleId'), req.body, req.user), 'Lesson created successfully');

exports.get = async (req, res) =>
  success(res, await lessonService.getById(parseId(req.params.id), req.user), 'Lesson retrieved successfully');

exports.update = async (req, res) =>
  success(res, await lessonService.update(parseId(req.params.id), req.body, req.user), 'Lesson updated successfully');

exports.remove = async (req, res) => {
  await lessonService.remove(parseId(req.params.id), req.user);
  success(res, null, 'Lesson deleted successfully');
};

exports.listResources = async (req, res) =>
  success(res, await lessonService.listResources(parseId(req.params.lessonId, 'lessonId'), req.user), 'Resources retrieved successfully');

exports.createResource = async (req, res) =>
  created(res, await lessonService.createResource(parseId(req.params.lessonId, 'lessonId'), req.body, req.user), 'Resource created successfully');

exports.updateResource = async (req, res) =>
  success(res, await lessonService.updateResource(parseId(req.params.id), req.body, req.user), 'Resource updated successfully');

exports.removeResource = async (req, res) => {
  await lessonService.removeResource(parseId(req.params.id), req.user);
  success(res, null, 'Resource deleted successfully');
};

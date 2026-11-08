const discussionService = require('../services/discussion.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');

exports.listByModule = async (req, res) =>
  success(res, await discussionService.listByModule(parseId(req.params.moduleId, 'moduleId'), req.user), 'Discussions retrieved successfully');
exports.createInModule = async (req, res) =>
  created(res, await discussionService.create(parseId(req.params.moduleId, 'moduleId'), req.body, req.user), 'Discussion created successfully');
exports.get = async (req, res) =>
  success(res, await discussionService.getById(parseId(req.params.id), req.user), 'Discussion retrieved successfully');
exports.update = async (req, res) =>
  success(res, await discussionService.update(parseId(req.params.id), req.body, req.user), 'Discussion updated successfully');
exports.remove = async (req, res) => {
  await discussionService.remove(parseId(req.params.id), req.user);
  success(res, null, 'Discussion deleted successfully');
};

exports.listReplies = async (req, res) =>
  success(res, await discussionService.listReplies(parseId(req.params.discussionId, 'discussionId'), req.user), 'Replies retrieved successfully');
exports.createReply = async (req, res) =>
  created(res, await discussionService.createReply(parseId(req.params.discussionId, 'discussionId'), req.body, req.user), 'Reply posted successfully');
exports.updateReply = async (req, res) =>
  success(res, await discussionService.updateReply(parseId(req.params.id), req.body, req.user), 'Reply updated successfully');
exports.removeReply = async (req, res) => {
  await discussionService.removeReply(parseId(req.params.id), req.user);
  success(res, null, 'Reply deleted successfully');
};
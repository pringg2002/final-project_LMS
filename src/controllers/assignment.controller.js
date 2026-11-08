const assignmentService = require('../services/assignment.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');

exports.listByModule = async (req, res) =>
  success(res, await assignmentService.listByModule(parseId(req.params.moduleId, 'moduleId'), req.user), 'Assignments retrieved successfully');
exports.createInModule = async (req, res) =>
  created(res, await assignmentService.create(parseId(req.params.moduleId, 'moduleId'), req.body, req.user), 'Assignment created successfully');
exports.get = async (req, res) =>
  success(res, await assignmentService.getById(parseId(req.params.id), req.user), 'Assignment retrieved successfully');
exports.update = async (req, res) =>
  success(res, await assignmentService.update(parseId(req.params.id), req.body, req.user), 'Assignment updated successfully');
exports.remove = async (req, res) => {
  await assignmentService.remove(parseId(req.params.id), req.user);
  success(res, null, 'Assignment deleted successfully');
};

exports.listSubmissions = async (req, res) =>
  success(res, await assignmentService.listSubmissions(parseId(req.params.assignmentId, 'assignmentId'), req.user), 'Submissions retrieved successfully');
exports.createSubmission = async (req, res) =>
  created(res, await assignmentService.createSubmission(parseId(req.params.assignmentId, 'assignmentId'), req.body, req.user), 'Submission received');
exports.getSubmission = async (req, res) =>
  success(res, await assignmentService.getSubmission(parseId(req.params.id), req.user), 'Submission retrieved successfully');
exports.updateSubmission = async (req, res) =>
  success(res, await assignmentService.updateSubmission(parseId(req.params.id), req.body, req.user), 'Submission updated successfully');
exports.removeSubmission = async (req, res) => {
  await assignmentService.removeSubmission(parseId(req.params.id), req.user);
  success(res, null, 'Submission deleted successfully');
};
const adaptiveService = require('../services/adaptive.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');

exports.moduleAccess = async (req, res) =>
  success(res, await adaptiveService.getModuleAccess(req.user, parseId(req.params.id)), 'Module access evaluated successfully');

exports.courseProgress = async (req, res) =>
  success(res, await adaptiveService.getCourseProgress(req.user, parseId(req.params.courseId, 'courseId')), 'Course progress retrieved successfully');

// ---- instructor override ----
exports.listUnlocks = async (req, res) =>
  success(res, await adaptiveService.listUnlocks(req.user, parseId(req.params.moduleId, 'moduleId')), 'Unlocks retrieved successfully');

exports.unlockCandidates = async (req, res) =>
  success(res, await adaptiveService.unlockCandidates(req.user, parseId(req.params.moduleId, 'moduleId')), 'Unlock candidates retrieved successfully');

exports.grantUnlock = async (req, res) =>
  created(res, await adaptiveService.grantUnlock(req.user, parseId(req.params.moduleId, 'moduleId'), req.body), 'Module unlocked for the student');

exports.revokeUnlock = async (req, res) => {
  await adaptiveService.revokeUnlock(req.user, parseId(req.params.moduleId, 'moduleId'), parseId(req.params.studentId, 'studentId'));
  success(res, null, 'Unlock removed');
};

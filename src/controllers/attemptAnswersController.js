const answerService = require('../services/answer.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');

exports.listByAttempt = async (req, res) =>
  success(res, await answerService.listByAttempt(parseId(req.params.attemptId, 'attemptId'), req.user), 'Answers retrieved successfully');

exports.save = async (req, res) =>
  created(res, await answerService.save(parseId(req.params.attemptId, 'attemptId'), req.body, req.user), 'Answers saved successfully');

exports.update = async (req, res) =>
  success(res, await answerService.update(parseId(req.params.id), req.body, req.user), 'Answer updated successfully');

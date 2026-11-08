const quizService = require('../services/quiz.service');
const attemptService = require('../services/attempt.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');

exports.listByModule = async (req, res) =>
  success(res, await quizService.listByModule(parseId(req.params.moduleId, 'moduleId'), req.user), 'Quizzes retrieved successfully');

exports.createInModule = async (req, res) =>
  created(res, await quizService.create(parseId(req.params.moduleId, 'moduleId'), req.body, req.user), 'Quiz created successfully');

exports.get = async (req, res) =>
  success(res, await quizService.getById(parseId(req.params.id), req.user), 'Quiz retrieved successfully');

exports.update = async (req, res) =>
  success(res, await quizService.update(parseId(req.params.id), req.body, req.user), 'Quiz updated successfully');

exports.remove = async (req, res) => {
  await quizService.remove(parseId(req.params.id), req.user);
  success(res, null, 'Quiz deleted successfully');
};

exports.listQuestions = async (req, res) =>
  success(res, await quizService.listQuestions(parseId(req.params.quizId, 'quizId'), req.user), 'Questions retrieved successfully');

exports.createQuestion = async (req, res) =>
  created(res, await quizService.createQuestion(parseId(req.params.quizId, 'quizId'), req.body, req.user), 'Question created successfully');

exports.getQuestion = async (req, res) =>
  success(res, await quizService.getQuestion(parseId(req.params.id), req.user), 'Question retrieved successfully');

exports.updateQuestion = async (req, res) =>
  success(res, await quizService.updateQuestion(parseId(req.params.id), req.body, req.user), 'Question updated successfully');

exports.removeQuestion = async (req, res) => {
  await quizService.removeQuestion(parseId(req.params.id), req.user);
  success(res, null, 'Question deleted successfully');
};

exports.listAttempts = async (req, res) =>
  success(res, await attemptService.listByQuiz(parseId(req.params.quizId, 'quizId'), req.user), 'Attempts retrieved successfully');

exports.startAttempt = async (req, res) => {
  const { attempt, resumed } = await attemptService.start(parseId(req.params.quizId, 'quizId'), req.user);
  if (resumed) return success(res, attempt, 'Resumed your attempt in progress');
  return created(res, attempt, 'Attempt started');
};

exports.getAttempt = async (req, res) =>
  success(res, await attemptService.getById(parseId(req.params.id), req.user), 'Attempt retrieved successfully');

exports.submitAttempt = async (req, res) =>
  success(res, await attemptService.submit(parseId(req.params.id), req.user), 'Attempt submitted and graded');
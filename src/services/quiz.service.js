const quizModel = require('../models/quiz.models');
const questionModel = require('../models/question.models');
const moduleService = require('./module.service');
const access = require('./access.service');
const adaptiveService = require('./adaptive.service');
const { requireFields, assertEnum, assertNumber } = require('../lib/validate');
const { pick } = require('../utils/sql');
const AppError = require('../utils/AppError');

const QUIZ_STATUSES = ['draft', 'published', 'archived'];
const QUESTION_TYPES = ['multiple_choice', 'true_false', 'short_answer'];

async function listByModule(moduleId, user) {
  await moduleService.getById(moduleId, user);
  return quizModel.findByModule(moduleId, { publishedOnly: !access.isStaff(user) });
}

async function getById(quizId, user) {
  const quiz = await quizModel.findById(quizId);
  if (!quiz) throw new AppError('Quiz not found', 404);
  await moduleService.getById(quiz.module_id, user);
  if (quiz.status !== 'published' && !access.isStaff(user)) throw new AppError('Quiz not found', 404);
  return quiz;
}

async function create(moduleId, body, user) {
  const { module } = await access.assertModuleManager(user, moduleId);
  requireFields(body, ['title']);
  assertEnum(body.status, QUIZ_STATUSES, 'status');
  assertNumber(body.passing_score, 'passing_score', { min: 0, max: 100 });
  assertNumber(body.time_limit_minutes, 'time_limit_minutes', { min: 1, integer: true });
  assertNumber(body.attempt_limit, 'attempt_limit', { min: 1, integer: true });

  const id = await quizModel.create({
    module_id: moduleId,
    title: String(body.title).trim(),
    description: body.description ?? null,
    passing_score: body.passing_score ?? module.passing_score,
    time_limit_minutes: body.time_limit_minutes,
    attempt_limit: body.attempt_limit,
    status: body.status,
  });
  return quizModel.findById(id);
}

async function update(quizId, body, user) {
  const quiz = await quizModel.findById(quizId);
  if (!quiz) throw new AppError('Quiz not found', 404);
  await access.assertModuleManager(user, quiz.module_id);
  assertEnum(body.status, QUIZ_STATUSES, 'status');
  assertNumber(body.passing_score, 'passing_score', { min: 0, max: 100 });
  assertNumber(body.time_limit_minutes, 'time_limit_minutes', { min: 1, integer: true });
  assertNumber(body.attempt_limit, 'attempt_limit', { min: 1, integer: true });

  const fields = pick(body, ['title', 'description', 'passing_score', 'time_limit_minutes', 'attempt_limit', 'status']);
  if (!Object.keys(fields).length) throw new AppError('No valid fields to update', 400);
  await quizModel.update(quizId, fields);
  return quizModel.findById(quizId);
}

async function remove(quizId, user) {
  const quiz = await quizModel.findById(quizId);
  if (!quiz) throw new AppError('Quiz not found', 404);
  await access.assertModuleManager(user, quiz.module_id);
  await quizModel.remove(quizId);
}

const withoutAnswer = ({ correct_answer, ...rest }) => rest;

async function canSeeAnswers(user, quiz) {
  try { await access.assertModuleManager(user, quiz.module_id); return true; } catch (e) { return false; }
}

async function listQuestions(quizId, user) {
  const quiz = await getById(quizId, user);
  await adaptiveService.assertModuleAccess(user, quiz.module_id);
  const questions = await questionModel.findByQuiz(quizId);
  return (await canSeeAnswers(user, quiz)) ? questions : questions.map(withoutAnswer);
}

async function getQuestion(questionId, user) {
  const question = await questionModel.findById(questionId);
  if (!question) throw new AppError('Question not found', 404);
  const quiz = await getById(question.quiz_id, user);
  await adaptiveService.assertModuleAccess(user, quiz.module_id);
  return (await canSeeAnswers(user, quiz)) ? question : withoutAnswer(question);
}

function normalizeChoices({ question_type, options, correct_answer }) {
  if (question_type === 'true_false') {
    const answer = String(correct_answer).trim().toLowerCase();
    if (!['true', 'false'].includes(answer)) throw new AppError('correct_answer must be "true" or "false"', 400);
    return { options: ['True', 'False'], correct_answer: answer };
  }
  if (question_type === 'short_answer') {
    return { options: null, correct_answer: String(correct_answer).trim() };
  }
  if (!Array.isArray(options) || options.length < 2 || options.some((o) => typeof o !== 'string' || !o.trim())) {
    throw new AppError('multiple_choice questions need an "options" array of at least 2 non-empty strings', 400);
  }
  const clean = options.map((o) => o.trim());
  if (!clean.some((o) => o.toLowerCase() === String(correct_answer).trim().toLowerCase())) {
    throw new AppError('correct_answer must match one of the options', 400);
  }
  return { options: clean, correct_answer: String(correct_answer).trim() };
}

async function createQuestion(quizId, body, user) {
  const quiz = await quizModel.findById(quizId);
  if (!quiz) throw new AppError('Quiz not found', 404);
  await access.assertModuleManager(user, quiz.module_id);
  requireFields(body, ['question_text', 'correct_answer']);
  assertEnum(body.question_type, QUESTION_TYPES, 'question_type');
  assertNumber(body.points, 'points', { min: 0.01, max: 999 });
  assertNumber(body.question_order, 'question_order', { min: 1, integer: true });

  const question_type = body.question_type || 'multiple_choice';
  const choices = normalizeChoices({ ...body, question_type });
  const id = await questionModel.create({
    quiz_id: quizId,
    question_text: body.question_text,
    question_type,
    points: body.points,
    question_order: body.question_order ?? (await questionModel.nextOrder(quizId)),
    ...choices,
  });
  return questionModel.findById(id);
}

async function updateQuestion(questionId, body, user) {
  const current = await questionModel.findById(questionId);
  if (!current) throw new AppError('Question not found', 404);
  const quiz = await quizModel.findById(current.quiz_id);
  await access.assertModuleManager(user, quiz.module_id);
  assertEnum(body.question_type, QUESTION_TYPES, 'question_type');
  assertNumber(body.points, 'points', { min: 0.01, max: 999 });
  assertNumber(body.question_order, 'question_order', { min: 1, integer: true });

  const fields = pick(body, ['question_text', 'question_type', 'points', 'question_order']);
  if (['question_type', 'options', 'correct_answer'].some((k) => body[k] !== undefined)) {
    Object.assign(
      fields,
      normalizeChoices({
        question_type: body.question_type ?? current.question_type,
        options: body.options ?? current.options,
        correct_answer: body.correct_answer ?? current.correct_answer,
      })
    );
  }
  if (!Object.keys(fields).length) throw new AppError('No valid fields to update', 400);
  await questionModel.update(questionId, fields);
  return questionModel.findById(questionId);
}

async function removeQuestion(questionId, user) {
  const current = await questionModel.findById(questionId);
  if (!current) throw new AppError('Question not found', 404);
  const quiz = await quizModel.findById(current.quiz_id);
  await access.assertModuleManager(user, quiz.module_id);
  await questionModel.remove(questionId);
}

const quizQuestionsReport = () => quizModel.getQuizQuestionsReport();

module.exports = {
  listByModule, getById, create, update, remove,
  listQuestions, getQuestion, createQuestion, updateQuestion, removeQuestion,
  quizQuestionsReport, normalizeChoices,
};
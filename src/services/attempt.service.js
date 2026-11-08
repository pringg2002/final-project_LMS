const attemptModel = require('../models/attempt.models');
const quizModel = require('../models/quiz.models');
const questionModel = require('../models/question.models');
const moduleModel = require('../models/module.models');
const quizService = require('./quiz.service');
const enrollmentService = require('./enrollment.service');
const adaptiveService = require('./adaptive.service');
const notificationService = require('./notification.service');
const access = require('./access.service');
const { computeScore, meetsScore } = require('../lib/grading');
const { ROLES } = require('../lib/roles');
const AppError = require('../utils/AppError');

async function quizManagerOrNull(user, quiz) {
  try { await access.assertModuleManager(user, quiz.module_id); return true; } catch (e) { return false; }
}

async function start(quizId, user) {
  const quiz = await quizService.getById(quizId, user);
  const module = await moduleModel.findById(quiz.module_id);

  if (!(await enrollmentService.isEnrolled(user.user_id, module.course_id))) {
    throw new AppError('You must be enrolled in this course to take its quizzes', 403);
  }

  await adaptiveService.assertModuleAccess(user, quiz.module_id);

  if (quiz.question_count === 0 || Number(quiz.question_count) === 0) {
    throw new AppError('This quiz has no questions yet', 400);
  }

  const open = await attemptModel.findInProgress(quizId, user.user_id);
  if (open) return { attempt: open, resumed: true };

  const { count, maxNumber } = await attemptModel.countByStudentQuiz(quizId, user.user_id);
  if (quiz.attempt_limit && count >= quiz.attempt_limit) {
    throw new AppError(`Attempt limit reached (${quiz.attempt_limit})`, 403);
  }

  const id = await attemptModel.create({
    quiz_id: quizId,
    student_id: user.user_id,
    attempt_number: maxNumber + 1
  });

  return { attempt: await attemptModel.findById(id), resumed: false };
}

async function listByQuiz(quizId, user) {
  const quiz = await quizService.getById(quizId, user);

  if (user.role === ROLES.STUDENT) {
    return attemptModel.findByQuiz(quizId, { studentId: user.user_id });
  }

  await access.assertModuleManager(user, quiz.module_id);
  return attemptModel.findByQuiz(quizId);
}

async function loadAttempt(attemptId, user) {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) throw new AppError('Attempt not found', 404);

  const quiz = await quizModel.findById(attempt.quiz_id);
  const isManager = await quizManagerOrNull(user, quiz);

  if (attempt.student_id !== user.user_id && !isManager) {
    throw new AppError('You cannot access this attempt', 403);
  }

  return { attempt, quiz, isManager };
}

async function getById(attemptId, user) {
  const { attempt, quiz } = await loadAttempt(attemptId, user);
  const passed = attempt.status === 'graded'
    ? meetsScore(attempt.score, quiz.passing_score)
    : null;

  return { ...attempt, passing_score: quiz.passing_score, passed };
}

async function submit(attemptId, user) {
  const { attempt, quiz } = await loadAttempt(attemptId, user);

  if (attempt.student_id !== user.user_id) {
    throw new AppError('Only the student can submit this attempt', 403);
  }

  if (attempt.status !== 'in_progress') {
    throw new AppError('This attempt was already submitted', 409);
  }

  const earned = await attemptModel.sumEarnedPoints(attemptId);
  const possible = await questionModel.sumPoints(quiz.quiz_id);
  const score = computeScore(earned, possible);

  await attemptModel.update(attemptId, {
    score,
    status: 'graded',
    submitted_at: new Date()
  });

  const passed = meetsScore(score, quiz.passing_score);

  await notificationService.notify({
    user_id: user.user_id,
    title: passed ? 'Quiz passed' : 'Quiz not passed yet',
    message: `${quiz.title}: you scored ${score}% (passing score ${Number(quiz.passing_score)}%).`,
    notification_type: 'quiz',
    reference_id: quiz.quiz_id,
  });

  await adaptiveService.onProgressChanged(user.user_id, quiz.module_id);

  const { count } = await attemptModel.countByStudentQuiz(
    quiz.quiz_id,
    user.user_id
  );

  const attemptsLeft = quiz.attempt_limit
    ? Math.max(0, quiz.attempt_limit - count)
    : null;

  const finalAttempt = quiz.attempt_limit
    ? attemptsLeft === 0
    : false;

  if (finalAttempt && !passed) {
    await notificationService.notify({
      user_id: user.user_id,
      title: 'All quiz attempts used',
      message: `${quiz.title}: your last attempt (${score}%) is your final score. Ask your instructor if you need the next module unlocked.`,
      notification_type: 'quiz',
      reference_id: quiz.quiz_id,
    });
  }

  const graded = await attemptModel.findById(attemptId);

  return {
    ...graded,
    passing_score: quiz.passing_score,
    passed,
    points_earned: earned,
    points_possible: possible,
    attempt_limit: quiz.attempt_limit,
    attempts_left: attemptsLeft,
    final_attempt: finalAttempt,
  };
}

module.exports = { start, listByQuiz, getById, submit, loadAttempt };
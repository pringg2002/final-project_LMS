const answerModel = require('../models/answer.models');
const questionModel = require('../models/question.models');
const attemptService = require('./attempt.service');
const { gradeAnswer } = require('../lib/grading');
const AppError = require('../utils/AppError');

const GRACE_SECONDS = 30;
const MAX_ANSWERS_PER_REQUEST = 200;

function assertAttemptOpen(attempt, quiz) {
  if (attempt.status !== 'in_progress') {
    throw new AppError('This attempt is already submitted', 409);
  }

  if (quiz.time_limit_minutes) {
    const deadline =
      new Date(attempt.started_at).getTime() +
      (quiz.time_limit_minutes * 60 + GRACE_SECONDS) * 1000;

    if (Date.now() > deadline) {
      throw new AppError('Time limit exceeded - please submit your attempt', 400);
    }
  }
}

const hideGrading = ({ is_correct, points_earned, ...rest }) => rest;

async function listByAttempt(attemptId, user) {
  const { attempt, isManager } = await attemptService.loadAttempt(attemptId, user);
  const rows = await answerModel.findByAttempt(attemptId);
  const hide = !isManager && attempt.status === 'in_progress';
  return hide ? rows.map(hideGrading) : rows;
}
async function save(attemptId, body, user) {
  const { attempt, quiz } = await attemptService.loadAttempt(attemptId, user);

  if (attempt.student_id !== user.user_id) {
    throw new AppError('Only the student can answer this attempt', 403);
  }

  assertAttemptOpen(attempt, quiz);

  const items = Array.isArray(body.answers) ? body.answers : [body];

  if (!items.length || items.length > MAX_ANSWERS_PER_REQUEST) {
    throw new AppError(
      `Send between 1 and ${MAX_ANSWERS_PER_REQUEST} answers`,
      400
    );
  }

  const questions = await questionModel.findByQuiz(quiz.quiz_id);
  const byId = new Map(questions.map((q) => [q.question_id, q]));

  for (const item of items) {
    const question = byId.get(Number(item?.question_id));

    if (!question) {
      throw new AppError(
        `Question ${item?.question_id} does not belong to this quiz`,
        400
      );
    }

    const answerText =
      item.answer_text === undefined || item.answer_text === null
        ? ''
        : String(item.answer_text);

    if (answerText.length > 2000) {
      throw new AppError('Answer is too long', 400);
    }

    const graded = gradeAnswer(question, answerText);

    await answerModel.upsert({
      attempt_id: attemptId,
      question_id: question.question_id,
      answer_text: answerText,
      ...graded,
    });
  }

  return listByAttempt(attemptId, user);
}

async function update(answerId, body, user) {
  const answer = await answerModel.findById(answerId);

  if (!answer) {
    throw new AppError('Answer not found', 404);
  }

  const { attempt, quiz } = await attemptService.loadAttempt(
    answer.attempt_id,
    user
  );

  if (attempt.student_id !== user.user_id) {
    throw new AppError('Only the student can change this answer', 403);
  }

  assertAttemptOpen(attempt, quiz);

  if (body.answer_text === undefined) {
    throw new AppError('answer_text is required', 400);
  }

  const question = await questionModel.findById(answer.question_id);
  const text = String(body.answer_text);

  await answerModel.update(answerId, {
    answer_text: text,
    ...gradeAnswer(question, text)
  });

  const updated = await answerModel.findById(answerId);
  return hideGrading(updated);
}

module.exports = { listByAttempt, save, update };

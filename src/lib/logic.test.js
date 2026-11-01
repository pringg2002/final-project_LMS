const test = require('node:test');
const assert = require('node:assert/strict');
const { isCorrect, gradeAnswer, computeScore, meetsScore } = require('./grading');
const { evaluateMastery, describeGap } = require('./mastery');

test('score rounding matches DECIMAL(5,2)', () => {
  assert.equal(computeScore(3, 4), 75);
  assert.equal(computeScore(1, 3), 33.33);
  assert.equal(computeScore(0, 0), 0);
});

test('EDGE CASE: 74% does not pass, 75% does', () => {
  assert.equal(meetsScore(74, 75), false);
  assert.equal(meetsScore(74.99, 75), false);
  assert.equal(meetsScore(75, 75), true);
  assert.equal(meetsScore('75.00', '75.00'), true);
});

test('answer matching is case/space-insensitive and supports alternatives', () => {
  const q = { correct_answer: 'Primary Key|PK', points: 2 };
  assert.equal(isCorrect(q, '  primary key '), true);
  assert.equal(isCorrect(q, 'pk'), true);
  assert.equal(isCorrect(q, ''), false);
  assert.deepEqual(gradeAnswer(q, 'pk'), { is_correct: true, points_earned: 2 });
  assert.deepEqual(gradeAnswer(q, 'nope'), { is_correct: false, points_earned: 0 });
});

const base = { lessons_total: 3, lessons_completed: 3, minimum_score: 75 };

test('mastered: all lessons done and latest quiz >= 75', () => {
  assert.equal(evaluateMastery({ ...base, quiz_scores: [75] }).mastered, true);
  assert.equal(evaluateMastery({ ...base, quiz_scores: [100] }).mastered, true);
});

test('NOT mastered at 74% even with every lesson completed', () => {
  const r = evaluateMastery({ ...base, quiz_scores: [74] });
  assert.equal(r.mastered, false);
  assert.equal(r.lessons_done, true);
  assert.equal(r.quizzes_done, false);
});

test('NOT mastered when a lesson is missing, even with a perfect quiz', () => {
  assert.equal(evaluateMastery({ ...base, lessons_completed: 2, quiz_scores: [100] }).mastered, false);
});

test('NOT mastered when a published quiz was never graded', () => {
  assert.equal(evaluateMastery({ ...base, quiz_scores: [null] }).mastered, false);
});

test('with several quizzes every one must reach the minimum', () => {
  assert.equal(evaluateMastery({ ...base, quiz_scores: [90, 74] }).mastered, false);
  assert.equal(evaluateMastery({ ...base, quiz_scores: [90, 80] }).mastered, true);
});

test('a module with no lessons and no quizzes counts as mastered', () => {
  assert.equal(evaluateMastery({ lessons_total: 0, lessons_completed: 0, quiz_scores: [], minimum_score: 75 }).mastered, true);
});

test('the explanation tells the student what is missing', () => {
  const r = evaluateMastery({ lessons_total: 3, lessons_completed: 1, quiz_scores: [74], minimum_score: 75 });
  const text = describeGap('Intro', r, 75);
  assert.match(text, /1\/3/);
  assert.match(text, /74%/);
});

const { evaluateOverride, isExhausted } = require('./mastery');

const quiz = (over) => ({ quiz_id: 1, title: 'Quiz 1', score: 70, graded_attempts: 3, attempt_limit: 3, ...over });

test('a quiz is exhausted only when graded attempts reach the limit', () => {
  assert.equal(isExhausted(quiz({ graded_attempts: 3 })), true);
  assert.equal(isExhausted(quiz({ graded_attempts: 2 })), false);
  assert.equal(isExhausted(quiz({ attempt_limit: null, graded_attempts: 50 })), false);
});

test('override allowed: lessons done, every attempt used, last score still below 75', () => {
  const r = evaluateOverride({ lessons_done: true, quizzes: [quiz({ score: 74 })], minimum_score: 75 });
  assert.equal(r.eligible, true);
});

test('override NOT allowed while the student still has attempts left', () => {
  const r = evaluateOverride({ lessons_done: true, quizzes: [quiz({ graded_attempts: 2 })], minimum_score: 75 });
  assert.equal(r.eligible, false);
  assert.match(r.reason, /attempts left/);
});

test('override NOT allowed for unlimited-attempt quizzes', () => {
  const r = evaluateOverride({ lessons_done: true, quizzes: [quiz({ attempt_limit: null })], minimum_score: 75 });
  assert.equal(r.eligible, false);
});

test('override NOT allowed when lessons are unfinished', () => {
  const r = evaluateOverride({ lessons_done: false, quizzes: [quiz()], minimum_score: 75 });
  assert.equal(r.eligible, false);
  assert.match(r.reason, /lessons/);
});

test('override NOT needed when the student already passes', () => {
  const r = evaluateOverride({ lessons_done: true, quizzes: [quiz({ score: 75 })], minimum_score: 75 });
  assert.equal(r.eligible, false);
});

test('with two quizzes every FAILING one must be exhausted; a passed quiz is ignored', () => {
  const passed = quiz({ quiz_id: 2, score: 90, graded_attempts: 1 });
  assert.equal(evaluateOverride({ lessons_done: true, quizzes: [passed, quiz()], minimum_score: 75 }).eligible, true);
  assert.equal(evaluateOverride({ lessons_done: true, quizzes: [passed, quiz({ graded_attempts: 1 })], minimum_score: 75 }).eligible, false);
});

test('the last attempt is the final score: passing earlier then scoring lower is judged on the last one', () => {
  assert.equal(evaluateMastery({ ...base, quiz_scores: [60] }).mastered, false);
});

test('gap text says the last score is final once attempts are used up', () => {
  const r = evaluateMastery({ ...base, quiz_scores: [70] });
  const text = describeGap('Intro', r, 75, { attempts_exhausted: true });
  assert.match(text, /final/);
  assert.match(text, /70%/);
});
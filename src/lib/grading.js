const normalize = (value) => String(value ?? '').trim().toLowerCase();

function isCorrect(question, answerText) {
  const given = normalize(answerText);
  if (given === '') return false;
  return String(question.correct_answer)
    .split('|')
    .map(normalize)
    .includes(given);
}

function gradeAnswer(question, answerText) {
  const correct = isCorrect(question, answerText);
  return { is_correct: correct, points_earned: correct ? Number(question.points) : 0 };
}

function computeScore(pointsEarned, pointsPossible) {
  const possible = Number(pointsPossible);
  if (!possible) return 0;
  return Math.round((Number(pointsEarned) / possible) * 10000) / 100;
}

const meetsScore = (score, required) => Number(score) >= Number(required);

module.exports = {
    normalize,
    isCorrect,
    gradeAnswer,
    computeScore,
    meetsScore };

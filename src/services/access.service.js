const AppError = require('../utils/AppError');

function isStaff(user) {
  return user && (user.role === 'admin' || user.role === 'instructor');
}

async function assertCourseManager(user, courseId) {
  if (!isStaff(user)) {
    throw new AppError('Unauthorized: Staff access required', 403);
  }
}

async function getCourseOrFail(courseId) {
  return true;
}

module.exports = {
  isStaff,
  assertCourseManager,
  getCourseOrFail,
};
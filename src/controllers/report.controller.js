const userService = require('../services/user.service');
const courseService = require('../services/course.service');
const lessonService = require('../services/lesson.service');
const enrollmentService = require('../services/enrollment.service');
const quizService = require('../services/quiz.service');
const assignmentService = require('../services/assignment.service');
const { success } = require('../utils/response');

exports.studentRoles = async (req, res) => {
  success(res, await userService.rolesReport(), 'Student roles report retrieved successfully');
};

exports.courseModules = async (req, res) => {
  success(res, await courseService.modulesReport(), 'Course modules report retrieved successfully');
};

exports.lessonsWithoutResources = async (req, res) => {
  success(res, await lessonService.lessonsWithoutResourcesReport(), 'Lessons without resources report retrieved successfully');
};

exports.enrollmentActivity = async (req, res) => {
  success(res, await enrollmentService.activityReport(), 'Enrollment activity report retrieved successfully');
};

exports.quizQuestions = async (req, res) => {
  success(res, await quizService.quizQuestionsReport(), 'Quiz questions report retrieved successfully');
};

exports.assignmentsWithoutSubmissions = async (req, res) => {
  success(res, await assignmentService.assignmentsWithoutSubmissionsReport(), 'Assignments without submissions report retrieved successfully');
};
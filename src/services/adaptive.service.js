const moduleModel = require('../models/module.models');
const courseModel = require('../models/course.models');
const prerequisiteModel = require('../models/prerequisite.models');
const enrollmentModel = require('../models/enrollment.models');
const adaptiveModel = require('../models/adaptive.models');
const notificationModel = require('../models/notification.models');
const userModel = require('../models/user.models');
const notificationService = require('./notification.service');
const access = require('./access.service');
const { evaluateMastery, evaluateOverride, isExhausted, describeGap } = require('../lib/mastery');
const { parseId, requireFields } = require('../lib/validate');
const { ROLES } = require('../lib/roles');
const AppError = require('../utils/AppError');

async function masteryOf(studentId, moduleId, requiredScore) {
  const lessons = await adaptiveModel.lessonCounts(studentId, moduleId);
  const quizzes = await adaptiveModel.latestQuizScores(studentId, moduleId);
  const evaluation = evaluateMastery({
    lessons_total: lessons.total,
    lessons_completed: lessons.completed,
    quiz_scores: quizzes.map((q) => q.score),
    minimum_score: requiredScore,
  });
  const override = evaluateOverride({ lessons_done: evaluation.lessons_done, quizzes, minimum_score: requiredScore });
  return { ...evaluation, quizzes, override };
}

async function prerequisiteDetails(studentId, prerequisites) {
  const details = [];
  for (const p of prerequisites) {
    const m = await masteryOf(studentId, p.prerequisite_module_id, p.minimum_score);
    const failing = m.quizzes.filter((q) => q.score === null || q.score < Number(p.minimum_score));
    const attemptsExhausted = !m.mastered && failing.length > 0 && failing.every(isExhausted);
    details.push({
      prerequisite_module_id: p.prerequisite_module_id,
      title: p.prerequisite_title,
      minimum_score: Number(p.minimum_score),
      lessons_completed: m.lessons_completed,
      lessons_total: m.lessons_total,
      latest_score: m.latest_score,
      mastered: m.mastered,
      quizzes: m.quizzes.map((q) => ({
        quiz_id: q.quiz_id,
        title: q.title,
        attempts_used: q.graded_attempts,
        attempt_limit: q.attempt_limit,
        attempts_exhausted: isExhausted(q),
        final_score: isExhausted(q) ? q.score : null,
      })),
      attempts_exhausted: attemptsExhausted,
      can_request_override: m.override.eligible,
      override_note: m.mastered ? null : m.override.reason,
      gap: m.mastered ? null : describeGap(p.prerequisite_title, m, p.minimum_score, { attempts_exhausted: attemptsExhausted }),
    });
  }
  return details;
}

async function getModuleAccess(user, moduleId) {
  const module = await moduleModel.findById(moduleId);
  if (!module) throw new AppError('Module not found', 404);
  const course = await courseModel.findById(module.course_id);

  if (access.isStaff(user)) {
    return { module_id: moduleId, unlocked: true, reason: 'Instructors and admins can open every module.', prerequisites: [], override: null };
  }
  if (module.status !== 'published' || course.status !== 'published') throw new AppError('Module not found', 404);

  const enrollment = await enrollmentModel.findByStudentCourse(user.user_id, module.course_id);
  if (!enrollment || enrollment.status === 'dropped') {
    return { module_id: moduleId, unlocked: false, reason: 'Enroll in this course to unlock its modules.', prerequisites: [], override: null };
  }

  const prerequisites = await prerequisiteModel.findByModule(moduleId);
  if (!prerequisites.length) {
    return { module_id: moduleId, unlocked: true, reason: 'No prerequisites for this module.', prerequisites: [], override: null };
  }

  const details = await prerequisiteDetails(user.user_id, prerequisites);
  const unmet = details.filter((d) => !d.mastered);
  if (unmet.length === 0) {
    return { module_id: moduleId, unlocked: true, reason: 'Prerequisite module completed with required score.', prerequisites: details, override: null };
  }

  const unlock = await adaptiveModel.findUnlock(user.user_id, moduleId);
  if (unlock) {
    return {
      module_id: moduleId,
      unlocked: true,
      reason: `Unlocked by your instructor (${unlock.unlocked_by_name}): ${unlock.reason}`,
      prerequisites: details,
      override: { unlocked_by: unlock.unlocked_by_name, reason: unlock.reason, created_at: unlock.created_at },
    };
  }

  return {
    module_id: moduleId,
    unlocked: false,
    reason: `Locked. Still needed: ${unmet.map((d) => d.gap).join(' ')}`,
    prerequisites: details,
    override: null,
  };
}

async function assertModuleAccess(user, moduleId) {
  if (access.isStaff(user)) return;
  const result = await getModuleAccess(user, moduleId);
  if (!result.unlocked) throw new AppError(result.reason, 403);
}

async function getCourseProgress(user, courseId) {
  const course = await access.getCourseOrFail(courseId);
  const staff = access.isStaff(user);
  if (!staff && course.status !== 'published') throw new AppError('Course not found', 404);

  const modules = await moduleModel.findByCourse(courseId, { publishedOnly: !staff });
  const result = [];
  for (const m of modules) {
    const gate = await getModuleAccess(user, m.module_id);
    let own = { mastered: null, lessons_completed: null, lessons_total: null, latest_score: null };
    if (!staff) own = await masteryOf(user.user_id, m.module_id, m.passing_score);
    result.push({
      module_id: m.module_id,
      title: m.title,
      module_order: m.module_order,
      passing_score: Number(m.passing_score),
      unlocked: gate.unlocked,
      reason: gate.reason,
      prerequisites: gate.prerequisites,
      override: gate.override,
      mastered: own.mastered,
      lessons_completed: own.lessons_completed,
      lessons_total: own.lessons_total,
      latest_score: own.latest_score,
    });
  }
  return result;
}

async function onProgressChanged(studentId, moduleId) {
  try {
    const student = { user_id: studentId, role: 'student' };
    for (const dependentId of await prerequisiteModel.findDependents(moduleId)) {
      const dependent = await moduleModel.findById(dependentId);
      if (!dependent || dependent.status !== 'published') continue;
      const gate = await getModuleAccess(student, dependentId);
      if (!gate.unlocked || gate.override) continue;

      const note = { user_id: studentId, notification_type: 'progress', reference_id: dependentId, title: 'Module unlocked' };
      if (await notificationModel.exists(note)) continue;
      await notificationService.notify({ ...note, message: `Great work! "${dependent.title}" is now available.` });
    }
  } catch (err) {
    console.error('[adaptive] could not evaluate unlocks:', err.message);
  }
}

async function overrideStatus(studentId, prerequisites) {
  const details = await prerequisiteDetails(studentId, prerequisites);
  const unmet = details.filter((d) => !d.mastered);
  return { details, unmet, allEligible: unmet.length > 0 && unmet.every((d) => d.can_request_override) };
}

async function grantUnlock(user, moduleId, body) {
  const { module } = await access.assertModuleManager(user, moduleId);
  requireFields(body, ['student_id', 'reason']);
  const studentId = parseId(body.student_id, 'student_id');
  const reason = String(body.reason).trim();
  if (reason.length < 3 || reason.length > 255) throw new AppError('reason must be 3-255 characters', 400);

  const student = await userModel.findById(studentId);
  if (!student || student.role !== ROLES.STUDENT) throw new AppError('Student not found', 404);
  const enrollment = await enrollmentModel.findByStudentCourse(studentId, module.course_id);
  if (!enrollment || enrollment.status === 'dropped') throw new AppError('This student is not enrolled in the course', 400);

  const prerequisites = await prerequisiteModel.findByModule(moduleId);
  if (!prerequisites.length) throw new AppError('This module has no prerequisites, so there is nothing to unlock', 400);

  const { unmet, allEligible } = await overrideStatus(studentId, prerequisites);
  if (!unmet.length) throw new AppError('The student already unlocked this module on their own', 409);
  if (!allEligible) {
    const blocker = unmet.find((d) => !d.can_request_override);
    throw new AppError(`Cannot unlock yet - "${blocker.title}": ${blocker.override_note}`, 400);
  }

  const id = await adaptiveModel.createUnlock({ module_id: moduleId, student_id: studentId, unlocked_by: user.user_id, reason });
  await notificationService.notify({
    user_id: studentId,
    title: 'Module unlocked by your instructor',
    message: `"${module.title}" was unlocked for you. Reason: ${reason}`,
    notification_type: 'progress',
    reference_id: moduleId,
  });
  return { unlock_id: id, module_id: moduleId, student_id: studentId, student_name: `${student.first_name} ${student.last_name}`, reason };
}

async function revokeUnlock(user, moduleId, studentId) {
  await access.assertModuleManager(user, moduleId);
  const affected = await adaptiveModel.deleteUnlock(studentId, moduleId);
  if (!affected) throw new AppError('No unlock found for this student and module', 404);
}

async function listUnlocks(user, moduleId) {
  await access.assertModuleManager(user, moduleId);
  return adaptiveModel.listUnlocks(moduleId);
}

async function unlockCandidates(user, moduleId) {
  const { module } = await access.assertModuleManager(user, moduleId);
  const prerequisites = await prerequisiteModel.findByModule(moduleId);
  if (!prerequisites.length) return [];

  const candidates = [];
  for (const s of await adaptiveModel.enrolledStudents(module.course_id)) {
    if (await adaptiveModel.findUnlock(s.user_id, moduleId)) continue;
    const { details, unmet, allEligible } = await overrideStatus(s.user_id, prerequisites);
    if (!allEligible) continue;
    candidates.push({
      student_id: s.user_id,
      student_name: s.student_name,
      blocked_by: unmet.map((d) => ({
        module_id: d.prerequisite_module_id,
        title: d.title,
        final_score: d.latest_score,
        minimum_score: d.minimum_score,
        quizzes: d.quizzes,
      })),
    });
  }
  return candidates;
}

module.exports = {
  getModuleAccess,
  assertModuleAccess,
  getCourseProgress,
  onProgressChanged,
  grantUnlock,
  revokeUnlock,
  listUnlocks,
  unlockCandidates,
};

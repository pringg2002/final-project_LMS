const assignmentModel = require('../models/assignment.model');
const submissionModel = require('../models/submission.models');
const moduleModel = require('../models/module.model');
const moduleService = require('./module.service');
const enrollmentService = require('./enrollment.service');
const adaptiveService = require('./adaptive.service');
const notificationService = require('./notification.service');
const access = require('./access.service');
const { requireFields, assertEnum, assertNumber, assertHttpUrl } = require('../lib/validate');
const { pick, toMysqlDate } = require('../utils/sql');
const { ROLES } = require('../lib/roles');
const AppError = require('../utils/AppError');

const STATUSES = ['draft', 'published', 'closed'];

async function isManager(user, moduleId) {
  try { await access.assertModuleManager(user, moduleId); return true; } catch (e) { return false; }
}

async function listByModule(moduleId, user) {
  await moduleService.getById(moduleId, user);
  await adaptiveService.assertModuleAccess(user, moduleId);
  return assignmentModel.findByModule(moduleId, { publishedOnly: !access.isStaff(user) });
}

async function getById(assignmentId, user) {
  const a = await assignmentModel.findById(assignmentId);
  if (!a) throw new AppError('Assignment not found', 404);
  await moduleService.getById(a.module_id, user);
  if (a.status === 'draft' && !access.isStaff(user)) throw new AppError('Assignment not found', 404);
  await adaptiveService.assertModuleAccess(user, a.module_id); // students: module must be unlocked
  return a;
}

async function create(moduleId, body, user) {
  await access.assertModuleManager(user, moduleId);
  requireFields(body, ['title']);
  assertEnum(body.status, STATUSES, 'status');
  assertNumber(body.max_score, 'max_score', { min: 0.01, max: 999 });
  const due = toMysqlDate(body.due_date);
  if (due === undefined) throw new AppError('due_date is not a valid date', 400);

 const id = await assignmentModel.create({
    module_id: moduleId,
    created_by: user.user_id,
    title: String(body.title).trim(),
    instructions: body.instructions ?? null,
    due_date: due,
    max_score: body.max_score,
    status: body.status,
  });
  return assignmentModel.findById(id);
}

async function update(assignmentId, body, user) {
  const a = await assignmentModel.findById(assignmentId);
  if (!a) throw new AppError('Assignment not found', 404);
  await access.assertModuleManager(user, a.module_id);
  assertEnum(body.status, STATUSES, 'status');
  assertNumber(body.max_score, 'max_score', { min: 0.01, max: 999 });

  const fields = pick(body, ['title', 'instructions', 'max_score', 'status']);
  if (body.due_date !== undefined) {
    const due = toMysqlDate(body.due_date);
    if (due === undefined) throw new AppError('due_date is not a valid date', 400);
    fields.due_date = due;
  }
  if (!Object.keys(fields).length) throw new AppError('No valid fields to update', 400);
  await assignmentModel.update(assignmentId, fields);
  return assignmentModel.findById(assignmentId);
}

async function remove(assignmentId, user) {
  const a = await assignmentModel.findById(assignmentId);
  if (!a) throw new AppError('Assignment not found', 404);
  await access.assertModuleManager(user, a.module_id);
  await assignmentModel.remove(assignmentId);
}

async function listSubmissions(assignmentId, user) {
  const a = await getById(assignmentId, user);
  if (user.role === ROLES.STUDENT) return submissionModel.findByAssignment(assignmentId, { studentId: user.user_id });
  await access.assertModuleManager(user, a.module_id);
  return submissionModel.findByAssignment(assignmentId);
}

async function loadSubmission(submissionId, user) {
  const s = await submissionModel.findById(submissionId);
  if (!s) throw new AppError('Submission not found', 404);
  const a = await assignmentModel.findById(s.assignment_id);
  const manager = await isManager(user, a.module_id);
  if (s.student_id !== user.user_id && !manager) throw new AppError('You cannot access this submission', 403);
  return { submission: s, assignment: a, manager };
}

const getSubmission = async (id, user) => (await loadSubmission(id, user)).submission;
const isLate = (assignment) => !!assignment.due_date && new Date(assignment.due_date) < new Date();

function checkContent(body) {
  if (body.file_url !== undefined && body.file_url !== null && body.file_url !== '') assertHttpUrl(body.file_url, 'file_url');
  const hasText = typeof body.submission_text === 'string' && body.submission_text.trim() !== '';
  const hasFile = typeof body.file_url === 'string' && body.file_url.trim() !== '';
  return { hasText, hasFile };
}

async function createSubmission(assignmentId, body, user) {
  const a = await getById(assignmentId, user);
  if (a.status !== 'published') throw new AppError('This assignment is not accepting submissions', 403);
  const module = await moduleModel.findById(a.module_id);
  if (!(await enrollmentService.isEnrolled(user.user_id, module.course_id))) {
    throw new AppError('You must be enrolled in this course to submit work', 403);
  }
  await adaptiveService.assertModuleAccess(user, a.module_id);
  const { hasText, hasFile } = checkContent(body);
  if (!hasText && !hasFile) throw new AppError('Provide submission_text and/or file_url', 400);

  if (await submissionModel.findByStudentAssignment(user.user_id, assignmentId)) {
    throw new AppError('You already submitted this assignment - edit your submission instead (PUT)', 409);
  }
  const id = await submissionModel.create({
    assignment_id: assignmentId,
    student_id: user.user_id,
    submission_text: hasText ? body.submission_text : null,
    file_url: hasFile ? body.file_url.trim() : null,
    status: isLate(a) ? 'late' : 'submitted',
  });
  return submissionModel.findById(id);
}

async function updateSubmission(submissionId, body, user) {
  const { submission, assignment, manager } = await loadSubmission(submissionId, user);

  if (user.role === ROLES.STUDENT) {
    if (submission.status === 'graded') throw new AppError('Graded submissions can no longer be edited', 403);
    if (assignment.status !== 'published') throw new AppError('This assignment is closed', 403);
    if (body.score !== undefined || body.feedback !== undefined) throw new AppError('Only your instructor can grade', 403);
    const { hasText, hasFile } = checkContent({ submission_text: body.submission_text ?? submission.submission_text, file_url: body.file_url ?? submission.file_url });
    if (!hasText && !hasFile) throw new AppError('A submission needs text and/or a file link', 400);
    await submissionModel.update(submissionId, {
      ...pick(body, ['submission_text', 'file_url']),
      submitted_at: new Date(),
      status: isLate(assignment) ? 'late' : 'submitted',
    });
    return submissionModel.findById(submissionId);
  }

  if (!manager) throw new AppError('Only the assignment instructor or an admin can grade', 403);
  assertNumber(body.score, 'score', { min: 0, max: Number(assignment.max_score) });
  if (body.score === undefined && body.feedback === undefined) throw new AppError('Provide score and/or feedback', 400);
  const fields = pick(body, ['score', 'feedback']);
  fields.status = 'graded';
  await submissionModel.update(submissionId, fields);

await notificationService.notify({
    user_id: submission.student_id,
    title: 'Assignment graded',
    message: `${assignment.title}: ${body.score !== undefined ? `${body.score}/${Number(assignment.max_score)}` : 'feedback added'}.`,
    notification_type: 'progress',
    reference_id: assignment.assignment_id,
  });
  return submissionModel.findById(submissionId);
}

async function removeSubmission(submissionId, user) {
  const { submission, manager } = await loadSubmission(submissionId, user);
  if (!manager && submission.status === 'graded') throw new AppError('Graded submissions cannot be deleted', 403);
  await submissionModel.remove(submissionId);
}

const assignmentsWithoutSubmissionsReport = () => assignmentModel.getAssignmentsWithoutSubmissionsReport();

module.exports = {
  listByModule, getById, create, update, remove,
  listSubmissions, getSubmission, createSubmission, updateSubmission, removeSubmission,
  assignmentsWithoutSubmissionsReport,
};
const progressModel = require('../models/progress.models');
const lessonService = require('./lesson.service');
const adaptiveService = require('./adaptive.service');
const access = require('./access.service');
const { requireFields, assertEnum, assertNumber, parseId } = require('../lib/validate');
const AppError = require('../utils/AppError');

const STATUSES = ['not_started', 'in_progress', 'completed'];

function normalize({ status, progress_percent }) {
  let pct = progress_percent === undefined ? undefined : Number(progress_percent);
  let st = status;
  if (st === 'completed') pct = 100;
  else if (st === undefined) st = pct === 100 ? 'completed' : 'in_progress';
  if (pct === undefined) pct = 0;
  return { status: st, progress_percent: pct };
}

async function record(body, user) {
  requireFields(body, ['lesson_id']);
  assertEnum(body.status, STATUSES, 'status');
  assertNumber(body.progress_percent, 'progress_percent', { min: 0, max: 100 });

  const lessonId = parseId(body.lesson_id, 'lesson_id');
  const lesson = await lessonService.getById(lessonId, user);
  const next = normalize(body);
  const existing = await progressModel.findByStudentLesson(user.user_id, lessonId);

  if (!existing) {
    const id = await progressModel.create({
      student_id: user.user_id,
      lesson_id: lessonId,
      status: next.status,
      progress_percent: next.progress_percent,
      completed: next.status === 'completed',
    });
    if (next.status === 'completed') await adaptiveService.onProgressChanged(user.user_id, lesson.module_id);
    return { progress: await progressModel.findById(id), lesson };
  }

  
  if (existing.status === 'completed') {
    await progressModel.update(existing.progress_id, { last_accessed_at: new Date() });
    return { progress: await progressModel.findById(existing.progress_id), lesson };
  }

  const keepPercent = body.progress_percent === undefined && next.status !== 'completed';
  const fields = {
    status: next.status,
    progress_percent: keepPercent ? existing.progress_percent : next.progress_percent,
    last_accessed_at: new Date(),
  };
  if (next.status === 'completed') fields.completed_at = new Date();
  await progressModel.update(existing.progress_id, fields);
  if (next.status === 'completed') await adaptiveService.onProgressChanged(user.user_id, lesson.module_id);
  return { progress: await progressModel.findById(existing.progress_id), lesson };
}

async function updateById(progressId, body, user) {
  const row = await progressModel.findById(progressId);
  if (!row) throw new AppError('Progress record not found', 404);
  if (row.student_id !== user.user_id) throw new AppError('You can only update your own progress', 403);
  return record({ ...body, lesson_id: row.lesson_id }, user);
}

const listMine = (user) => progressModel.findByStudent(user.user_id);

async function getForLesson(lessonId, user) {
  await lessonService.getById(lessonId, user);
  if (access.isStaff(user)) return progressModel.findByLesson(lessonId);
  return progressModel.findByStudentLesson(user.user_id, lessonId);
}

module.exports = { record, updateById, listMine, getForLesson, normalize };

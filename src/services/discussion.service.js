const discussionModel = require('../models/discussion.models');
const moduleService = require('./module.service');
const enrollmentService = require('./enrollment.service');
const notificationService = require('./notification.service');
const access = require('./access.service');
const { requireFields, assertEnum } = require('../lib/validate');
const { pick } = require('../utils/sql');
const AppError = require('../utils/AppError');

async function assertCanParticipate(user, moduleId) {
  if (user.role === 'admin') throw new AppError('Assignments and discussions are only for students and instructors', 403);
  const module = await moduleService.getById(moduleId, user);
  if (!access.isStaff(user) && !(await enrollmentService.isEnrolled(user.user_id, module.course_id))) {
    throw new AppError('Enroll in this course to join its discussions', 403);
  }
  return module;
}

async function isManager(user, moduleId) {
  try { await access.assertModuleManager(user, moduleId); return true; } catch (e) { return false; }
}

async function listByModule(moduleId, user) {
  await assertCanParticipate(user, moduleId);
  return discussionModel.findByModule(moduleId);
}

async function getById(discussionId, user) {
  const d = await discussionModel.findById(discussionId);
  if (!d) throw new AppError('Discussion not found', 404);
  await assertCanParticipate(user, d.module_id);
  return d;
}

async function create(moduleId, body, user) {
  await assertCanParticipate(user, moduleId);
  requireFields(body, ['title', 'content']);
  const id = await discussionModel.create({
    module_id: moduleId,
    author_id: user.user_id,
    title: String(body.title).trim(),
    content: body.content,
  });
  return discussionModel.findById(id);
}

async function update(discussionId, body, user) {
  const d = await getById(discussionId, user);
  const manager = await isManager(user, d.module_id);
  if (d.author_id !== user.user_id && !manager) throw new AppError('Only the author or the instructor can edit this discussion', 403);
  assertEnum(body.status, ['active', 'closed'], 'status');

  const fields = pick(body, ['title', 'content', 'status']);
  if (!Object.keys(fields).length) throw new AppError('No valid fields to update', 400);
  await discussionModel.update(discussionId, fields);
  return discussionModel.findById(discussionId);
}

async function remove(discussionId, user) {
  const d = await getById(discussionId, user);
  if (d.author_id !== user.user_id && !(await isManager(user, d.module_id))) {
    throw new AppError('Only the author or the instructor can delete this discussion', 403);
  }
  await discussionModel.remove(discussionId);
}

async function listReplies(discussionId, user) {
  await getById(discussionId, user);
  return discussionModel.findRepliesByDiscussion(discussionId);
}

async function createReply(discussionId, body, user) {
  const d = await getById(discussionId, user);
  if (d.status === 'closed') throw new AppError('This discussion is closed', 403);
  requireFields(body, ['content']);

  const id = await discussionModel.createReply({ discussion_id: discussionId, author_id: user.user_id, content: body.content });
  if (d.author_id !== user.user_id) {
    await notificationService.notify({
      user_id: d.author_id,
      title: 'New reply to your discussion',
      message: `${user.first_name} ${user.last_name} replied to "${d.title}".`,
      notification_type: 'system',
      reference_id: d.discussion_id,
    });
  }
  return discussionModel.findReplyById(id);
}

async function loadReply(replyId, user) {
  const reply = await discussionModel.findReplyById(replyId);
  if (!reply || reply.status === 'deleted') throw new AppError('Reply not found', 404);
  const d = await getById(reply.discussion_id, user);
  return { reply, discussion: d };
}

async function updateReply(replyId, body, user) {
  const { reply } = await loadReply(replyId, user);
  if (reply.author_id !== user.user_id) throw new AppError('You can only edit your own replies', 403);
  requireFields(body, ['content']);
  await discussionModel.updateReply(replyId, { content: body.content });
  return discussionModel.findReplyById(replyId);
}

async function removeReply(replyId, user) {
  const { reply, discussion } = await loadReply(replyId, user);
  if (reply.author_id !== user.user_id && !(await isManager(user, discussion.module_id))) {
    throw new AppError('Only the author or the instructor can delete this reply', 403);
  }
  await discussionModel.updateReply(replyId, { status: 'deleted' });
}

module.exports = {
  listByModule, getById, create, update, remove,
  listReplies, createReply, updateReply, removeReply,
};
const moduleModel = require('../models/module.models');
const prerequisiteModel = require('../models/prerequisite.models');
const access = require('./access.service');
const { requireFields, assertEnum, assertNumber, parseId } = require('../lib/validate');
const { pick } = require('../utils/sql');
const AppError = require('../utils/AppError');

const STATUSES = ['draft', 'published', 'archived'];

async function listByCourse(courseId, user) {
  const course = await access.getCourseOrFail(courseId);
  if (access.isStaff(user)) return moduleModel.findByCourse(courseId);
  if (course.status !== 'published') throw new AppError('Course not found', 404);
  return moduleModel.findByCourse(courseId, { publishedOnly: true });
}

async function getById(moduleId, user) {
  const module = await access.getModuleOrFail(moduleId);
  if (!access.isStaff(user)) {
    const course = await access.getCourseOrFail(module.course_id);
    if (module.status !== 'published' || course.status !== 'published') throw new AppError('Module not found', 404);
  }
  return module;
}

async function create(courseId, body, user) {
  await access.assertCourseManager(user, courseId);
  requireFields(body, ['title']);
  assertEnum(body.status, STATUSES, 'status');
  assertNumber(body.passing_score, 'passing_score', { min: 0, max: 100 });
  assertNumber(body.module_order, 'module_order', { min: 1, integer: true });

  const id = await moduleModel.create({
    course_id: courseId,
    title: String(body.title).trim(),
    description: body.description ?? null,
    module_order: body.module_order ?? (await moduleModel.nextOrder(courseId)),
    passing_score: body.passing_score,
    status: body.status,
  });
  return moduleModel.findById(id);
}

async function update(moduleId, body, user) {
  await access.assertModuleManager(user, moduleId);
  assertEnum(body.status, STATUSES, 'status');
  assertNumber(body.passing_score, 'passing_score', { min: 0, max: 100 });
  assertNumber(body.module_order, 'module_order', { min: 1, integer: true });

  const fields = pick(body, ['title', 'description', 'module_order', 'passing_score', 'status']);
  if (!Object.keys(fields).length) throw new AppError('No valid fields to update', 400);
  await moduleModel.update(moduleId, fields);
  return moduleModel.findById(moduleId);
}

async function remove(moduleId, user) {
  await access.assertModuleManager(user, moduleId);
  await moduleModel.remove(moduleId);
}

async function listPrerequisites(moduleId, user) {
  await getById(moduleId, user);
  return prerequisiteModel.findByModule(moduleId);
}

async function wouldCreateCycle(moduleId, prereqId) {
  const seen = new Set();
  const stack = [prereqId];
  while (stack.length) {
    const current = stack.pop();
    if (current === moduleId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    stack.push(...(await prerequisiteModel.findPrerequisiteIds(current)));
  }
  return false;
}

async function addPrerequisite(moduleId, body, user) {
  const { module } = await access.assertModuleManager(user, moduleId);
  requireFields(body, ['prerequisite_module_id']);
  assertNumber(body.minimum_score, 'minimum_score', { min: 0, max: 100 });

  const prereqId = parseId(body.prerequisite_module_id, 'prerequisite_module_id');
  if (prereqId === moduleId) throw new AppError('A module cannot be its own prerequisite', 400);

  const prereq = await access.getModuleOrFail(prereqId);
  if (prereq.course_id !== module.course_id) {
    throw new AppError('A prerequisite must belong to the same course', 400);
  }
  if (await wouldCreateCycle(moduleId, prereqId)) {
    throw new AppError('This prerequisite would create a circular dependency', 400);
  }

  const id = await prerequisiteModel.create({
    module_id: moduleId,
    prerequisite_module_id: prereqId,
    minimum_score: body.minimum_score ?? 75,
  });
  return prerequisiteModel.findById(id);
}

async function removePrerequisite(prerequisiteId, user) {
  const row = await prerequisiteModel.findById(prerequisiteId);
  if (!row) throw new AppError('Prerequisite not found', 404);
  await access.assertModuleManager(user, row.module_id);
  await prerequisiteModel.remove(prerequisiteId);
}

module.exports = {
  listByCourse, getById, create, update, remove,
  listPrerequisites, addPrerequisite, removePrerequisite, wouldCreateCycle,
};
const lessonModel = require('../models/lesson.models');
const resourceModel = require('../models/resource.models');
const moduleService = require('./module.service');
const adaptiveService = require('./adaptive.service');
const access = require('./access.service');
const { requireFields, assertEnum, assertNumber } = require('../lib/validate');
const { pick } = require('../utils/sql');
const AppError = require('../utils/AppError');

const LESSON_STATUSES = ['draft', 'published'];
const RESOURCE_TYPES = ['pdf', 'video', 'link', 'document'];

<<<<<<< HEAD
=======

>>>>>>> origin/feature/Mark-lessons
function assertSafeUrl(url) {
  if (typeof url !== 'string' || url.length > 500 || !/^(https?:\/\/|\/)/i.test(url.trim())) {
    throw new AppError('resource_url must start with http://, https:// or / (max 500 chars)', 400);
  }
}

<<<<<<< HEAD
async function listByModule(moduleId, user) {
  await moduleService.getById(moduleId, user);
=======

async function listByModule(moduleId, user) {
  await moduleService.getById(moduleId, user); 
>>>>>>> origin/feature/Mark-lessons
  return lessonModel.findByModule(moduleId, { publishedOnly: !access.isStaff(user) });
}

async function getById(lessonId, user) {
  const lesson = await lessonModel.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  await moduleService.getById(lesson.module_id, user);
  if (lesson.status !== 'published' && !access.isStaff(user)) throw new AppError('Lesson not found', 404);
<<<<<<< HEAD
=======
  
>>>>>>> origin/feature/Mark-lessons
  await adaptiveService.assertModuleAccess(user, lesson.module_id);
  return lesson;
}

async function create(moduleId, body, user) {
  await access.assertModuleManager(user, moduleId);
  requireFields(body, ['title']);
  assertEnum(body.status, LESSON_STATUSES, 'status');
  assertNumber(body.estimated_minutes, 'estimated_minutes', { min: 0, integer: true });
  assertNumber(body.lesson_order, 'lesson_order', { min: 1, integer: true });

  const id = await lessonModel.create({
    module_id: moduleId,
    title: String(body.title).trim(),
    content: body.content ?? null,
    lesson_order: body.lesson_order ?? (await lessonModel.nextOrder(moduleId)),
    estimated_minutes: body.estimated_minutes,
    status: body.status,
  });
  return lessonModel.findById(id);
}

async function update(lessonId, body, user) {
  const lesson = await lessonModel.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  await access.assertModuleManager(user, lesson.module_id);
  assertEnum(body.status, LESSON_STATUSES, 'status');
  assertNumber(body.estimated_minutes, 'estimated_minutes', { min: 0, integer: true });
  assertNumber(body.lesson_order, 'lesson_order', { min: 1, integer: true });

  const fields = pick(body, ['title', 'content', 'lesson_order', 'estimated_minutes', 'status']);
  if (!Object.keys(fields).length) throw new AppError('No valid fields to update', 400);
  await lessonModel.update(lessonId, fields);
  return lessonModel.findById(lessonId);
}

async function remove(lessonId, user) {
  const lesson = await lessonModel.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  await access.assertModuleManager(user, lesson.module_id);
  await lessonModel.remove(lessonId);
}


const listResources = async (lessonId, user) => {
<<<<<<< HEAD
  await getById(lessonId, user);
=======
  await getById(lessonId, user); 
>>>>>>> origin/feature/Mark-lessons
  return resourceModel.findByLesson(lessonId);
};

async function createResource(lessonId, body, user) {
  const lesson = await lessonModel.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  await access.assertModuleManager(user, lesson.module_id);
  requireFields(body, ['title', 'resource_url']);
  assertEnum(body.resource_type, RESOURCE_TYPES, 'resource_type');
  assertSafeUrl(body.resource_url);

  const id = await resourceModel.create({
    lesson_id: lessonId,
    title: String(body.title).trim(),
    resource_type: body.resource_type,
    resource_url: body.resource_url.trim(),
    description: body.description ?? null,
  });
  return resourceModel.findById(id);
}

async function loadResourceForManager(resourceId, user) {
  const resource = await resourceModel.findById(resourceId);
  if (!resource) throw new AppError('Resource not found', 404);
  const lesson = await lessonModel.findById(resource.lesson_id);
  await access.assertModuleManager(user, lesson.module_id);
  return resource;
}

async function updateResource(resourceId, body, user) {
  await loadResourceForManager(resourceId, user);
  assertEnum(body.resource_type, RESOURCE_TYPES, 'resource_type');
  if (body.resource_url !== undefined) assertSafeUrl(body.resource_url);
  const fields = pick(body, ['title', 'resource_type', 'resource_url', 'description']);
  if (!Object.keys(fields).length) throw new AppError('No valid fields to update', 400);
  await resourceModel.update(resourceId, fields);
  return resourceModel.findById(resourceId);
}

async function removeResource(resourceId, user) {
  await loadResourceForManager(resourceId, user);
  await resourceModel.remove(resourceId);
}

const lessonsWithoutResourcesReport = () => lessonModel.getLessonsWithoutResourcesReport();

module.exports = {
  listByModule, getById, create, update, remove,
  listResources, createResource, updateResource, removeResource,
  lessonsWithoutResourcesReport,
};

const announcementService = require('../services/announcement.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');

exports.listByCourse = async (req, res) =>
  success(res, await announcementService.listByCourse(parseId(req.params.courseId, 'courseId'), req.user), 'Announcements retrieved successfully');

exports.createInCourse = async (req, res) =>
  created(res, await announcementService.create(parseId(req.params.courseId, 'courseId'), req.body, req.user), 'Announcement created successfully');

exports.get = async (req, res) =>
  success(res, await announcementService.getById(parseId(req.params.id), req.user), 'Announcement retrieved successfully');

exports.update = async (req, res) =>
  success(res, await announcementService.update(parseId(req.params.id), req.body, req.user), 'Announcement updated successfully');

exports.remove = async (req, res) => {
  await announcementService.remove(parseId(req.params.id), req.user);
  success(res, null, 'Announcement deleted successfully');
};

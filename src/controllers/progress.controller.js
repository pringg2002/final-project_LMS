const progressService = require('../services/progress.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

exports.mine = asyncHandler(async (req, res) =>
  success(
    res,
    await progressService.listMine(req.user),
    'Progress retrieved successfully'
  )
);


exports.forLesson = asyncHandler(async (req, res) =>
  success(
    res,
    await progressService.getForLesson(
      parseId(req.params.lessonId, 'lessonId'),
      req.user
    ),
    'Lesson progress retrieved successfully'
  )
);


exports.record = asyncHandler(async (req, res) => {
  const { progress } = await progressService.record(
    req.body,
    req.user
  );

  created(res, progress, 'Progress saved successfully');
});


exports.update = asyncHandler(async (req, res) => {
  const { progress } = await progressService.updateById(
    parseId(req.params.id),
    req.body,
    req.user
  );

  success(res, progress, 'Progress updated successfully');
});
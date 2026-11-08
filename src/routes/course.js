const router = require('express').Router();
const courseController = require('../controllers/course.controller');
const moduleController = require('../controllers/module.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

const staff = role(ROLES.ADMIN, ROLES.INSTRUCTOR);

router.get('/courses', auth, asyncHandler(courseController.list));
router.get('/courses/:id', auth, asyncHandler(courseController.get));
router.post('/courses', auth, role(ROLES.ADMIN), asyncHandler(courseController.create));
router.put('/courses/:id', auth, staff, asyncHandler(courseController.update));
router.delete('/courses/:id', auth, staff, asyncHandler(courseController.remove));

router.get('/courses/:id/classmates', auth, asyncHandler(async (req, res) => {
  const id = require('../lib/validate').parseId(req.params.id, 'id');
  const course = await require('../services/course.service').getById(id, req.user);
  const db = require('../db');
  const [rows] = await db.query(`SELECT u.user_id, u.first_name, u.last_name
    FROM enrollments e JOIN users u ON u.user_id = e.student_id
    WHERE e.course_id = ? AND e.status IN ('active','completed') AND u.status = 'active'
    ORDER BY u.last_name, u.first_name`, [id]);
  require('../utils/response').success(res, { instructor: { user_id: course.instructor_id, name: course.instructor_name }, classmates: rows }, 'Course members retrieved');
}));

router.get('/courses/:courseId/modules', auth, asyncHandler(moduleController.listByCourse));
router.post('/courses/:courseId/modules', auth, staff, asyncHandler(moduleController.createInCourse));

module.exports = router;
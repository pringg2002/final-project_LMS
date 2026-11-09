const router = require('express').Router();
const controller = require('../controllers/assignment.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

const staff = role(ROLES.INSTRUCTOR);
const learner = role(ROLES.INSTRUCTOR, ROLES.STUDENT);
const student = role(ROLES.STUDENT);

router.get('/modules/:moduleId/assignments', auth, learner, asyncHandler(controller.listByModule));
router.post('/modules/:moduleId/assignments', auth, learner, staff, asyncHandler(controller.createInModule));
router.get('/assignments/:id', auth, learner, asyncHandler(controller.get));
router.put('/assignments/:id', auth, learner, staff, asyncHandler(controller.update));
router.delete('/assignments/:id', auth, learner, staff, asyncHandler(controller.remove));

router.get('/assignments/:assignmentId/submissions', auth, learner, asyncHandler(controller.listSubmissions));
router.post('/assignments/:assignmentId/submissions', auth, learner, student, asyncHandler(controller.createSubmission));
router.get('/submissions/:id', auth, learner, asyncHandler(controller.getSubmission));
router.put('/submissions/:id', auth, learner, asyncHandler(controller.updateSubmission));
router.delete('/submissions/:id', auth, learner, asyncHandler(controller.removeSubmission));

<<<<<<< HEAD
// Create a new assignment
exports.createAssignment = (req, res) => {
    const assignmentData = req.body;
    
    Assignment.create(assignmentData, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
            success: true, 
            message: "Assignment created successfully",
            assignmentId: results.insertId 
        });
    });
};
=======
module.exports = router;
>>>>>>> origin/main

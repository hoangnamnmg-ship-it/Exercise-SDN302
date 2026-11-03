const express = require('express');
const router = express.Router();
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  enrollStudent,
  removeStudentFromClass,
  getStudentsByClass,
  getAttendanceSummaryByClass
} = require('../controllers/classController');

router.route('/')
  .get(getAllClasses)
  .post(createClass);

router.route('/:id')
  .get(getClassById)
  .put(updateClass)
  .delete(deleteClass);

router.route('/:id/enroll')
  .post(enrollStudent);

router.route('/:id/enroll/:studentId')
  .delete(removeStudentFromClass);

router.get('/:classId/students', getStudentsByClass);
router.get('/:classId/attendance-summary', getAttendanceSummaryByClass);

module.exports = router;

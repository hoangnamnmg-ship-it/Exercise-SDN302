const express = require('express');
const router = express.Router();
const {
  getAllAttendances,
  getAttendanceById,
  recordAttendance,
  bulkRecordAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceReportByClass
} = require('../controllers/attendanceController');

router.route('/')
  .get(getAllAttendances)
  .post(recordAttendance);

router.post('/bulk', bulkRecordAttendance);

router.get('/report/:classId', getAttendanceReportByClass);

router.route('/:id')
  .get(getAttendanceById)
  .put(updateAttendance)
  .delete(deleteAttendance);

module.exports = router;


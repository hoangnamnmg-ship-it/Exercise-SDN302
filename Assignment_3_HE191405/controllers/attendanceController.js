const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Student = require('../models/Student');

const getAllAttendances = async (req, res) => {
  try {
    const { classId, studentId, date, status } = req.query;
    let query = {};

    if (classId) {
      query.classId = classId;
    }

    if (studentId) {
      query.studentId = studentId;
    }

    if (status) {
      query.status = status.toUpperCase();
    }

    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setUTCHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const attendances = await Attendance.find(query)
      .populate('studentId', 'studentCode fullName email')
      .populate('classId', 'className lecturerName status')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách điểm danh',
      error: error.message
    });
  }
};

const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('studentId', 'studentCode fullName email')
      .populate('classId', 'className lecturerName status');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi điểm danh'
      });
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết điểm danh',
      error: error.message
    });
  }
};

const recordAttendance = async (req, res) => {
  try {
    const { studentId, classId, date, status } = req.body;

    if (!studentId || !classId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: studentId, classId, date, status'
      });
    }

    const validStatus = status.toUpperCase();
    if (!['PRESENT', 'ABSENT'].includes(validStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái status phải là PRESENT hoặc ABSENT'
      });
    }

    const [targetClass, targetStudent] = await Promise.all([
      Class.findById(classId),
      Student.findById(studentId)
    ]);

    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    if (!targetStudent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    const recordDate = new Date(date);
    const startOfDay = new Date(recordDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(recordDate.setUTCHours(23, 59, 59, 999));

    let attendance = await Attendance.findOne({
      studentId,
      classId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (attendance) {
      attendance.status = validStatus;
      await attendance.save();
      return res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái điểm danh thành công',
        data: attendance
      });
    }

    attendance = await Attendance.create({
      studentId,
      classId,
      date: new Date(date),
      status: validStatus
    });

    res.status(201).json({
      success: true,
      message: 'Ghi nhận điểm danh thành công',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi ghi nhận điểm danh',
      error: error.message
    });
  }
};

const bulkRecordAttendance = async (req, res) => {
  try {
    const { classId, date, records } = req.body;

    if (!classId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp classId, date và mảng records: [{ studentId, status }]'
      });
    }

    const attendanceDate = new Date(date);
    const results = [];

    for (const item of records) {
      const validStatus = item.status ? item.status.toUpperCase() : 'ABSENT';
      const startOfDay = new Date(attendanceDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(attendanceDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const updated = await Attendance.findOneAndUpdate(
        {
          studentId: item.studentId,
          classId,
          date: { $gte: startOfDay, $lte: endOfDay }
        },
        {
          studentId: item.studentId,
          classId,
          date: attendanceDate,
          status: validStatus
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(updated);
    }

    res.status(200).json({
      success: true,
      message: `Đã điểm danh cho ${results.length} sinh viên`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi điểm danh hàng loạt',
      error: error.message
    });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['PRESENT', 'ABSENT'].includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái status phải là PRESENT hoặc ABSENT'
      });
    }

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status: status.toUpperCase() },
      { new: true }
    )
      .populate('studentId', 'studentCode fullName email')
      .populate('classId', 'className');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi điểm danh để cập nhật'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật điểm danh thành công',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật điểm danh',
      error: error.message
    });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi điểm danh để xóa'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa bản ghi điểm danh thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa điểm danh',
      error: error.message
    });
  }
};

const getAttendanceReportByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const targetClass = await Class.findById(classId)
      .populate('subjectId', 'code name')
      .populate('enrollments.studentId', 'studentCode fullName email');

    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    const distinctDates = await Attendance.distinct('date', { classId });
    const totalSlots = distinctDates.length;

    const allRecords = await Attendance.find({ classId });

    const report = targetClass.enrollments.map((enrollment) => {
      const student = enrollment.studentId;
      if (!student) return null;

      const studentRecords = allRecords.filter(
        (r) => r.studentId.toString() === student._id.toString()
      );

      const presentCount = studentRecords.filter((r) => r.status === 'PRESENT').length;
      const absentCount = studentRecords.filter((r) => r.status === 'ABSENT').length;
      const absentPercentage = totalSlots > 0 ? ((absentCount / totalSlots) * 100).toFixed(2) : 0;

      return {
        studentId: student._id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: student.email,
        enrollmentStatus: enrollment.status,
        totalSlots,
        presentCount,
        absentCount,
        absentPercentage: Number(absentPercentage),
        isBanned: Number(absentPercentage) > 20
      };
    }).filter(Boolean);

    res.status(200).json({
      success: true,
      className: targetClass.className,
      subject: targetClass.subjectId,
      totalSlots,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo báo cáo điểm danh',
      error: error.message
    });
  }
};

module.exports = {
  getAllAttendances,
  getAttendanceById,
  recordAttendance,
  bulkRecordAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceReportByClass
};

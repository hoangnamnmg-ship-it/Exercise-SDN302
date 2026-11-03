const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

const getAllClasses = async (req, res) => {
  try {
    const { status, subjectId, search } = req.query;
    let query = {};

    if (status) {
      query.status = status.toUpperCase();
    }

    if (subjectId) {
      query.subjectId = subjectId;
    }

    if (search) {
      query.$or = [
        { className: { $regex: search, $options: 'i' } },
        { lecturerName: { $regex: search, $options: 'i' } }
      ];
    }

    const classes = await Class.find(query)
      .populate('subjectId', 'code name credits status')
      .populate('enrollments.studentId', 'studentCode fullName email')
      .sort({ className: 1 });

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách lớp học',
      error: error.message
    });
  }
};

const getClassById = async (req, res) => {
  try {
    const singleClass = await Class.findById(req.params.id)
      .populate('subjectId', 'code name credits status')
      .populate('enrollments.studentId', 'studentCode fullName email');

    if (!singleClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học với ID đã cung cấp'
      });
    }

    res.status(200).json({
      success: true,
      data: singleClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết lớp học',
      error: error.message
    });
  }
};

const createClass = async (req, res) => {
  try {
    const { className, subjectId, lecturerName, status, enrollments } = req.body;

    if (!className || !subjectId || !lecturerName) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: className, subjectId, lecturerName'
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học tương ứng với subjectId'
      });
    }

    const existingClass = await Class.findOne({ className: className.trim() });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Tên lớp học đã tồn tại'
      });
    }

    const newClass = await Class.create({
      className: className.trim(),
      subjectId,
      lecturerName: lecturerName.trim(),
      status: status ? status.toUpperCase() : 'OPEN',
      enrollments: enrollments || []
    });

    res.status(201).json({
      success: true,
      message: 'Tạo lớp học thành công',
      data: newClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo lớp học',
      error: error.message
    });
  }
};

const updateClass = async (req, res) => {
  try {
    const { className, subjectId, lecturerName, status } = req.body;

    const existingClass = await Class.findById(req.params.id);
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học để cập nhật'
      });
    }

    if (className) {
      const duplicate = await Class.findOne({
        _id: { $ne: req.params.id },
        className: className.trim()
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Tên lớp học đã tồn tại ở bản ghi khác'
        });
      }
    }

    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy môn học tương ứng với subjectId'
        });
      }
    }

    const updateData = { ...req.body };
    if (updateData.className) updateData.className = updateData.className.trim();
    if (updateData.status) updateData.status = updateData.status.toUpperCase();

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('subjectId', 'code name credits status')
      .populate('enrollments.studentId', 'studentCode fullName email');

    res.status(200).json({
      success: true,
      message: 'Cập nhật lớp học thành công',
      data: updatedClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật lớp học',
      error: error.message
    });
  }
};

const deleteClass = async (req, res) => {
  try {
    const targetClass = await Class.findById(req.params.id);
    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học để xóa'
      });
    }

    await Attendance.deleteMany({ classId: req.params.id });

    await Class.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa lớp học và dữ liệu điểm danh liên quan thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa lớp học',
      error: error.message
    });
  }
};

const enrollStudent = async (req, res) => {
  try {
    const { studentId, status } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp studentId'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    const targetClass = await Class.findById(req.params.id);
    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    const existingEnrollmentIndex = targetClass.enrollments.findIndex(
      (e) => e.studentId.toString() === studentId
    );

    const enrollmentStatus = status ? status.toLowerCase() : 'enrolled';

    if (existingEnrollmentIndex !== -1) {
      targetClass.enrollments[existingEnrollmentIndex].status = enrollmentStatus;
    } else {
      targetClass.enrollments.push({
        studentId,
        status: enrollmentStatus
      });
    }

    await targetClass.save();

    const updated = await Class.findById(req.params.id)
      .populate('subjectId', 'code name')
      .populate('enrollments.studentId', 'studentCode fullName email');

    res.status(200).json({
      success: true,
      message: 'Ghi danh sinh viên vào lớp thành công',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi ghi danh sinh viên',
      error: error.message
    });
  }
};

const removeStudentFromClass = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    const targetClass = await Class.findById(id);
    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    targetClass.enrollments = targetClass.enrollments.filter(
      (e) => e.studentId.toString() !== studentId
    );

    await targetClass.save();

    res.status(200).json({
      success: true,
      message: 'Đã xóa sinh viên khỏi danh sách lớp'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sinh viên khỏi lớp',
      error: error.message
    });
  }
};

const getStudentsByClass = async (req, res) => {
  try {
    const targetClass = await Class.findById(req.params.classId)
      .populate('enrollments.studentId', 'studentCode fullName email');

    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    const students = targetClass.enrollments.map((e) => ({
      studentId: e.studentId?._id,
      studentCode: e.studentId?.studentCode,
      fullName: e.studentId?.fullName,
      email: e.studentId?.email,
      enrollmentStatus: e.status
    })).filter((s) => s.studentId);

    res.status(200).json({
      success: true,
      className: targetClass.className,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sinh viên trong lớp',
      error: error.message
    });
  }
};

const getAttendanceSummaryByClass = async (req, res) => {
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

    const summary = targetClass.enrollments.map((enrollment) => {
      const student = enrollment.studentId;
      if (!student) return null;

      const studentRecords = allRecords.filter(
        (r) => r.studentId.toString() === student._id.toString()
      );

      const presentCount = studentRecords.filter((r) => r.status === 'PRESENT').length;
      const absentCount = studentRecords.filter((r) => r.status === 'ABSENT').length;
      const attendanceRate = totalSlots > 0
        ? Number(((presentCount / totalSlots) * 100).toFixed(2))
        : 0;

      return {
        studentId: student._id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: student.email,
        enrollmentStatus: enrollment.status,
        totalSessions: totalSlots,
        present: presentCount,
        absent: absentCount,
        attendanceRate,
        warning: attendanceRate < 80
      };
    }).filter(Boolean);

    res.status(200).json({
      success: true,
      className: targetClass.className,
      subject: targetClass.subjectId,
      totalSlots,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy báo cáo chuyên cần của lớp',
      error: error.message
    });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  enrollStudent,
  removeStudentFromClass,
  getStudentsByClass,
  getAttendanceSummaryByClass
};

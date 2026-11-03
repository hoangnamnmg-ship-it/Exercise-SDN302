const Student = require('../models/Student');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

const getAllStudents = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { studentCode: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const students = await Student.find(query).sort({ studentCode: 1 });
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sinh viên',
      error: error.message
    });
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên với ID đã cung cấp'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết sinh viên',
      error: error.message
    });
  }
};

const createStudent = async (req, res) => {
  try {
    const { studentCode, fullName, email } = req.body;

    if (!studentCode || !fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ studentCode, fullName và email'
      });
    }

    const existingStudent = await Student.findOne({
      $or: [{ studentCode }, { email }]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Mã sinh viên hoặc email đã tồn tại'
      });
    }

    const student = await Student.create({
      studentCode,
      fullName,
      email
    });

    res.status(201).json({
      success: true,
      message: 'Tạo sinh viên thành công',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo sinh viên',
      error: error.message
    });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { studentCode, fullName, email } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên để cập nhật'
      });
    }

    if (studentCode || email) {
      const duplicate = await Student.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(studentCode ? [{ studentCode }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Mã sinh viên hoặc email đã được sử dụng bởi sinh viên khác'
        });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật sinh viên thành công',
      data: updatedStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sinh viên',
      error: error.message
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên để xóa'
      });
    }

    const enrolledClass = await Class.findOne({
      'enrollments.studentId': req.params.id
    });
    if (enrolledClass) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa sinh viên vì đang có trong danh sách lớp: ${enrolledClass.className}`
      });
    }

    await Attendance.deleteMany({ studentId: req.params.id });

    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa sinh viên thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sinh viên',
      error: error.message
    });
  }
};

const getStudentAttendances = async (req, res) => {
  try {
    const attendances = await Attendance.find({ studentId: req.params.id })
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
      message: 'Lỗi server khi lấy lịch sử điểm danh của sinh viên',
      error: error.message
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentAttendances
};

const Subject = require('../models/Subject');
const Class = require('../models/Class');

const getAllSubjects = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status) {
      query.status = status.toUpperCase();
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const subjects = await Subject.find(query).sort({ code: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách môn học',
      error: error.message
    });
  }
};

const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học với ID đã cung cấp'
      });
    }

    res.status(200).json({
      success: true,
      data: subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết môn học',
      error: error.message
    });
  }
};

const createSubject = async (req, res) => {
  try {
    const { code, name, credits, status } = req.body;

    if (!code || !name || credits === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: code, name, credits'
      });
    }

    const existingSubject = await Subject.findOne({ code: code.trim().toUpperCase() });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Mã môn học (code) đã tồn tại'
      });
    }

    const subject = await Subject.create({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      credits: Number(credits),
      status: status ? status.toUpperCase() : 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo môn học thành công',
      data: subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo môn học',
      error: error.message
    });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { code, name, credits, status } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học để cập nhật'
      });
    }

    if (code) {
      const duplicate = await Subject.findOne({
        _id: { $ne: req.params.id },
        code: code.trim().toUpperCase()
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Mã môn học đã tồn tại ở một bản ghi khác'
        });
      }
    }

    const updateData = { ...req.body };
    if (updateData.code) updateData.code = updateData.code.trim().toUpperCase();
    if (updateData.status) updateData.status = updateData.status.toUpperCase();

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật môn học thành công',
      data: updatedSubject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật môn học',
      error: error.message
    });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học để xóa'
      });
    }

    const classCount = await Class.countDocuments({ subjectId: req.params.id });
    if (classCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa môn học vì đang có ${classCount} lớp học liên kết với môn này`
      });
    }

    await Subject.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa môn học thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa môn học',
      error: error.message
    });
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};

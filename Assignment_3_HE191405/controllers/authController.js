const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const student = await Student.findOne({ email: email.trim().toLowerCase() });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    let isMatch = false;

    if (student.password) {
      if (student.password.startsWith('$2a$') || student.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, student.password);
      } else {
        isMatch = student.password === password;
      }
    } else {
      const configuredPassword = process.env.TEST_PASSWORD || '123456';
      isMatch = password === configuredPassword || password === student.studentCode;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const payload = {
      studentId: student._id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_secret_key', {
      expiresIn: '1h'
    });

    return res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

module.exports = {
  login
};


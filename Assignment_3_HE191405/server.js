const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const studentRoutes = require('./routes/studentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const classRoutes = require('./routes/classRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  try {
    res.send({ message: 'Welcome to Practical Exam - Student Attendance System!' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendances', attendanceRoutes);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

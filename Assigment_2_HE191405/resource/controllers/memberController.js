const Member = require('../models/Member');

const getAllMembers = async (req, res) => {
    try {
        const members = await Member.find();
        res.status(200).json({
            success: true,
            count: members.length,
            data: members
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMemberById = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }
        res.status(200).json({ success: true, data: member });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid member ID format' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const createMember = async (req, res) => {
    try {
        const { fullName, email, phone, membershipType } = req.body;

        if (!fullName || !email || !phone || !membershipType) {
            return res.status(400).json({
                success: false,
                message: 'fullName, email, phone, and membershipType are required'
            });
        }

        const allowedTypes = ['Student', 'Teacher', 'Guest'];
        if (!allowedTypes.includes(membershipType)) {
            return res.status(400).json({
                success: false,
                message: `membershipType must be one of: ${allowedTypes.join(', ')}`
            });
        }

        const existingMember = await Member.findOne({ email: email.toLowerCase() });
        if (existingMember) {
            return res.status(409).json({
                success: false,
                message: `Email "${email}" is already registered`
            });
        }

        const member = await Member.create(req.body);
        res.status(201).json({ success: true, message: 'Member created successfully', data: member });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email address must be unique' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateMember = async (req, res) => {
    try {
        const { email, membershipType } = req.body;

        if (membershipType) {
            const allowedTypes = ['Student', 'Teacher', 'Guest'];
            if (!allowedTypes.includes(membershipType)) {
                return res.status(400).json({
                    success: false,
                    message: `membershipType must be one of: ${allowedTypes.join(', ')}`
                });
            }
        }

        if (email) {
            const existingMember = await Member.findOne({
                email: email.toLowerCase(),
                _id: { $ne: req.params.id }
            });
            if (existingMember) {
                return res.status(409).json({
                    success: false,
                    message: `Email "${email}" is already used by another member`
                });
            }
        }

        const member = await Member.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.status(200).json({ success: true, message: 'Member updated successfully', data: member });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid member ID format' });
        }
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email address must be unique' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteMember = async (req, res) => {
    try {
        const member = await Member.findByIdAndDelete(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }
        res.status(200).json({ success: true, message: 'Member deleted successfully' });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid member ID format' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllMembers, getMemberById, createMember, updateMember, deleteMember };


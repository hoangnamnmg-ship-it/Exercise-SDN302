const Loan = require('../models/Loan');
const Member = require('../models/Member');
const Book = require('../models/Book');

const getAllLoans = async (req, res) => {
    try {
        const loans = await Loan.find()
            .populate({
                path: 'member_id',
                select: 'fullName email phone membershipType'
            })
            .populate({
                path: 'items.book_id',
                select: 'title author category isbn'
            });

        res.status(200).json({
            success: true,
            count: loans.length,
            data: loans
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getLoanById = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id)
            .populate({
                path: 'member_id',
                select: 'fullName email phone membershipType'
            })
            .populate({
                path: 'items.book_id',
                select: 'title author category isbn'
            });

        if (!loan) {
            return res.status(404).json({ success: false, message: 'Loan not found' });
        }
        res.status(200).json({ success: true, data: loan });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid loan ID format' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const createLoan = async (req, res) => {
    try {
        const { member_id, items, dueDate, borrowDate, returnDate, status } = req.body;

        if (!member_id || !items || !dueDate) {
            return res.status(400).json({
                success: false,
                message: 'member_id, items, and dueDate are required'
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'items must be a non-empty array'
            });
        }

        const memberExists = await Member.findById(member_id);
        if (!memberExists) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        for (const item of items) {
            if (!item.book_id || !item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have book_id and quantity'
                });
            }
            if (item.quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity must be at least 1'
                });
            }
            const bookExists = await Book.findById(item.book_id);
            if (!bookExists) {
                return res.status(404).json({
                    success: false,
                    message: `Book with ID "${item.book_id}" not found`
                });
            }
        }

        if (status) {
            const allowedStatuses = ['Borrowing', 'Returned', 'Overdue'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `status must be one of: ${allowedStatuses.join(', ')}`
                });
            }
        }

        const loan = await Loan.create(req.body);

        const populatedLoan = await Loan.findById(loan._id)
            .populate({
                path: 'member_id',
                select: 'fullName email phone membershipType'
            })
            .populate({
                path: 'items.book_id',
                select: 'title author category isbn'
            });

        res.status(201).json({
            success: true,
            message: 'Loan created successfully',
            data: populatedLoan
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateLoan = async (req, res) => {
    try {
        const { member_id, items, status } = req.body;

        if (member_id) {
            const memberExists = await Member.findById(member_id);
            if (!memberExists) {
                return res.status(404).json({ success: false, message: 'Member not found' });
            }
        }

        if (items) {
            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'items must be a non-empty array'
                });
            }
            for (const item of items) {
                if (!item.book_id || !item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each item must have book_id and quantity'
                    });
                }
                if (item.quantity < 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'Quantity must be at least 1'
                    });
                }
                const bookExists = await Book.findById(item.book_id);
                if (!bookExists) {
                    return res.status(404).json({
                        success: false,
                        message: `Book with ID "${item.book_id}" not found`
                    });
                }
            }
        }

        if (status) {
            const allowedStatuses = ['Borrowing', 'Returned', 'Overdue'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `status must be one of: ${allowedStatuses.join(', ')}`
                });
            }
        }

        const loan = await Loan.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate({
                path: 'member_id',
                select: 'fullName email phone membershipType'
            })
            .populate({
                path: 'items.book_id',
                select: 'title author category isbn'
            });

        if (!loan) {
            return res.status(404).json({ success: false, message: 'Loan not found' });
        }

        res.status(200).json({ success: true, message: 'Loan updated successfully', data: loan });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteLoan = async (req, res) => {
    try {
        const loan = await Loan.findByIdAndDelete(req.params.id);
        if (!loan) {
            return res.status(404).json({ success: false, message: 'Loan not found' });
        }
        res.status(200).json({ success: true, message: 'Loan deleted successfully' });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid loan ID format' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllLoans, getLoanById, createLoan, updateLoan, deleteLoan };


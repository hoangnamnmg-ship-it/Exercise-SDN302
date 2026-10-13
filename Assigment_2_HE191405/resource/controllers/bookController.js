const Book = require('../models/Book');

const getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();
        res.status(200).json({
            success: true,
            count: books.length,
            data: books
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getBookById = async (req, res) => {
    try {
        const id = (req.params.id || '').trim();
        let book = null;
        const mongoose = require('mongoose');

        if (mongoose.Types.ObjectId.isValid(id)) {
            book = await Book.findById(id);
        }

        if (!book) {
            book = await Book.findOne({ isbn: id });
        }

        if (!book) {
            const raw = await mongoose.connection.db.collection('books').findOne({ _id: id });
            if (raw) book = raw;
        }

        if (!book) {
            return res.status(404).json({
                success: false,
                message: `Book not found with ID/ISBN: "${id}"`
            });
        }
        res.status(200).json({ success: true, data: book });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createBook = async (req, res) => {
    try {
        const { title, author, category, isbn, publishedYear, totalCopies, availableCopies } = req.body;

        if (!title || !author || !category || !isbn) {
            return res.status(400).json({
                success: false,
                message: 'title, author, category, and isbn are required'
            });
        }

        if (totalCopies !== undefined && totalCopies < 0) {
            return res.status(400).json({ success: false, message: 'totalCopies cannot be negative' });
        }
        if (availableCopies !== undefined && availableCopies < 0) {
            return res.status(400).json({ success: false, message: 'availableCopies cannot be negative' });
        }

        const existingBook = await Book.findOne({ isbn });
        if (existingBook) {
            return res.status(409).json({ success: false, message: `Book with ISBN "${isbn}" already exists` });
        }

        const book = await Book.create(req.body);
        res.status(201).json({ success: true, message: 'Book created successfully', data: book });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'ISBN must be unique' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateBook = async (req, res) => {
    try {
        const { isbn, totalCopies, availableCopies } = req.body;

        if (totalCopies !== undefined && totalCopies < 0) {
            return res.status(400).json({ success: false, message: 'totalCopies cannot be negative' });
        }
        if (availableCopies !== undefined && availableCopies < 0) {
            return res.status(400).json({ success: false, message: 'availableCopies cannot be negative' });
        }

        if (isbn) {
            const existingBook = await Book.findOne({ isbn, _id: { $ne: req.params.id } });
            if (existingBook) {
                return res.status(409).json({ success: false, message: `ISBN "${isbn}" is already used by another book` });
            }
        }

        const book = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        res.status(200).json({ success: true, message: 'Book updated successfully', data: book });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid book ID format' });
        }
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'ISBN must be unique' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }
        res.status(200).json({ success: true, message: 'Book deleted successfully' });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid book ID format' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllBooks, getBookById, createBook, updateBook, deleteBook };


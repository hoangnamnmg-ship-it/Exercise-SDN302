const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DB_PATH = path.join(__dirname, '../data.json');

function readDb() {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
}

function writeDb(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

router.get('/', (req, res) => {
    try {
        const db = readDb();
        res.json(db.comments || []);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi đọc dữ liệu' });
    }
});

router.get('/:id', (req, res) => {
    try {
        const db = readDb();
        const id = parseInt(req.params.id);
        const comment = (db.comments || []).find(c => c.id === id);
        if (!comment) {
            return res.status(404).json({ message: 'Không tìm thấy bình luận' });
        }
        res.json(comment);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi đọc dữ liệu' });
    }
});

router.post('/', (req, res) => {
    try {
        const db = readDb();
        const comments = db.comments || [];
        const articles = db.articles || [];
        const { articleId, author, content } = req.body;

        if (articleId === undefined || articleId === null || !author || !content) {
            return res.status(400).json({ error: 'Các trường articleId, author và content là bắt buộc' });
        }

        const articleIdNum = parseInt(articleId);
        const article = articles.find(a => a.id === articleIdNum);
        if (!article) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết với articleId này' });
        }

        const newId = comments.length > 0 ? Math.max(...comments.map(c => c.id)) + 1 : 1;
        const newComment = {
            id: newId,
            articleId: articleIdNum,
            author,
            content,
            date: req.body.date || new Date().toISOString().split('T')[0]
        };

        comments.push(newComment);
        db.comments = comments;
        writeDb(db);

        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lưu bình luận' });
    }
});

router.put('/:id', (req, res) => {
    try {
        const db = readDb();
        const comments = db.comments || [];
        const id = parseInt(req.params.id);
        const index = comments.findIndex(c => c.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Không tìm thấy bình luận' });
        }

        const { articleId, author, content, date } = req.body;

        if (articleId !== undefined) {
            const articleIdNum = parseInt(articleId);
            const article = (db.articles || []).find(a => a.id === articleIdNum);
            if (!article) {
                return res.status(404).json({ message: 'Không tìm thấy bài viết với articleId này' });
            }
            comments[index].articleId = articleIdNum;
        }

        if (author !== undefined) comments[index].author = author;
        if (content !== undefined) comments[index].content = content;
        if (date !== undefined) comments[index].date = date;

        db.comments = comments;
        writeDb(db);

        res.json(comments[index]);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi cập nhật bình luận' });
    }
});

router.delete('/:id', (req, res) => {
    try {
        const db = readDb();
        const comments = db.comments || [];
        const id = parseInt(req.params.id);
        const index = comments.findIndex(c => c.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Không tìm thấy bình luận' });
        }

        const deleted = comments.splice(index, 1)[0];
        db.comments = comments;
        writeDb(db);

        res.json({ message: 'Xóa bình luận thành công', comment: deleted });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi xóa bình luận' });
    }
});

module.exports = router;

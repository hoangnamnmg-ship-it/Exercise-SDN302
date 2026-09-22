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
        res.json(db.articles || []);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi đọc dữ liệu' });
    }
});

router.get('/:id', (req, res) => {
    try {
        const db = readDb();
        const id = parseInt(req.params.id);
        const article = (db.articles || []).find(a => a.id === id);
        if (!article) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        }
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi đọc dữ liệu' });
    }
});

router.post('/', (req, res) => {
    try {
        const db = readDb();
        const articles = db.articles || [];
        const { title, content, author } = req.body;

        if (!title || !content || !author) {
            return res.status(400).json({ error: 'Các trường title, content và author là bắt buộc' });
        }

        const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;
        const newArticle = {
            id: newId,
            title,
            content,
            author,
            date: req.body.date || new Date().toISOString().split('T')[0]
        };

        articles.push(newArticle);
        db.articles = articles;
        writeDb(db);

        res.status(201).json(newArticle);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lưu bài viết' });
    }
});

router.put('/:id', (req, res) => {
    try {
        const db = readDb();
        const articles = db.articles || [];
        const id = parseInt(req.params.id);
        const index = articles.findIndex(a => a.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        }

        const { title, content, author, date } = req.body;
        if (title !== undefined) articles[index].title = title;
        if (content !== undefined) articles[index].content = content;
        if (author !== undefined) articles[index].author = author;
        if (date !== undefined) articles[index].date = date;

        db.articles = articles;
        writeDb(db);

        res.json(articles[index]);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi cập nhật bài viết' });
    }
});

router.delete('/:id', (req, res) => {
    try {
        const db = readDb();
        const articles = db.articles || [];
        const id = parseInt(req.params.id);
        const index = articles.findIndex(a => a.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        }

        const deleted = articles.splice(index, 1)[0];

        db.comments = (db.comments || []).filter(c => c.articleId !== id);
        db.articles = articles;
        writeDb(db);

        res.json({ message: 'Xóa bài viết thành công', article: deleted });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi xóa bài viết' });
    }
});

module.exports = router;

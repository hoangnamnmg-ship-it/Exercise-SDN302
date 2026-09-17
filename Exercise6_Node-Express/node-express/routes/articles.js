const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DB_PATH = path.join(__dirname, '../db.json');

// Helper function to read db.json
function readDb() {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
}

// Helper function to write db.json
function writeDb(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// GET all articles
router.get('/', (req, res) => {
    try {
        const db = readDb();
        res.json(db.articles || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// GET article by ID
router.get('/:id', (req, res) => {
    try {
        const db = readDb();
        const id = parseInt(req.params.id);
        const article = (db.articles || []).find(a => a.id === id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// POST new article
router.post('/', (req, res) => {
    try {
        const db = readDb();
        const articles = db.articles || [];
        const { title, body } = req.body;
        
        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;
        const newArticle = { id: newId, title, body };
        articles.push(newArticle);
        db.articles = articles;

        writeDb(db);
        res.status(201).json(newArticle);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save article' });
    }
});

// PUT update article by ID
router.put('/:id', (req, res) => {
    try {
        const db = readDb();
        const articles = db.articles || [];
        const id = parseInt(req.params.id);
        const index = articles.findIndex(a => a.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Article not found' });
        }

        const { title, body } = req.body;
        if (title) articles[index].title = title;
        if (body) articles[index].body = body;

        db.articles = articles;
        writeDb(db);

        res.json(articles[index]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update article' });
    }
});

// DELETE article by ID
router.delete('/:id', (req, res) => {
    try {
        const db = readDb();
        const articles = db.articles || [];
        const id = parseInt(req.params.id);
        const index = articles.findIndex(a => a.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Article not found' });
        }

        const deleted = articles.splice(index, 1)[0];
        db.articles = articles;
        writeDb(db);

        res.json({ message: 'Article deleted successfully', article: deleted });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete article' });
    }
});

module.exports = router;

const express = require('express');
const articles = require('./articles');

const app = express();
const PORT = 3003;

// Middleware to parse JSON request body
app.use(express.json());

// Route to return JSON data of all articles
app.get('/articles', (req, res) => {
    res.json(articles);
});

// Route to return a post based on ID
app.get('/articles/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const article = articles.find(a => a.id === id);
    if (!article) {
        return res.status(404).json({ message: 'Article not found' });
    }
    res.json(article);
});

// Add a new post (POST)
app.post('/articles', (req, res) => {
    const { title, body } = req.body;
    if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
    }

    const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;
    const newArticle = { id: newId, title, body };
    articles.push(newArticle);

    res.status(201).json(newArticle);
});

// Update a post (PUT)
app.put('/articles/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = articles.findIndex(a => a.id === id);

    if (index === -1) {
        return res.status(404).json({ message: 'Article not found' });
    }

    const { title, body } = req.body;
    if (title) articles[index].title = title;
    if (body) articles[index].body = body;

    res.json(articles[index]);
});

// Delete a post (DELETE)
app.delete('/articles/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = articles.findIndex(a => a.id === id);

    if (index === -1) {
        return res.status(404).json({ message: 'Article not found' });
    }

    const deletedArticle = articles.splice(index, 1)[0];
    res.json({ message: 'Article deleted successfully', article: deletedArticle });
});

app.listen(PORT, () => {
    console.log(`node-express-CRUD server running on http://localhost:${PORT}`);
});

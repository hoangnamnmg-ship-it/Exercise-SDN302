const express = require('express');
const { validateArticle, validateDate, validateTextLength } = require('./middlewares/articleMiddleware');

const app = express();

// Built-in middleware to parse JSON body
app.use(express.json());

// Apply all middlewares from the exercise to the POST /articles route
app.post('/articles', validateArticle, validateDate, validateTextLength, (req, res) => {
    res.status(201).json({
        message: "Article successfully created!",
        article: req.body
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

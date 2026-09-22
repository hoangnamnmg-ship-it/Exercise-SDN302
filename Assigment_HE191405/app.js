const express = require('express');

const articleRouter = require('./routes/articleRouter');
const commentRouter = require('./routes/commentRouter');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/articles', articleRouter);
app.use('/comments', commentRouter);

app.get('/', (req, res) => {
    res.json({ message: 'API đang chạy!' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Không tìm thấy route' });
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

module.exports = app;

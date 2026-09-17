const express = require('express');
const articlesRouter = require('./routes/articles');
const videosRouter = require('./routes/videos');

const app = express();
const PORT = 3002;

app.use(express.json());

// Mount routers for subset of application
app.use('/articles', articlesRouter);
app.use('/videos', videosRouter);

app.get('/', (req, res) => {
    res.send('Welcome to node-express API Server!');
});

app.listen(PORT, () => {
    console.log(`node-express server running on http://localhost:${PORT}`);
});

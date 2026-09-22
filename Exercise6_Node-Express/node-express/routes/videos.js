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

// GET all videos
router.get('/', (req, res) => {
    try {
        const db = readDb();
        res.json(db.videos || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// GET video by ID
router.get('/:id', (req, res) => {
    try {
        const db = readDb();
        const id = parseInt(req.params.id);
        const video = (db.videos || []).find(v => v.id === id);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        res.json(video);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// POST new video
router.post('/', (req, res) => {
    try {
        const db = readDb();
        const videos = db.videos || [];
        const { title, url } = req.body;
        
        if (!title || !url) {
            return res.status(400).json({ error: 'Title and URL are required' });
        }

        const newId = videos.length > 0 ? Math.max(...videos.map(v => v.id)) + 1 : 1;
        const newVideo = { id: newId, title, url };
        videos.push(newVideo);
        db.videos = videos;

        writeDb(db);
        res.status(201).json(newVideo);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save video' });
    }
});

// PUT update video by ID
router.put('/:id', (req, res) => {
    try {
        const db = readDb();
        const videos = db.videos || [];
        const id = parseInt(req.params.id);
        const index = videos.findIndex(v => v.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const { title, url } = req.body;
        if (title) videos[index].title = title;
        if (url) videos[index].url = url;

        db.videos = videos;
        writeDb(db);

        res.json(videos[index]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update video' });
    }
});

// DELETE video by ID
router.delete('/:id', (req, res) => {
    try {
        const db = readDb();
        const videos = db.videos || [];
        const id = parseInt(req.params.id);
        const index = videos.findIndex(v => v.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const deleted = videos.splice(index, 1)[0];
        db.videos = videos;
        writeDb(db);

        res.json({ message: 'Video deleted successfully', video: deleted });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete video' });
    }
});

module.exports = router;

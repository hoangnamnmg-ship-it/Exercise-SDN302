const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());

// Step 3: Read Data
app.get('/data', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read data file' });
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    });
});

// Step 3: Update Data
app.post('/update', (req, res) => {
    const newData = req.body;
    if (!newData || Object.keys(newData).length === 0) {
        return res.status(400).json({ error: 'JSON body is required' });
    }

    fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 4), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to update data file' });
        }
        res.json({ message: 'Data updated successfully', data: newData });
    });
});

app.listen(PORT, () => {
    console.log(`Exercise 1 server running on http://localhost:${PORT}`);
});

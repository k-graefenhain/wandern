const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tracks.json');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API: Hole alle Tracks
app.get('/api/tracks', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data);
});

// API: Speichere Track-Änderungen
app.post('/api/tracks/update', (req, res) => {
    const { id, done, date } = req.body;

    let tracks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const track = tracks.find(t => t.id === id);

    if (track) {
        track.done = done;
        track.date = date;
        fs.writeFileSync(DATA_FILE, JSON.stringify(tracks, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Track not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft unter http://localhost:${PORT}`);
});

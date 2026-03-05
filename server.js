const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.resolve(__dirname, 'leaderboard.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS scores (
        nickname TEXT PRIMARY KEY,
        score INTEGER
    )`);
});

app.get('/api/top', (req, res) => {
    db.all(`SELECT nickname, score FROM scores ORDER BY score DESC LIMIT 10`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/score', (req, res) => {
    const { nickname, score } = req.body;
    if (!nickname || typeof score !== 'number') {
        res.status(400).json({ error: 'Invalid data' });
        return;
    }

    db.get(`SELECT score FROM scores WHERE nickname = ?`, [nickname], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!row) {
            db.run(`INSERT INTO scores (nickname, score) VALUES (?, ?)`, [nickname, score]);
            res.json({ success: true, message: 'Score added' });
        } else if (score > row.score) {
            db.run(`UPDATE scores SET score = ? WHERE nickname = ?`, [score, nickname]);
            res.json({ success: true, message: 'Score updated' });
        } else {
            res.json({ success: true, message: 'Score not high enough' });
        }
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

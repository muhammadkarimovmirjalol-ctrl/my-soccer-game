const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory leaderboard store for dynamic score tracking
let highScores = [
  { name: "Sardor (Kapitan)", score: 450, club: "Real Madrid", date: "2026-06-29" },
  { name: "Messi_10", score: 420, club: "Barcelona", date: "2026-06-29" },
  { name: "CR7_Legend", score: 390, club: "Al Nassr", date: "2026-06-29" },
  { name: "Bellingham", score: 350, club: "Real Madrid", date: "2026-06-29" },
  { name: "Haaland_Goal", score: 310, club: "Man City", date: "2026-06-29" }
];

// Health check endpoint for Render / Uptime monitors
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime(), message: 'Soccer Server Running 24/7' });
});

// Leaderboard API routes
app.get('/api/leaderboard', (req, res) => {
  res.json(highScores);
});

app.post('/api/leaderboard', (req, res) => {
  const { name, score, club } = req.body;
  if (name && typeof score === 'number') {
    const newEntry = {
      name: name.substring(0, 15),
      score,
      club: club || "Custom FC",
      date: new Date().toISOString().split('T')[0]
    };
    highScores.push(newEntry);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10); // Keep top 10
    res.status(201).json({ success: true, leaderboard: highScores });
  } else {
    res.status(400).json({ error: 'Invalid score payload' });
  }
});

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`⚽ Ultimate 3D Football Server Running on Port ${PORT}`);
  console.log(`🚀 Ready for Render 24/7 Deployment!`);
  console.log(`===================================================`);
});

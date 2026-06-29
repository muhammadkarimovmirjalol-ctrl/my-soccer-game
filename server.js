const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Global Leaderboard Store
let highScores = [
  { name: "Sardor (Kapitan)", score: 890, club: "Real Madrid", date: "2026-06-29" },
  { name: "Messi_10", score: 840, club: "Barcelona", date: "2026-06-29" },
  { name: "CR7_Legend", score: 810, club: "Al Nassr", date: "2026-06-29" },
  { name: "Bellingham", score: 750, club: "Real Madrid", date: "2026-06-29" },
  { name: "Haaland_Goal", score: 710, club: "Man City", date: "2026-06-29" }
];

// Online Matchmaking Rooms State
const activeRooms = {};

io.on('connection', (socket) => {
  console.log(`⚡ Player Connected: ${socket.id}`);

  // Find or Create Online Room
  socket.on('find_match', (data) => {
    let roomFound = false;
    for (const roomId in activeRooms) {
      if (activeRooms[roomId].players.length === 1) {
        // Join existing room
        activeRooms[roomId].players.push({ id: socket.id, name: data.name || "Player 2", team: data.team || "Barcelona" });
        socket.join(roomId);
        socket.emit('match_found', { roomId, playerIndex: 1, opponent: activeRooms[roomId].players[0] });
        io.to(roomId).emit('start_online_match', { players: activeRooms[roomId].players });
        roomFound = true;
        break;
      }
    }

    if (!roomFound) {
      const newRoomId = 'room_' + Math.random().toString(36).substring(2, 9);
      activeRooms[newRoomId] = {
        id: newRoomId,
        players: [{ id: socket.id, name: data.name || "Player 1", team: data.team || "Real Madrid" }]
      };
      socket.join(newRoomId);
      socket.emit('match_waiting', { roomId: newRoomId, playerIndex: 0 });
    }
  });

  // Player State Sync (Position, Rotation, Animation)
  socket.on('player_move', (data) => {
    socket.to(data.roomId).emit('opponent_move', data);
  });

  // Ball Movement Sync
  socket.on('ball_sync', (data) => {
    socket.to(data.roomId).emit('opponent_ball_sync', data);
  });

  // Goal Event Sync
  socket.on('goal_scored', (data) => {
    io.to(data.roomId).emit('update_score', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Player Disconnected: ${socket.id}`);
    for (const roomId in activeRooms) {
      activeRooms[roomId].players = activeRooms[roomId].players.filter(p => p.id !== socket.id);
      if (activeRooms[roomId].players.length === 0) {
        delete activeRooms[roomId];
      } else {
        io.to(roomId).emit('opponent_disconnected');
      }
    }
  });
});

// REST APIs
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Ultra-Realistic 3D Soccer Server Online' });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(highScores);
});

app.post('/api/leaderboard', (req, res) => {
  const { name, score, club } = req.body;
  if (name && typeof score === 'number') {
    highScores.push({ name: name.substring(0, 15), score, club: club || "Custom FC", date: new Date().toISOString().split('T')[0] });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    res.status(201).json({ success: true, leaderboard: highScores });
  } else {
    res.status(400).json({ error: 'Invalid payload' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`⚽ Ultra-Realistic 3D Football Server on Port ${PORT}`);
  console.log(`🌐 Socket.io Online Multiplayer Active!`);
  console.log(`===================================================`);
});

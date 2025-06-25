const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'https://collab-whiteboard-sg6g.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err.message));

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Room = mongoose.model('Room', RoomSchema);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS (socket.io)'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  socket.on('join-room', async ({ roomId, username }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', { username });
  });

  socket.on('drawing', ({ roomId, data }) => {
    io.to(roomId).emit('drawing', data);
  });

  socket.on('update-canvas', ({ roomId, data }) => {
    socket.to(roomId).emit('update-canvas', data);
  });

  socket.on('clear-canvas', (roomId) => {
    io.to(roomId).emit('drawing', { type: 'clear' });
  });

  socket.on('disconnect', () => {});
});

app.post('/api/create-room', async (req, res) => {
  const { roomId, password } = req.body;

  try {
    const existing = await Room.findOne({ roomId });
    if (existing) return res.status(400).json({ message: 'Room ID already exists' });

    const newRoom = new Room({ roomId, password });
    await newRoom.save();
    res.status(201).json({ message: 'Room created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/join-room', async (req, res) => {
  const { roomId, password } = req.body;

  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.password !== password) return res.status(401).json({ message: 'Incorrect password' });

    res.status(200).json({ message: 'Room joined successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Whiteboard backend is running!');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

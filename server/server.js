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
  canvasData: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', RoomSchema);

const activeRooms = new Map();

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
  console.log('User connected:', socket.id);

  socket.on('join-room', async ({ roomId, username }) => {
    try {
      
      socket.join(roomId);
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, {
          users: new Map(),
          canvasData: ''
        });
      }

      const roomData = activeRooms.get(roomId);
      roomData.users.set(socket.id, {
        id: socket.id,
        username: username,
        color: generateUserColor()
      });

      const room = await Room.findOne({ roomId });
      if (room && room.canvasData) {
        socket.emit('canvas-state', room.canvasData);
      }

      socket.to(roomId).emit('user-joined', { 
        username,
        userId: socket.id,
        userCount: roomData.users.size
      });

      const usersList = Array.from(roomData.users.values());
      socket.emit('users-list', usersList);
      io.to(roomId).emit('user-count', roomData.users.size);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  });

  socket.on('drawing', ({ roomId, data }) => {
    socket.to(roomId).emit('drawing', data);
    if (activeRooms.has(roomId)) {
      const roomData = activeRooms.get(roomId);
      if (data.type === 'canvas-update') {
        roomData.canvasData = data.canvasData;
      }
    }
  });

  socket.on('update-canvas', async ({ roomId, canvasData }) => {
    try {
      await Room.findOneAndUpdate(
        { roomId },
        { canvasData },
        { upsert: false }
      );
      if (activeRooms.has(roomId)) {
        activeRooms.get(roomId).canvasData = canvasData;
      }
      socket.to(roomId).emit('canvas-updated', canvasData);
    } catch (error) {
      console.error('Error updating canvas:', error);
    }
  });

  socket.on('clear-canvas', (roomId) => {
    io.to(roomId).emit('clear-canvas');
    if (activeRooms.has(roomId)) {
      activeRooms.get(roomId).canvasData = '';
    }
  });

  socket.on('cursor-move', ({ roomId, x, y }) => {
    socket.to(roomId).emit('cursor-move', {
      userId: socket.id,
      x,
      y
    });
  });

  socket.on('undo', (roomId) => {
    socket.to(roomId).emit('undo');
  });

  socket.on('redo', (roomId) => {
    socket.to(roomId).emit('redo');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    activeRooms.forEach((roomData, roomId) => {
      if (roomData.users.has(socket.id)) {
        const user = roomData.users.get(socket.id);
        roomData.users.delete(socket.id);
        socket.to(roomId).emit('user-left', {
          username: user.username,
          userId: socket.id,
          userCount: roomData.users.size
        });
        socket.to(roomId).emit('user-count', roomData.users.size);
        if (roomData.users.size === 0) {
          activeRooms.delete(roomId);
        }
      }
    });
  });

  socket.on('create-room', async ({ roomId, password, username }) => {
    try {
      const existing = await Room.findOne({ roomId });
      if (existing) {
        socket.emit('error', 'Room ID already exists');
        return;
      }

      const newRoom = new Room({ roomId, password });
      await newRoom.save();
      socket.emit('room-created', { roomId });
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', 'Failed to create room');
    }
  });
});

app.post('/api/create-room', async (req, res) => {
  const { roomId, password } = req.body;
  try {
    const existing = await Room.findOne({ roomId });
    if (existing) {
      return res.status(400).json({ message: 'Room ID already exists' });
    }
    const newRoom = new Room({ roomId, password });
    await newRoom.save();
    res.status(201).json({ message: 'Room created successfully' });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/join-room', async (req, res) => {
  const { roomId, password } = req.body;
  try {
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (room.password !== password) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    res.status(200).json({ 
      message: 'Room joined successfully',
      roomData: {
        roomId: room.roomId,
        canvasData: room.canvasData
      }
    });
  } catch (err) {
    console.error('Join room error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/room/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    const activeRoom = activeRooms.get(req.params.roomId);
    const userCount = activeRoom ? activeRoom.users.size : 0;
    res.json({
      roomId: room.roomId,
      userCount,
      createdAt: room.createdAt
    });
  } catch (err) {
    console.error('Get room error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Whiteboard backend is running!');
});

function generateUserColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F39C12',
    '#E74C3C', '#9B59B6', '#3498DB', '#1ABC9C'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

});

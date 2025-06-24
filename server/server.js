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
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true

}));

app.use(express.json());


mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err.message));


const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Room = mongoose.model('Room', RoomSchema);


const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true  
  }
});

io.on("connection", (socket) => {
  console.log(`🔌 ${socket.id} connected`);

  socket.on("join-room", async ({ roomId, username }) => {
    socket.join(roomId);
    console.log(`${username} joined room ${roomId}`);
    socket.to(roomId).emit("user-joined", { username });
  });

  socket.on("drawing", ({ roomId, data }) => {
    socket.to(roomId).emit("drawing", data);
  });

  socket.on("update-canvas", ({ roomId, data }) => {
    socket.to(roomId).emit("update-canvas", data);
  });

  socket.on("clear-canvas", (roomId) => {
    socket.to(roomId).emit("clear-canvas");
  });

  socket.on("disconnect", () => {
    console.log(`❌ ${socket.id} disconnected`);
  });
});


app.post('/api/create-room', async (req, res) => {
  const { roomId, password } = req.body;
  console.log("📥 Creating room:", roomId, password);

  try {
    const existing = await Room.findOne({ roomId });
    if (existing) {
      console.log("❌ Room ID already exists");
      return res.status(400).json({ message: 'Room ID already exists' });
    }

    const newRoom = new Room({ roomId, password });
    await newRoom.save();

    console.log("✅ Room created:", newRoom);
    res.status(201).json({ message: 'Room created successfully' });
  } catch (err) {
    console.error("❌ Error in /api/create-room:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/api/join-room', async (req, res) => {
  const { roomId, password } = req.body;
  console.log("🔑 Joining room:", roomId, password);

  try {
    const room = await Room.findOne({ roomId });
    if (!room) {
      console.log("❌ Room not found");
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.password !== password) {
      console.log("❌ Incorrect password");
      return res.status(401).json({ message: 'Incorrect password' });
    }

    console.log("✅ Room joined");
    res.status(200).json({ message: 'Room joined successfully' });
  } catch (err) {
    console.error("❌ Error in /api/join-room:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/', (req, res) => {
  res.send('Whiteboard backend is running!');
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

# 🖊️ Collab Whiteboard

A real-time collaborative whiteboard application that allows multiple users to draw, annotate, and brainstorm together simultaneously in shared rooms — built with the MERN stack and Socket.IO.

🔗 **Live Demo:** [collab-whiteboard-six.vercel.app](https://collab-whiteboard-six.vercel.app)

---

## 📌 Features

- 🎨 **Freehand Drawing** — Smooth pen tool with customizable color and stroke width
- 📐 **Shape Tools** — Draw rectangles, lines, and other shapes
- ✏️ **Text Annotations** — Add text anywhere on the canvas
- ↩️ **Undo / Redo** — Step through drawing history
- 🔒 **Room-Based Sessions** — Create or join password-protected rooms via a unique Room ID
- 💾 **Persistent Canvas** — Canvas state saved to MongoDB; new users joining a room see the full existing canvas
- ⚡ **Real-Time Sync** — All drawing actions broadcast instantly to every user in the room via WebSockets

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, HTML5 Canvas API |
| Backend | Node.js, Express.js |
| Real-Time | Socket.IO (WebSockets) |
| Database | MongoDB Atlas |
| Deployment | Vercel (Frontend), Render (Backend) |

## 🏗️ Architecture Overview

User draws on canvas

↓

React captures mouse events → emits Socket.IO event with stroke data

↓

Node.js + Express server receives event

↓

Server broadcasts to all clients in the same room (Socket.IO rooms)

↓

Other clients render the stroke on their canvas in real time

↓

Stroke persisted to MongoDB Atlas for new users joining the room

---

## 🚀 Getting Started (Local Setup)

### Prerequisites

- Node.js >= 16
- MongoDB Atlas URI (or local MongoDB instance)

### 1. Clone the repository

```bash
git clone https://github.com/Madhu-pri-rdy14/collab-whiteboard.git
cd collab-whiteboard
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file inside `/server`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
CLIENT_URL=http://localhost:3000
```

Start the server:

```bash
npm start
```

### 3. Set up the frontend

```bash
cd ../client
npm install
```

Create a `.env` file inside `/client`:

```env
REACT_APP_SERVER_URL=http://localhost:5000
```

Start the React app:

```bash
npm start
```

The app will be running at `http://localhost:3000`.

---

## 📁 Project Structure

collab-whiteboard/

├── client/                 # React frontend

│   ├── src/

│   │   ├── components/     # Whiteboard, Toolbar, RoomJoin, etc.

│   │   ├── socket.js       # Socket.IO client setup

│   │   └── App.js

│   └── package.json

│

├── server/                 # Node.js backend

│   ├── models/             # Mongoose schemas (Room, Stroke)

│   ├── routes/             # Express API routes

│   ├── socket/             # Socket.IO event handlers

│   ├── server.js

│   └── package.json

│

└── README.md

---

## 🔌 Key Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `join-room` | Client → Server | User joins a specific room |
| `draw` | Client → Server | Emits stroke data while drawing |
| `draw` | Server → Clients | Broadcasts stroke to all room members |
| `undo` | Client → Server | Triggers undo for all room members |
| `canvas-state` | Server → Client | Sends full canvas history to a newly joined user |
| `disconnect` | Auto | Cleans up socket on user leave |

---

## 🌐 Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | [collab-whiteboard-six.vercel.app](https://collab-whiteboard-six.vercel.app) |
| Backend | Render | Auto-deployed from `main` branch |
| Database | MongoDB Atlas | Cloud-hosted cluster |

> **Note:** The backend is hosted on Render's free tier, which may cause a cold start delay of ~30 seconds on first load after a period of inactivity.

---

## 🔮 Future Improvements

- [ ] Live cursor tracking with user name tags
- [ ] Synchronized undo/redo across all users in a room
- [ ] JWT-based authentication and user profiles
- [ ] Export canvas as PNG / PDF
- [ ] Eraser tool and canvas clear option
- [ ] Mobile touch support

---

## 👩‍💻 Author

**Madhu Priya**
B.Tech Computer Science, IIT Roorkee
[GitHub](https://github.com/Madhu-pri-rdy14)

---


---

 Collab Whiteboard

A real-time collaborative whiteboard web app where users can draw, write, and interact together in shared rooms.

Features

- Create and join rooms with password protection
- Real-time drawing and canvas sync using Socket.IO
- Pen, shapes, text, and clear canvas tools
- Responsive interface for better usability

Tech Stack

- **Frontend:** React.js (Vercel hosted)
- **Backend:** Node.js + Express + Socket.IO (Render hosted)
- **Database:** MongoDB Atlas

Project Structure

collab-whiteboard/
├── client/ 

React frontend

└── server
 Node.js backend

 Local Development

 1. Clone the repository

git clone https://github.com/Madhu-pri-rdy14/collab-whiteboard.git
cd collab-whiteboard

2. Setup environment files
In client/.env
ini

REACT_APP_SOCKET_URL=https://collab-whiteboard-oriq.onrender.com

In server/.env


PORT=3001

3. Install dependencies

cd client

npm install

cd ../server

npm install
4. Run locally

Start backend:

cd server

node server.js

Start frontend:

cd client

npm start

 Live Demo
 
Frontend: https://collab-whiteboard-six.vercel.app/

Backend: https://collab-whiteboard-oriq.onrender.com
 Author
Madhu Priya
GitHub: Madhu-pri-rdy14

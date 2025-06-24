
import React, { useState } from 'react';

const Login = ({ onJoin }) => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleJoin = () => {
    if (username && roomId) {
      localStorage.setItem('username', username);
      localStorage.setItem('roomId', roomId);
      onJoin({ username, roomId });
    }
  };

  return (
    <div className="login-container">
      <h2>Join a Room</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={handleJoin}>Join</button>
    </div>
  );
};

export default Login;

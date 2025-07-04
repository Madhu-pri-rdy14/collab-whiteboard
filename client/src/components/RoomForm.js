import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RoomForm = () => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('create');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !roomId || !password) {
      alert('Please fill all fields');
      return;
    }

    try {
      const endpoint = mode === 'create' ? '/api/create-room' : '/api/join-room';
      const backendUrl = 'https://collab-whiteboard-oriq.onrender.com';

      const res = await axios.post(`${backendUrl}${endpoint}`, {
        roomId,
        password,
      });

      alert(res.data.message);
      localStorage.setItem('username', username);
      localStorage.setItem('roomId', roomId);

      navigate('/whiteboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="login-container">
      <h2>{mode === 'create' ? 'Create Room' : 'Join Room'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Room Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          style={{
            backgroundColor: mode === 'create' ? '#28a745' : '#17a2b8',
            color: 'white',
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {mode === 'create' ? 'Create Room' : 'Join Room'}
        </button>
      </form>

      <p style={{ marginTop: '10px' }}>
        {mode === 'create' ? 'Want to join?' : 'Want to create?'}{' '}
        <button
          type="button"
          onClick={() => setMode(mode === 'create' ? 'join' : 'create')}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '6px 10px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Switch to {mode === 'create' ? 'Join' : 'Create'}
        </button>
      </p>
    </div>
  );
};

export default RoomForm;

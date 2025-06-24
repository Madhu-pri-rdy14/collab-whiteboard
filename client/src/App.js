import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoomForm from './components/RoomForm';
import Whiteboard from './components/Whiteboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoomForm />} />
        <Route path="/whiteboard" element={<Whiteboard role="edit" />} />
      </Routes>
    </Router>
  );
}

export default App; 

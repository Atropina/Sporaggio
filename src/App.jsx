import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Room from './components/Room';
import JoinRoom from './components/JoinRoom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomCode" element={<Room />} />
      <Route path="/join/:roomCode" element={<JoinRoom />} />
    </Routes>
  );
}

export default App;

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Footer from './components/Footer';
import Home from './pages/Home';
import Chat from './pages/Chat';
import './styles/main.css';
import './App.css'

function App() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;

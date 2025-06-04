import React from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import Footer from './components/Footer';
import Header from './components/Header';
import SessionChatbox from './components/SessionChatbox';
import Sidebar from './components/Sidebar';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import './styles/main.css';

function App() {
  // We'll pass sessionId to Sidebar if available from Chat
  // For now, we'll use a simple layout and let Chat manage sessionId
  return (
    <div>
      <Header />
      <div style={{ display: 'flex', minHeight: '80vh' }}>
        <Sidebar />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/session-chat" element={<SessionChatbox />} />
          </Routes>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;

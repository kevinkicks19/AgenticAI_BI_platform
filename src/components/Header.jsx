import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header>
      <h1>Agentic AI Business Intelligence Platform</h1>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/chat">Chat</Link></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
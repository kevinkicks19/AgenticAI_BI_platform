import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './components/Chat';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/chat" element={<Chat />} />
        <Route path="/" element={<Chat />} /> {/* Redirect root to chat for now */}
      </Routes>
    </Router>
  );
};

export default App; 
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Chat from './components/Chat';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen w-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/chat" element={<Chat />} />
              <Route path="/" element={<Chat />} /> {/* Redirect root to chat for now */}
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App; 
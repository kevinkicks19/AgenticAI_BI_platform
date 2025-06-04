import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ sessionId }) => {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/project?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => setProject(data));
    fetch(`/api/tasks?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => setTasks(data));
    fetch(`/api/suggestions?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => setSuggestions(data));
  }, [sessionId]);

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: 24 }}>
        <Link to="/session-chat" className="sidebar-link-primary">🗨️ Coordinator Chat</Link>
      </div>
      <div className="sidebar-section">
        <h2>Project</h2>
        {project ? (
          <>
            <div><strong>Name:</strong> {project.project?.name || 'Untitled'}</div>
            <div><strong>Summary:</strong> {project.summary}</div>
          </>
        ) : <div>Loading...</div>}
      </div>
      <div className="sidebar-section">
        <h2>Tasks</h2>
        {tasks.length > 0 ? (
          <ul>
            {tasks.map((task, idx) => (
              <li key={idx}>{task.title || JSON.stringify(task)}</li>
            ))}
          </ul>
        ) : <div>No tasks yet.</div>}
      </div>
      <div className="sidebar-section">
        <h2>Suggestions</h2>
        {suggestions.length > 0 ? (
          <ul>
            {suggestions.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        ) : <div>No suggestions yet.</div>}
      </div>
    </aside>
  );
};

export default Sidebar; 
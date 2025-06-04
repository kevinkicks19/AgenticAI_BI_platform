import React, { useState } from 'react';
import { FaBars, FaChartBar, FaCog, FaFileExport, FaKey, FaLink, FaListAlt, FaMemory, FaProjectDiagram, FaTachometerAlt, FaUsers } from 'react-icons/fa';

const navItems = [
  { label: 'Dashboard', icon: <FaTachometerAlt />, path: '#' },
  { label: 'Requests', icon: <FaListAlt />, path: '#' },
  { label: 'Memories', icon: <FaMemory />, path: '#' },
  { label: 'Graph Memory', icon: <FaProjectDiagram />, path: '#' },
  { label: 'Users', icon: <FaUsers />, path: '#' },
  { label: 'API Keys', icon: <FaKey />, path: '#' },
  { label: 'Webhooks', icon: <FaLink />, path: '#' },
  { label: 'Memory Exports', icon: <FaFileExport />, path: '#' },
  { label: 'Settings', icon: <FaCog />, path: '#' },
  { label: 'Usage', icon: <FaChartBar />, path: '#' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`flex flex-col h-full bg-white border-r transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}> 
      <div className="flex items-center justify-between p-4 border-b">
        <span className={`font-bold text-lg transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>Menu</span>
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-500 focus:outline-none">
          <FaBars size={20} />
        </button>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.path}
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 
import React from 'react';

const Header = () => {
  return (
    <header className="flex items-center justify-between bg-white border-b px-6 py-3 h-16">
      <div className="flex items-center gap-4">
        <span className="font-bold text-xl">mem0</span>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-lg">kevin68-default-org</span>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-lg">default-project</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">K</div>
      </div>
    </header>
  );
};

export default Header; 
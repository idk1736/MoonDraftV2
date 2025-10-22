// src/components/NavButton.jsx
import React from 'react';

export default function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md font-semibold ${
        active ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

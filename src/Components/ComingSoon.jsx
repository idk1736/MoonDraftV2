import React from 'react';

export default function ComingSoon({ title, description }) {
  return (
    <div className="bg-white/3 p-8 rounded-lg text-center">
      <div className="text-2xl font-semibold mb-2">{title} (coming soon)</div>
      <div className="text-sm text-white/60">{description}</div>
    </div>
  );
}

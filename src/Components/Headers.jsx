import React from 'react';
import NavButton from './NavButton';

export default function Header({ route, setRoute, balance }) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg" style={{
          background: 'linear-gradient(90deg,var(--md-violet),var(--md-cyan))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#000', fontWeight: 700
        }}>MD</div>
        <div>
          <div className="text-xl font-bold">MoonDraft</div>
          <div className="text-xs text-white/60">Paper memecoin trading — practice the pump without the burn</div>
        </div>
      </div>

      <nav className="flex items-center gap-3">
        <NavButton active={route === '/market'} onClick={() => setRoute('/market')}>Market</NavButton>
        <NavButton active={route === '/portfolio'} onClick={() => setRoute('/portfolio')}>Portfolio</NavButton>
        <NavButton active={route === '/create'} onClick={() => setRoute('/create')}>Create</NavButton>
        <NavButton active={route === '/labs'} onClick={() => setRoute('/labs')}>Labs</NavButton>
        <NavButton active={route === '/settings'} onClick={() => setRoute('/settings')}>Settings</NavButton>
      </nav>

      <div className="text-right">
        <div className="text-sm text-white/80">Balance</div>
        <div className="text-lg font-mono font-semibold">${balance.toLocaleString()}</div>
      </div>
    </header>
  );
}

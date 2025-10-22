import React from 'react';

export default function CoinCard({ coin, onTrade }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-md hover:bg-white/5 transition">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">{coin.emoji}</div>
        <div>
          <div className="font-semibold">{coin.name} <span className="text-xs text-white/60 ml-2">{coin.symbol}</span></div>
          <div className="text-xs text-white/60">Age: {coin.age}s • Supply {coin.supply.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-mono font-semibold">${coin.price.toFixed(6)}</div>
          <div className="text-xs text-white/60">{coin.isRug ? '⚠️ rug risk' : coin.isDump ? '🔻 dump risk' : '—'}</div>
        </div>
        <div>
          <button
            className="px-3 py-1 rounded-md"
            style={{ background: 'linear-gradient(90deg,var(--md-violet),var(--md-cyan))', color: '#000', fontWeight: 700 }}
            onClick={() => onTrade(coin)}
          >
            Trade
          </button>
        </div>
      </div>
    </div>
  );
}

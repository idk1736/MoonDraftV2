import React from 'react';

export default function Portfolio({ portfolio, now, currentCoinState, sell, setSelectedCoin }) {
  const portfolioValue = Object.keys(portfolio).reduce((total, id) => {
    const state = currentCoinState(now, parseInt(id.split('-')[1], 10));
    return total + state.price * portfolio[id].qty;
  }, 0);

  return (
    <div className="space-y-3">
      {Object.keys(portfolio).length === 0 && <div className="text-white/60">No holdings yet — trade in Market to get started.</div>}
      {Object.entries(portfolio).map(([id, h]) => {
        const state = currentCoinState(now, parseInt(id.split('-')[1], 10));
        const val = state.price * h.qty;
        const pnl = val - h.qty * h.avgPrice;
        const pnlPct = (val / (h.qty * h.avgPrice) - 1) * 100;

        return (
          <div key={id} className="flex items-center justify-between bg-white/4 p-3 rounded-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center text-xl">{h.meta.emoji}</div>
              <div>
                <div className="font-semibold">{h.meta.name} <span className="text-xs text-white/60 ml-2">{h.meta.symbol}</span></div>
                <div className="text-xs text-white/60">{h.qty.toFixed(6)} • avg ${h.avgPrice.toFixed(6)}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono">${val.toFixed(6)}</div>
              <div className={`${pnl >= 0 ? 'text-green-300' : 'text-red-300'} text-sm`}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(6)} ({pnlPct.toFixed(1)}%)</div>
              <div className="mt-2 flex gap-2 justify-end">
                <button className="px-3 py-1 rounded-md bg-white/5" onClick={() => setSelectedCoin(h.meta)}>Trade</button>
                <button className="px-3 py-1 rounded-md bg-red-600/80" onClick={() => sell(id, h.qty)}>Sell all</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

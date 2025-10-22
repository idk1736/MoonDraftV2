import React, { useState } from 'react';

export default function TradeModal({ coin, now, currentCoinState, portfolio, buy, sell, onClose }) {
  const [tradeAmt, setTradeAmt] = useState(100);

  function handleBuy() {
    const res = buy(coin.id, tradeAmt);
    if (res.success) alert(`Bought ${res.qty.toFixed(6)} @ $${res.price.toFixed(6)}`);
    else alert(res.message);
  }

  function handleSell() {
    const holding = portfolio[coin.id]?.qty || 0;
    const qty = Math.min(holding, tradeAmt / coin.price || 0);
    if (qty <= 0) {
      alert('No holdings to sell');
      return;
    }
    const res = sell(coin.id, qty);
    if (res.success) alert(`Sold ${qty.toFixed(6)} @ $${res.price.toFixed(6)} for $${res.proceeds.toFixed(6)}`);
    else alert(res.message);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center p-6">
      <div className="bg-[#071232] border border-white/5 rounded-lg w-full max-w-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center text-2xl">{coin.emoji}</div>
            <div>
              <div className="text-xl font-semibold">{coin.name} <span className="text-white/60 ml-2">{coin.symbol}</span></div>
              <div className="text-sm text-white/60">{coin.isRug ? '⚠️ Likely rug pull' : coin.isDump ? '🔻 Potential dump' : '—'}</div>
            </div>
          </div>
          <div>
            <div className="text-right font-mono font-semibold">${coin.price.toFixed(6)}</div>
            <div className="text-xs text-white/60">Supply {coin.supply.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Amount (USD)</label>
            <input
              type="number"
              value={tradeAmt}
              onChange={(e) => setTradeAmt(Number(e.target.value))}
              className="w-full mt-2 bg-white/5 rounded px-3 py-2"
            />
            <div className="mt-2 flex gap-2">
              <button
                className="px-3 py-2 rounded"
                style={{ background: 'linear-gradient(90deg,var(--md-violet),var(--md-cyan))', color: '#000', fontWeight: 700 }}
                onClick={handleBuy}
              >
                Buy
              </button>
              <button
                className="px-3 py-2 rounded bg-red-600/80 text-black font-semibold"
                onClick={handleSell}
              >
                Sell
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm">Info</label>
            <div className="mt-2 text-sm text-white/60">
              Price changes are deterministic: a coin created at a given second will show the same simulated history for all users opening the site at that same time. Some coins are flagged as rug pulls — they'll collapse to near-zero after a short time. Use position sizing and stop concepts.
            </div>
          </div>
        </div>

        <div className="mt-4 text-right">
          <button className="px-4 py-2 rounded-md bg-white/5" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

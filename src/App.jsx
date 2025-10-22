import React, { useState, useEffect, useMemo } from 'react';
import Header from './Components/Header';
import { currentCoinState } from './engine/coinEngine';

// Mini SVG line chart for per-token page
function LineChart({ data }) {
  if (!data.length) return null;
  const prices = data.map(d => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const width = 500;
  const height = 200;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.price - min) / (max - min + 0.000001)) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height}>
      <polyline
        fill="none"
        stroke="#4F88FF"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

export default function App() {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [balance, setBalance] = useState(() => {
    const stored = localStorage.getItem('md_balance_pro');
    return stored ? Number(stored) : 10000;
  });
  const [portfolio, setPortfolio] = useState(() => {
    try {
      const stored = localStorage.getItem('md_portfolio_pro');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [selectedCoin, setSelectedCoin] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => localStorage.setItem('md_balance_pro', String(balance)), [balance]);
  useEffect(() => localStorage.setItem('md_portfolio_pro', JSON.stringify(portfolio)), [portfolio]);

  // Coins list
  const visibleSeconds = 1800;
  const newestTs = now;
  const oldestTs = Math.max(0, now - visibleSeconds);
  const coins = useMemo(() => {
    const arr = [];
    for (let t = newestTs; t >= oldestTs; t--) {
      const state = currentCoinState(newestTs, t);
      arr.push({ ...state.meta, price: state.price, age: state.age });
    }
    return arr;
  }, [newestTs, oldestTs]);

  // URL token param
  const params = new URLSearchParams(window.location.search);
  const tokenId = params.get('token');

  // Buy function
  function buy(coinId, amountUSD) {
    const state = currentCoinState(now, parseInt(coinId.split('-')[1], 10));
    if (amountUSD > balance) return { success: false, message: 'Insufficient balance' };
    const slippage = Math.min(0.2, 0.005 + 0.5 / Math.sqrt(state.supply));
    const effectivePrice = state.price * (1 + slippage * (Math.random() - 0.5));
    const qty = amountUSD / effectivePrice;
    setBalance(b => b - amountUSD);
    setPortfolio(p => {
      const next = { ...p };
      if (!next[coinId]) next[coinId] = { qty: 0, avgPrice: 0, meta: state };
      const entry = next[coinId];
      const newQty = entry.qty + qty;
      entry.avgPrice = (entry.avgPrice * entry.qty + effectivePrice * qty) / newQty;
      entry.qty = newQty;
      entry.meta = state;
      return next;
    });
    return { success: true, qty, price: effectivePrice };
  }

  // Sell function
  function sell(coinId, qtyToSell) {
    const state = currentCoinState(now, parseInt(coinId.split('-')[1], 10));
    const holding = portfolio[coinId];
    if (!holding || holding.qty < qtyToSell) return { success: false, message: 'Insufficient coins' };
    const slippage = Math.min(0.25, 0.005 + 0.6 / Math.sqrt(state.supply));
    const effectivePrice = state.price * (1 - slippage * (Math.random() - 0.5));
    const proceeds = effectivePrice * qtyToSell;
    setBalance(b => b + proceeds);
    setPortfolio(p => {
      const next = { ...p };
      next[coinId] = { ...next[coinId] };
      next[coinId].qty -= qtyToSell;
      if (next[coinId].qty <= 0.000001) delete next[coinId];
      return next;
    });
    return { success: true, proceeds, price: effectivePrice };
  }

  // Per-token page
  if (tokenId) {
    const state = currentCoinState(now, parseInt(tokenId.split('-')[1], 10));
    const history = [];
    for (let t = now - 60; t <= now; t++) {
      const s = currentCoinState(now, parseInt(tokenId.split('-')[1], 10) - (now - t));
      history.push({ ts: t, price: s.price });
    }
    return (
      <div className="min-h-screen p-6 bg-[#0B0E1A] text-[#E6E8F0] font-sans">
        <a href="/" className="text-sm text-[#A0A3B0] mb-4 inline-block">← Back to Market</a>
        <div className="mb-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="text-3xl font-semibold mb-2">{state.meta.name} ({state.meta.symbol})</div>
            <div className="text-sm text-[#A0A3B0] mb-2">Supply: {state.meta.supply.toLocaleString()}</div>
            <div className="text-xs text-red-400">{state.meta.isRug ? '⚠️ Rug pull risk' : state.meta.isDump ? '🔻 Dump risk' : ''}</div>
            <div className="text-2xl font-mono mt-4">${state.price.toFixed(6)}</div>
          </div>
          <div className="flex-1">
            <div className="bg-[#1E2235] p-4 rounded-md">
              <div className="mb-2 font-semibold">Buy / Sell</div>
              <input type="number" placeholder="USD amount" id="tradeAmount" className="w-full mb-2 p-2 rounded bg-[#0B0E1A] text-[#E6E8F0]" />
              <div className="flex gap-2">
                <button
                  className="flex-1 p-2 rounded bg-[#4F88FF] hover:bg-[#3A6FCC]"
                  onClick={() => {
                    const amt = Number(document.getElementById('tradeAmount').value);
                    buy(tokenId, amt);
                  }}
                >
                  Buy
                </button>
                <button
                  className="flex-1 p-2 rounded bg-[#FF4F4F] hover:bg-[#CC3A3A]"
                  onClick={() => {
                    const amt = Number(document.getElementById('tradeAmount').value);
                    const qty = amt / state.price;
                    sell(tokenId, qty);
                  }}
                >
                  Sell
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#1E2235] p-4 rounded-md">
          <LineChart data={history} />
        </div>
      </div>
    );
  }

  // Homepage
  return (
    <div className="min-h-screen p-6 bg-[#0B0E1A] text-[#E6E8F0] font-sans">
      <Header route="/market" setRoute={() => {}} balance={balance} />
      <table className="w-full mt-6 text-left border-collapse">
        <thead>
          <tr className="text-[#A0A3B0] border-b border-[#1E2235]">
            <th className="py-2 px-4">Name</th>
            <th className="py-2 px-4">Symbol</th>
            <th className="py-2 px-4">Price</th>
            <th className="py-2 px-4">Supply</th>
            <th className="py-2 px-4">Age (s)</th>
            <th className="py-2 px-4">Risk</th>
          </tr>
        </thead>
        <tbody>
          {coins.map(c => (
            <tr key={c.id} className="hover:bg-[#1E2235] cursor-pointer">
              <td className="py-2 px-4"><a href={`/?token=${c.id}`} className="hover:underline">{c.name}</a></td>
              <td className="py-2 px-4">{c.symbol}</td>
              <td className="py-2 px-4 font-mono">${c.price.toFixed(6)}</td>
              <td className="py-2 px-4">{c.supply.toLocaleString()}</td>
              <td className="py-2 px-4">{c.age}</td>
              <td className="py-2 px-4">{c.isRug ? '⚠️ Rug' : c.isDump ? '🔻 Dump' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

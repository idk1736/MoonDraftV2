import React, { useState, useEffect, useMemo } from 'react';
import Header from './Components/Header';
import CoinCard from './Components/CoinCard';
import Portfolio from './Components/Portfolio';
import TradeModal from './Components/TradeModal';
import ComingSoon from './Components/ComingSoon';
import { currentCoinState } from './engine/coinEngine';

// Simple chart using SVG
function MiniChart({ history }) {
  if (!history.length) return null;
  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const width = 300;
  const height = 80;
  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((h.price - min) / (max - min + 0.000001)) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height}>
      <polyline fill="none" stroke="#8B5CF6" strokeWidth="2" points={points} />
    </svg>
  );
}

export default function App() {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [balance, setBalance] = useState(() => {
    const stored = localStorage.getItem('md_balance_v2');
    return stored ? Number(stored) : 10000;
  });
  const [portfolio, setPortfolio] = useState(() => {
    try {
      const stored = localStorage.getItem('md_portfolio_v2');
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

  useEffect(() => localStorage.setItem('md_balance_v2', String(balance)), [balance]);
  useEffect(() => localStorage.setItem('md_portfolio_v2', JSON.stringify(portfolio)), [portfolio]);

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

  // King of the Hill
  const kingCoin = useMemo(() => {
    if (!coins.length) return null;
    return coins.reduce((a, b) => (b.price > a.price ? b : a));
  }, [coins]);

  // URL query for token page
  const params = new URLSearchParams(window.location.search);
  const tokenId = params.get('token'); // e.g., ?token=coin-1700000000

  // Trade functions
  function buy(coinId, amountUSD) {
    const state = currentCoinState(now, parseInt(coinId.split('-')[1], 10));
    const price = state.price;
    if (amountUSD > balance) return { success: false, message: 'Insufficient balance' };
    const slippage = Math.min(0.2, 0.005 + 0.5 / Math.sqrt(state.supply));
    const effectivePrice = price * (1 + slippage * (Math.random() - 0.5));
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

  // Per-token page view
  if (tokenId) {
    const state = currentCoinState(now, parseInt(tokenId.split('-')[1], 10));
    const history = [];
    for (let t = now - 60; t <= now; t++) {
      const s = currentCoinState(now, parseInt(tokenId.split('-')[1], 10) - (now - t));
      history.push({ ts: t, price: s.price });
    }
    return (
      <div className="min-h-screen p-6 bg-[#071032] text-white">
        <a href="/" className="text-sm text-white/60 mb-4 inline-block">← Back to Market</a>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-5xl">{state.meta.emoji}</div>
          <div>
            <div className="text-2xl font-bold">{state.meta.name} ({state.meta.symbol})</div>
            <div className="text-sm text-white/60">Supply: {state.meta.supply.toLocaleString()}</div>
            <div className="text-xs text-red-400">{state.meta.isRug ? '⚠️ Rug pull risk' : state.meta.isDump ? '🔻 Dump risk' : ''}</div>
          </div>
        </div>
        <div className="mb-6 w-full h-32 bg-white/5 rounded-lg p-2">
          <MiniChart history={history} />
        </div>
        <TradeModal coin={{ ...state.meta, price: state.price, id: tokenId }} buy={buy} sell={sell} portfolio={portfolio} now={now} onClose={() => {}} />
      </div>
    );
  }

  // Home page
  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-[#071032] to-[#031428] text-white font-sans">
      <Header route="/market" setRoute={() => {}} balance={balance} />
      {kingCoin && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-400 to-red-500 text-black font-bold mb-4">
          👑 King of the Hill: {kingCoin.name} (${kingCoin.price.toFixed(6)})
        </div>
      )}
      <div className="space-y-3">
        {coins.map(c => (
          <div key={c.id} className="relative">
            <a href={`/?token=${c.id}`}>
              <CoinCard coin={c} onTrade={coin => setSelectedCoin(coin)} />
            </a>
            {/* optional background image for coins */}
            <div className="absolute inset-0 opacity-10 z-0">
              <span className="text-9xl flex justify-center items-center w-full h-full">{c.emoji}</span>
            </div>
          </div>
        ))}
      </div>
      {selectedCoin && (
        <TradeModal coin={selectedCoin} now={now} currentCoinState={currentCoinState} portfolio={portfolio} buy={buy} sell={sell} onClose={() => setSelectedCoin(null)} />
      )}
    </div>
  );
}

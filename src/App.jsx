import React, { useState, useEffect, useMemo } from 'react';
import NavButton from './Components/NavButton';
import { currentCoinState } from './engine/coinEngine';

function formatUSD(n) {
  if (!isFinite(n)) return '-';
  return n >= 1 ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${n.toFixed(6)}`;
}

function shortNumber(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return `${n.toFixed(2)}`;
}

export default function App() {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const [route, setRoute] = useState('/market');
  const [search, setSearch] = useState('');
  const [balance, setBalance] = useState(() => {
    const r = localStorage.getItem('md_balance_v1');
    return r ? Number(r) : 10000;
  });
  useEffect(() => localStorage.setItem('md_balance_v1', String(balance)), [balance]);

  const [portfolio, setPortfolio] = useState(() => {
    try {
      const r = localStorage.getItem('md_portfolio_v1');
      return r ? JSON.parse(r) : {};
    } catch (e) {
      return {};
    }
  });
  useEffect(() => localStorage.setItem('md_portfolio_v1', JSON.stringify(portfolio)), [portfolio]);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coins.filter(c => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  }, [coins, search]);

  const [selectedCoin, setSelectedCoin] = useState(null);
  const [tradeAmt, setTradeAmt] = useState(100);

  function buy(coinId, amountUSD) {
    const state = currentCoinState(now, parseInt(coinId.split('-')[1], 10));
    const price = state.price;
    if (amountUSD > balance) return { success: false, message: 'insufficient balance' };
    const slippage = Math.min(0.2, 0.005 + 0.5 / Math.sqrt(state.meta.supply));
    const effectivePrice = price * (1 + slippage * (Math.random() - 0.5));
    const qty = amountUSD / effectivePrice;
    setBalance(b => b - amountUSD);
    setPortfolio(p => {
      const next = { ...p };
      if (!next[coinId]) next[coinId] = { qty: 0, avgPrice: 0, meta: state.meta };
      const entry = next[coinId];
      const newQty = entry.qty + qty;
      entry.avgPrice = (entry.avgPrice * entry.qty + effectivePrice * qty) / newQty;
      entry.qty = newQty;
      entry.meta = state.meta;
      return next;
    });
    return { success: true, qty, price: effectivePrice };
  }

  function sell(coinId, qtyToSell) {
    const state = currentCoinState(now, parseInt(coinId.split('-')[1], 10));
    const holding = portfolio[coinId];
    if (!holding || holding.qty < qtyToSell) return { success: false, message: 'insufficient coins' };
    const slippage = Math.min(0.25, 0.005 + 0.6 / Math.sqrt(state.meta.supply));
    const effectivePrice = state.price * (1 - slippage * (Math.random() - 0.5));
    const proceeds = effectivePrice * qtyToSell;
    setBalance(b => b + proceeds);
    setPortfolio(p => {
      const next = { ...p };
      next[coinId] = { ...next[coinId] };
      next[coinId].qty = next[coinId].qty - qtyToSell;
      if (next[coinId].qty <= 0.0000001) delete next[coinId];
      return next;
    });
    return { success: true, proceeds, price: effectivePrice };
  }

  const portfolioValue = useMemo(() => {
    let total = 0;
    for (const id in portfolio) {
      try {
        const state = currentCoinState(now, parseInt(id.split('-')[1], 10));
        total += state.price * portfolio[id].qty;
      } catch (e) {}
    }
    return total;
  }, [portfolio, now]);

  // Main JSX omitted for brevity here; it includes navigation, market listing, portfolio, trade modal, and coming soon tabs

  return <div className="min-h-screen text-white font-sans">{/* full JSX here */}</div>;
}

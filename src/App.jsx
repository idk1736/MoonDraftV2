import React, { useState, useEffect, useMemo } from 'react';
import Header from './Components/Header';
import CoinCard from './Components/CoinCard';
import Portfolio from './Components/Portfolio';
import TradeModal from './Components/TradeModal';
import ComingSoon from './Components/ComingSoon';
import { currentCoinState } from './engine/coinEngine';

export default function App() {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [route, setRoute] = useState('/market');
  const [search, setSearch] = useState('');
  const [selectedCoin, setSelectedCoin] = useState(null);

  const [balance, setBalance] = useState(() => {
    const stored = localStorage.getItem('md_balance_v1');
    return stored ? Number(stored) : 10000;
  });

  const [portfolio, setPortfolio] = useState(() => {
    try {
      const stored = localStorage.getItem('md_portfolio_v1');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => localStorage.setItem('md_balance_v1', String(balance)), [balance]);
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

  const filteredCoins = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coins.filter(c => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  }, [coins, search]);

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

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-[#071032] to-[#031428] text-white font-sans">
      <Header route={route} setRoute={setRoute} balance={balance} />

      <div className="mt-6 space-y-6">
        {route === '/market' && (
          <div className="space-y-3">
            {filteredCoins.map(c => (
              <CoinCard key={c.id} coin={c} onTrade={coin => setSelectedCoin(coin)} />
            ))}
          </div>
        )}

        {route === '/portfolio' && (
          <Portfolio
            portfolio={portfolio}
            now={now}
            currentCoinState={currentCoinState}
            sell={sell}
            setSelectedCoin={setSelectedCoin}
          />
        )}

        {(route === '/create' || route === '/labs' || route === '/settings') && (
          <ComingSoon
            title={route.slice(1).charAt(0).toUpperCase() + route.slice(2)}
            description="This feature is coming soon!"
          />
        )}

        {selectedCoin && (
          <TradeModal
            coin={selectedCoin}
            now={now}
            currentCoinState={currentCoinState}
            portfolio={portfolio}
            buy={buy}
            sell={sell}
            onClose={() => setSelectedCoin(null)}
          />
        )}
      </div>
    </div>
  );
}

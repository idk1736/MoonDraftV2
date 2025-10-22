// Optional Vercel serverless API for canonical market data
import { currentCoinState } from '../../src/engine/coinEngine.js';

export default function handler(req, res) {
  const now = Math.floor(Date.now() / 1000);
  const tsParam = req.query.ts ? parseInt(req.query.ts, 10) : now;
  const visibleSeconds = 60; // last 1 minute
  const oldestTs = tsParam - visibleSeconds;

  const coins = [];
  for (let t = tsParam; t >= oldestTs; t--) {
    const state = currentCoinState(tsParam, t);
    coins.push({ ...state.meta, price: state.price, age: state.age });
  }

  res.status(200).json({ ts: tsParam, coins });
}

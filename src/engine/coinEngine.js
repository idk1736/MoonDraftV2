// Global deterministic memecoin engine
const EMOJIS = ["🚀","🌕","🪙","💎","🔥","🍌","👽","🐸","🐶","🐱","🦄","🍕"];
const BASE_SYMBOLS = ["MOON","LUNA","MARS","BTC","ETH","DOGE","SHIB","BANANA","FROG","UNIC","PIZZA"];
const BASE_NAMES = ["MoonCoin","LunaToken","MarsCash","BitRocket","EtherMoon","DogeMoon","ShibaStars","BananaCoin","FrogCoin","UniCornToken","PizzaMoon"];

function deterministicRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function createCoinMeta(ts) {
  const idx = ts % BASE_SYMBOLS.length;
  const emoji = EMOJIS[idx % EMOJIS.length];
  const symbol = BASE_SYMBOLS[idx];
  const name = BASE_NAMES[idx];
  const supply = Math.floor(1e3 + deterministicRandom(ts) * 1e7);
  const isRug = deterministicRandom(ts + 1) > 0.95;
  const isDump = !isRug && deterministicRandom(ts + 2) > 0.9;
  return { emoji, symbol, name, supply, isRug, isDump, id: `coin-${ts}` };
}

export function currentCoinState(now, ts) {
  const meta = createCoinMeta(ts);
  const age = now - ts;
  // price formula: base + oscillation + rug/dump effects
  let base = 0.0001 + meta.supply / 1e7;
  let volatility = 0.05 + (meta.isRug ? 0.3 : 0) + (meta.isDump ? 0.2 : 0);
  const price = base * (1 + Math.sin(ts / 7) * volatility) * (1 + deterministicRandom(ts) * volatility);
  return { meta, price: Math.max(price, 0.000001), age };
}

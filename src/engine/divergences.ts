import type { Candle, Divergence, MACDResult, RSIResult, StochasticResult, SignalStrength } from '../types';

interface Pivot {
  index: number;
  price: number;
  value: number;
}

function findPivots(values: number[], lookback: number): Pivot[] {
  const pivots: Pivot[] = [];
  for (let i = lookback; i < values.length - lookback; i++) {
    const left = values.slice(i - lookback, i);
    const right = values.slice(i + 1, i + lookback + 1);

    const isHigh = left.every((v) => v < values[i]) && right.every((v) => v < values[i]);
    const isLow = left.every((v) => v > values[i]) && right.every((v) => v > values[i]);

    if (isHigh) pivots.push({ index: i, price: 0, value: values[i] });
    if (isLow) pivots.push({ index: i, price: 0, value: values[i] });
  }
  return pivots;
}

function findDivergences(
  pricePivots: Pivot[],
  indicatorPivots: Pivot[],
  indicatorName: string
): Divergence[] {
  const divergences: Divergence[] = [];

  for (let i = 0; i < pricePivots.length; i++) {
    for (let j = i + 1; j < pricePivots.length; j++) {
      const p1 = pricePivots[i];
      const p2 = pricePivots[j];

      if (p1.price === 0 || p2.price === 0) continue;

      const correspondingInd = indicatorPivots.find(
        (ip) => ip.index === p1.index || ip.index === p2.index
      );
      if (!correspondingInd) continue;

      const otherInd = indicatorPivots.find(
        (ip) => ip.index !== correspondingInd.index && Math.abs(ip.index - correspondingInd.index) > 1
      );
      if (!otherInd) continue;

      const priceHigher = p2.price > p1.price;
      const indicatorHigher = otherInd.value > correspondingInd.value;

      if (priceHigher && !indicatorHigher) {
        const strength: SignalStrength = Math.abs(p2.price - p1.price) > 0.005 ? 3 : 2;
        divergences.push({
          type: 'regular_bearish',
          indicator: indicatorName as any,
          strength,
          priceStart: p1.price,
          priceEnd: p2.price,
          indicatorStart: correspondingInd.value,
          indicatorEnd: otherInd.value,
        });
      }

      if (!priceHigher && indicatorHigher) {
        const strength: SignalStrength = Math.abs(p2.price - p1.price) > 0.005 ? 3 : 2;
        divergences.push({
          type: 'regular_bullish',
          indicator: indicatorName as any,
          strength,
          priceStart: p1.price,
          priceEnd: p2.price,
          indicatorStart: correspondingInd.value,
          indicatorEnd: otherInd.value,
        });
      }
    }
  }

  return divergences;
}

export function detectDivergences(
  candles: Candle[],
  macdHistory: MACDResult[],
  rsiHistory: RSIResult[],
  stochHistory: StochasticResult[],
  lookback = 5
): Divergence[] {
  const closes = candles.map((c) => c.close);

  const pricePivots = findPivots(closes, lookback);
  pricePivots.forEach((p, i) => {
    p.price = closes[p.index];
  });

  const rsiValues = rsiHistory.map((r) => r.value);
  const macdValues = macdHistory.map((m) => m.macdLine);
  const stochKValues = stochHistory.map((s) => s.k);

  const rsiPivots = findPivots(rsiValues, lookback);
  const macdPivots = findPivots(macdValues, lookback);
  const stochPivots = findPivots(stochKValues, lookback);

  const all: Divergence[] = [
    ...findDivergences(pricePivots, rsiPivots, 'RSI'),
    ...findDivergences(pricePivots, macdPivots, 'MACD'),
    ...findDivergences(pricePivots, stochPivots, 'Stochastic'),
  ];

  const seen = new Set<string>();
  return all.filter((d) => {
    const key = `${d.type}_${d.indicator}_${d.strength}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

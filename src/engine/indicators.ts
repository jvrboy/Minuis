import type { Candle, MACDResult, RSIResult, ERMAResult, StochasticResult, MarketProfileResult } from '../types';

function ema(values: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(0);
      continue;
    }
    if (i === period - 1) {
      result.push(prev);
      continue;
    }
    prev = (values[i] - prev) * multiplier + prev;
    result.push(prev);
  }
  return result;
}

function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(0);
      continue;
    }
    const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

function highest(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(0);
      continue;
    }
    result.push(Math.max(...values.slice(i - period + 1, i + 1)));
  }
  return result;
}

function lowest(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(0);
      continue;
    }
    result.push(Math.min(...values.slice(i - period + 1, i + 1)));
  }
  return result;
}

function linearRegression(values: number[]): (x: number) => number {
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    const dy = values[i] - yMean;
    num += dx * dy;
    den += dx * dx;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  return (x: number) => slope * x + intercept;
}

export function computeMACD(
  closes: number[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
): MACDResult[] {
  const fastEma = ema(closes, fastPeriod);
  const slowEma = ema(closes, slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (fastEma[i] === 0 || slowEma[i] === 0) {
      macdLine.push(0);
    } else {
      macdLine.push(fastEma[i] - slowEma[i]);
    }
  }

  const signalLine = ema(macdLine, signalPeriod);

  return macdLine.map((m, i) => ({
    macdLine: m,
    signalLine: signalLine[i] || 0,
    histogram: m - (signalLine[i] || 0),
  }));
}

export function computeRSI(closes: number[], period: number): RSIResult[] {
  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  const gains: number[] = changes.map((c) => (c > 0 ? c : 0));
  const losses: number[] = changes.map((c) => (c < 0 ? -c : 0));

  const result: RSIResult[] = [];
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  result.push({ value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss) });

  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ value: 100 - 100 / (1 + rs) });
  }

  while (result.length < closes.length) {
    result.unshift({ value: 50 });
  }

  return result;
}

export function computeERMA(closes: number[], period: number): ERMAResult[] {
  const result: ERMAResult[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push({ value: closes[i] });
      continue;
    }
    const segment = closes.slice(i - period + 1, i + 1);
    const lr = linearRegression(segment);
    const regVal = lr(period - 1);

    const emaValues = ema([regVal], 3);
    result.push({ value: emaValues[emaValues.length - 1] });
  }

  return result;
}

export function computeStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod: number,
  dPeriod: number,
  smoothing: number
): StochasticResult[] {
  const rawK: number[] = [];
  const highMax = highest(highs, kPeriod);
  const lowMin = lowest(lows, kPeriod);

  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      rawK.push(50);
      continue;
    }
    const h = highMax[i];
    const l = lowMin[i];
    rawK.push(h === l ? 50 : ((closes[i] - l) / (h - l)) * 100);
  }

  const smoothK = sma(rawK, smoothing);
  const smoothD = sma(smoothK, dPeriod);

  return smoothK.map((k, i) => ({
    k: Math.round(k * 100) / 100,
    d: Math.round((smoothD[i] || 0) * 100) / 100,
  }));
}

export function computeMarketProfile(candles: Candle[]): MarketProfileResult {
  if (candles.length < 20) {
    return { poc: 0, vah: 0, val: 0, tpoCount: 0, valueArea: 0 };
  }

  const prices: number[] = [];
  const tickSize = 0.0001;

  for (const c of candles) {
    let p = c.low;
    while (p <= c.high) {
      prices.push(Math.round(p / tickSize) * tickSize);
      p += tickSize;
    }
  }

  const freq = new Map<number, number>();
  for (const p of prices) {
    freq.set(p, (freq.get(p) || 0) + 1);
  }

  let poc = 0;
  let maxFreq = 0;
  freq.forEach((count, price) => {
    if (count > maxFreq) {
      maxFreq = count;
      poc = price;
    }
  });

  const sortedPrices = [...freq.keys()].sort((a, b) => a - b);
  const totalTPO = prices.length;
  const valueAreaTarget = totalTPO * 0.7;
  let cumTPO = maxFreq;
  let lowerIdx = sortedPrices.indexOf(poc) - 1;
  let upperIdx = sortedPrices.indexOf(poc) + 1;

  while (cumTPO < valueAreaTarget) {
    const lowerVal = lowerIdx >= 0 ? freq.get(sortedPrices[lowerIdx]) || 0 : 0;
    const upperVal = upperIdx < sortedPrices.length ? freq.get(sortedPrices[upperIdx]) || 0 : 0;

    if (lowerVal >= upperVal && lowerIdx >= 0) {
      cumTPO += lowerVal;
      lowerIdx--;
    } else if (upperIdx < sortedPrices.length) {
      cumTPO += upperVal;
      upperIdx++;
    } else {
      break;
    }
  }

  const vah = upperIdx < sortedPrices.length ? sortedPrices[upperIdx] : sortedPrices[sortedPrices.length - 1];
  const val = lowerIdx >= 0 ? sortedPrices[lowerIdx] : sortedPrices[0];

  return {
    poc: Math.round(poc / tickSize) * tickSize,
    vah: Math.round(vah / tickSize) * tickSize,
    val: Math.round(val / tickSize) * tickSize,
    tpoCount: sortedPrices.length,
    valueArea: Math.round(((vah - val) / tickSize) * tickSize * 10000) / 10000,
  };
}

export function computeAllIndicators(
  candles: Candle[],
  macdFast: number,
  macdSlow: number,
  macdSignal: number,
  rsiPeriod: number,
  ermaPeriod: number,
  stochK: number,
  stochD: number,
  stochSmooth: number
) {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const macd = computeMACD(closes, macdFast, macdSlow, macdSignal);
  const rsi = computeRSI(closes, rsiPeriod);
  const erma = computeERMA(closes, ermaPeriod);
  const stochastic = computeStochastic(highs, lows, closes, stochK, stochD, stochSmooth);
  const marketProfile = computeMarketProfile(candles);

  return {
    macd: macd[macd.length - 1],
    macdHistory: macd,
    rsi: rsi[rsi.length - 1],
    rsiHistory: rsi,
    erma: erma[erma.length - 1],
    ermaHistory: erma,
    stochastic: stochastic[stochastic.length - 1],
    stochasticHistory: stochastic,
    marketProfile,
    lastCandle: candles[candles.length - 1],
  };
}

import type { Candle, BollingerResult, IchimokuResult, VolumeProfileResult } from '../types';

function sma(values: number[], period: number): number[] {
  const r: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { r.push(0); continue; }
    r.push(values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
  }
  return r;
}

function stdDev(values: number[], period: number, mean: number[]): number[] {
  const r: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { r.push(0); continue; }
    const slice = values.slice(i - period + 1, i + 1);
    const m = mean[i];
    const sq = slice.reduce((a, b) => a + (b - m) ** 2, 0) / period;
    r.push(Math.sqrt(sq));
  }
  return r;
}

function ema(values: number[], period: number): number[] {
  const r: number[] = [];
  const m = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { r.push(0); continue; }
    if (i === period - 1) { r.push(prev); continue; }
    prev = (values[i] - prev) * m + prev;
    r.push(prev);
  }
  return r;
}

export function computeBollinger(closes: number[], period: number, std: number): BollingerResult[] {
  const mid = sma(closes, period);
  const sd = stdDev(closes, period, mid);
  return closes.map((_, i) => ({
    middle: mid[i],
    upper: mid[i] + sd[i] * std,
    lower: mid[i] - sd[i] * std,
    bandwidth: mid[i] !== 0 ? ((mid[i] + sd[i] * std) - (mid[i] - sd[i] * std)) / mid[i] : 0,
  }));
}

export function computeIchimoku(candles: Candle[]): IchimokuResult[] {
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const closes = candles.map((c) => c.close);

  function highest(v: number[], period: number, i: number): number {
    if (i < period - 1) return 0;
    return Math.max(...v.slice(i - period + 1, i + 1));
  }
  function lowest(v: number[], period: number, i: number): number {
    if (i < period - 1) return 0;
    return Math.min(...v.slice(i - period + 1, i + 1));
  }

  const result: IchimokuResult[] = [];

  for (let i = 0; i < candles.length; i++) {
    const tenkan = i < 8 ? 0 : (highest(highs, 9, i) + lowest(lows, 9, i)) / 2;
    const kijun = i < 25 ? 0 : (highest(highs, 26, i) + lowest(lows, 26, i)) / 2;
    const senkouA = tenkan && kijun ? (tenkan + kijun) / 2 : 0;
    const senkouB = i < 51 ? 0 : (highest(highs, 52, i) + lowest(lows, 52, i)) / 2;
    const chikou = i < 25 ? 0 : closes[i - 25] || 0;
    const cloudGreen = senkouA > senkouB;

    result.push({
      tenkan: Math.round(tenkan * 100000) / 100000,
      kijun: Math.round(kijun * 100000) / 100000,
      senkouA: Math.round(senkouA * 100000) / 100000,
      senkouB: Math.round(senkouB * 100000) / 100000,
      chikou: Math.round(chikou * 100000) / 100000,
      cloudGreen,
    });
  }
  return result;
}

export function computeVolumeProfile(candles: Candle[], numBins = 24): VolumeProfileResult {
  if (candles.length < 10) {
    return { poc: 0, vah: 0, val: 0, tpoCount: 0, valueArea: 0, volumeNodes: [] };
  }

  const high = Math.max(...candles.map((c) => c.high));
  const low = Math.min(...candles.map((c) => c.low));
  const binSize = (high - low) / numBins;

  const bins: { price: number; volume: number }[] = [];
  for (let i = 0; i < numBins; i++) {
    bins.push({ price: low + binSize * (i + 0.5), volume: 0 });
  }

  for (const c of candles) {
    for (let b = 0; b < numBins; b++) {
      const binLow = low + binSize * b;
      const binHigh = binLow + binSize;
      const overlap = Math.max(0, Math.min(c.high, binHigh) - Math.max(c.low, binLow));
      if (overlap > 0) {
        bins[b].volume += (overlap / (c.high - c.low || 1)) * (c.volume || 1);
      }
    }
  }

  let poc = bins[0].price;
  let maxV = 0;
  for (const b of bins) {
    if (b.volume > maxV) { maxV = b.volume; poc = b.price; }
  }

  const totalV = bins.reduce((a, b) => a + b.volume, 0);
  const target = totalV * 0.7;
  let cum = 0;
  const sorted = [...bins].sort((a, b) => b.volume - a.volume);
  let vah = high;
  let val = low;
  for (const b of sorted) {
    cum += b.volume;
    if (b.price > poc && b.price > val) vah = Math.max(vah, b.price);
    if (b.price < poc && b.price < vah) val = Math.min(val, b.price);
    if (cum >= target) break;
  }

  return {
    poc: Math.round(poc * 100000) / 100000,
    vah: Math.round(vah * 100000) / 100000,
    val: Math.round(val * 100000) / 100000,
    tpoCount: bins.length,
    valueArea: Math.round((vah - val) * 100000) / 100000,
    volumeNodes: bins.map((b) => ({
      price: Math.round(b.price * 100000) / 100000,
      volume: Math.round(b.volume),
    })),
  };
}

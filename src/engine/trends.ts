import type { Candle, Trend, SignalStrength, ERMAResult } from '../types';

export function analyzeTrend(
  candles: Candle[],
  ermaHistory: ERMAResult[],
  lookback = 20
): Trend {
  if (candles.length < lookback) {
    return { direction: 'SIDEWAYS', strength: 1, duration: 0 };
  }

  const recent = candles.slice(-lookback);
  const closes = recent.map((c) => c.close);

  const higherHighs = recent[recent.length - 1].high > recent[0].high;
  const higherLows = recent[recent.length - 1].low > recent[0].low;
  const lowerHighs = recent[recent.length - 1].high < recent[0].high;
  const lowerLows = recent[recent.length - 1].low < recent[0].low;

  const emaValues = ermaHistory.slice(-lookback).filter((e) => e && e.value !== undefined).map((e) => e.value);
  if (emaValues.length < 2) {
    return { direction: 'SIDEWAYS', strength: 1, duration: 0 };
  }

  const emaSlope = (emaValues[emaValues.length - 1] - emaValues[0]) / emaValues.length;
  const pricePosition = closes[closes.length - 1];
  const emaCurrent = emaValues[emaValues.length - 1];
  const aboveEma = pricePosition > emaCurrent;

  if (higherHighs && higherLows && emaSlope > 0) {
    const adx = estimateTrendStrength(closes);
    const strength = adx > 25 ? 3 : adx > 20 ? 2 : 1;
    return { direction: 'UP', strength: strength as SignalStrength, duration: lookback };
  }

  if (lowerHighs && lowerLows && emaSlope < 0) {
    const adx = estimateTrendStrength(closes);
    const strength = adx > 25 ? 3 : adx > 20 ? 2 : 1;
    return { direction: 'DOWN', strength: strength as SignalStrength, duration: lookback };
  }

  return { direction: 'SIDEWAYS', strength: 1, duration: lookback };
}

function estimateTrendStrength(closes: number[]): number {
  const period = Math.min(14, closes.length - 1);
  if (period < 2) return 0;

  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    highs.push(Math.max(closes[i], closes[i - 1]));
    lows.push(Math.min(closes[i], closes[i - 1]));
  }

  const tr = highs.map((h, i) => h - lows[i]);
  const atr = tr.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (atr === 0) return 0;

  const directionalMovement = Math.abs(closes[closes.length - 1] - closes[closes.length - period]);
  return Math.min(100, (directionalMovement / atr) * 100);
}

export function isTrendContinuation(trend: Trend, _candles: Candle[]): boolean {
  return trend.direction !== 'SIDEWAYS' && trend.strength >= 2;
}

export function isTrendReversal(trend: Trend, previousTrend: Trend): boolean {
  return previousTrend.direction !== 'SIDEWAYS' && trend.direction !== previousTrend.direction;
}

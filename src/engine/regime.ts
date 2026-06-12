import type { Candle, Regime, RegimeType, SignalStrength } from '../types';

export function detectRegime(candles: Candle[], lookback = 50): Regime {
  if (candles.length < lookback) {
    return { type: 'QUIET', atr: 0, volatilityPercentile: 0, adx: 0 };
  }

  const recent = candles.slice(-lookback);
  const closes = recent.map((c) => c.close);

  const highs = recent.map((c) => c.high);
  const lows = recent.map((c) => c.low);

  const tr: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ));
  }
  const atr = tr.reduce((a, b) => a + b, 0) / tr.length;

  const returns = closes.slice(1).map((c, i) => Math.abs((c - closes[i]) / closes[i]));
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

  const upMoves: number[] = [];
  const downMoves: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const move = closes[i] - closes[i - 1];
    if (move > 0) upMoves.push(move);
    else downMoves.push(Math.abs(move));
  }
  const avgUp = upMoves.length > 0 ? upMoves.reduce((a, b) => a + b, 0) / upMoves.length : 0;
  const avgDn = downMoves.length > 0 ? downMoves.reduce((a, b) => a + b, 0) / downMoves.length : 0;
  const directional = avgUp + avgDn > 0 ? Math.abs(avgUp - avgDn) / (avgUp + avgDn) * 100 : 0;
  const adx = Math.min(100, directional);

  const historicalReturns: number[] = [];
  for (let i = lookback; i < candles.length; i++) {
    const slice = candles.slice(i - lookback, i);
    const r = slice.slice(1).map((c, idx) => Math.abs((c.close - slice[idx].close) / slice[idx].close));
    historicalReturns.push(r.reduce((a, b) => a + b, 0) / r.length);
  }
  const sorted = [...historicalReturns, avgReturn].sort((a, b) => a - b);
  const rank = sorted.indexOf(avgReturn);
  const percentile = sorted.length > 0 ? rank / sorted.length : 0.5;

  let type: RegimeType;
  if (adx > 25 && percentile > 0.7) type = 'TRENDING';
  else if (percentile > 0.8) type = 'VOLATILE';
  else if (adx < 15 && percentile < 0.3) type = 'QUIET';
  else type = 'RANGING';

  const strength: SignalStrength =
    percentile > 0.8 ? 3 : percentile > 0.6 ? 2 : 1;

  return { type, atr, volatilityPercentile: Math.round(percentile * 100), adx: Math.round(adx) };
}

export function regimeAllowsSignal(regime: Regime, settings: { regimeFilter: boolean }): boolean {
  if (!settings.regimeFilter) return true;
  return regime.type === 'TRENDING' || regime.type === 'RANGING';
}

export function regimeScore(regime: Regime): number {
  if (regime.type === 'TRENDING') return 20;
  if (regime.type === 'RANGING') return 10;
  if (regime.type === 'VOLATILE') return -10;
  return -5;
}

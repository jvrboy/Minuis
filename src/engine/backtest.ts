import type { Candle, Timeframe, BacktestResult, BacktestTrade, OptimizerParams, OptimizerResult } from '../types';
import { computeAllIndicators } from './indicators';
import { computeBollinger, computeIchimoku } from './advancedIndicators';
import { detectDivergences } from './divergences';
import { analyzeTrend } from './trends';

function simulateTrade(
  direction: 'BUY' | 'SELL',
  entry: number,
  stopLoss: number,
  takeProfit: number,
  candles: Candle[],
  entryIndex: number
): { exitIndex: number; exitPrice: number; profit: number; profitPips: number } {
  for (let i = entryIndex + 1; i < candles.length; i++) {
    const c = candles[i];
    if (direction === 'BUY') {
      if (c.low <= stopLoss) return { exitIndex: i, exitPrice: stopLoss, profit: stopLoss - entry, profitPips: Math.abs((stopLoss - entry) * 10000) };
      if (c.high >= takeProfit) return { exitIndex: i, exitPrice: takeProfit, profit: takeProfit - entry, profitPips: Math.abs((takeProfit - entry) * 10000) };
    } else {
      if (c.high >= stopLoss) return { exitIndex: i, exitPrice: stopLoss, profit: entry - stopLoss, profitPips: Math.abs((entry - stopLoss) * 10000) };
      if (c.low <= takeProfit) return { exitIndex: i, exitPrice: takeProfit, profit: entry - takeProfit, profitPips: Math.abs((entry - takeProfit) * 10000) };
    }
  }
  const last = candles[candles.length - 1];
  const profit = direction === 'BUY' ? last.close - entry : entry - last.close;
  return { exitIndex: candles.length - 1, exitPrice: last.close, profit, profitPips: Math.abs(profit * 10000) };
}

function evaluateOne(candles: Candle[], i: number, settings: OptimizerParams): BacktestTrade | null {
  const lookback = Math.max(settings.macdSlow, settings.rsiPeriod, settings.stochK, 50);
  if (i < lookback) return null;

  const slice = candles.slice(0, i + 1);
  const {
    macd, rsi, erma, stochastic, macdHistory, rsiHistory, stochasticHistory, marketProfile, lastCandle,
  } = computeAllIndicators(slice, settings.macdFast, settings.macdSlow, settings.macdSignal, settings.rsiPeriod, settings.ermaPeriod || 14, settings.stochK, settings.stochD, 3);

  const divergences = detectDivergences(slice, macdHistory, rsiHistory, stochasticHistory);
  const trend = analyzeTrend(slice, ermaHistory);

  let direction: 'BUY' | 'SELL' | null = null;
  let score = 0;

  if (macd.histogram > 0 && rsi.value > 50 && stochastic.k > stochastic.d) { direction = 'BUY'; score += 25; }
  if (macd.histogram < 0 && rsi.value < 50 && stochastic.k < stochastic.d) { direction = 'SELL'; score += 25; }
  if (rsi.value <= settings.rsiOversold && stochastic.k <= 20) { direction = 'BUY'; score += 20; }
  if (rsi.value >= settings.rsiOverbought && stochastic.k >= 80) { direction = 'SELL'; score += 20; }
  if (divergences.some((d) => d.type.includes('bullish'))) { direction = 'BUY'; score += 15; }
  if (divergences.some((d) => d.type.includes('bearish'))) { direction = 'SELL'; score += 15; }

  if (!direction || score < settings.minConfidence) return null;

  const entry = lastCandle.close;
  const vol = lastCandle.high - lastCandle.low;
  const sl = direction === 'BUY' ? entry - vol * 1.5 : entry + vol * 1.5;
  const tp = direction === 'BUY' ? entry + vol * 2.5 : entry - vol * 2.5;

  const { exitIndex, exitPrice, profit, profitPips } = simulateTrade(direction, entry, sl, tp, candles, i);

  return {
    entryTime: lastCandle.time,
    exitTime: candles[exitIndex]?.time || lastCandle.time,
    direction,
    entry: Math.round(entry * 100000) / 100000,
    exit: Math.round(exitPrice * 100000) / 100000,
    profit: Math.round(profit * 100000) / 100000,
    profitPips: Math.round(profitPips),
    confidence: score,
    reasons: [`Score: ${score}`],
  };
}

export function runBacktest(candles: Candle[], timeframe: Timeframe, params: OptimizerParams): BacktestResult {
  const trades: BacktestTrade[] = [];
  let equity = 10000;
  const equityCurve: { time: number; equity: number }[] = [{ time: candles[0]?.time || 0, equity }];

  let prevSignalIdx = -100;

  for (let i = 50; i < candles.length; i++) {
    if (i - prevSignalIdx < 5) continue;
    const trade = evaluateOne(candles, i, params);
    if (trade) {
      trades.push(trade);
      equity += trade.profit;
      equityCurve.push({ time: trade.exitTime || trade.entryTime, equity: Math.round(equity * 100) / 100 });
      prevSignalIdx = i;
    }
  }

  const wins = trades.filter((t) => t.profit > 0);
  const losses = trades.filter((t) => t.profit <= 0);
  const winRate = trades.length > 0 ? wins.length / trades.length : 0;
  const grossWin = wins.reduce((a, t) => a + t.profit, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.profit, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;

  const maxDrawdown = computeMaxDrawdown(equityCurve.map((e) => e.equity));
  const returns = equityCurve.slice(1).map((e, i) => (e.equity - equityCurve[i].equity) / equityCurve[i].equity);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const stdReturn = Math.sqrt(returns.length > 0 ? returns.reduce((a, b) => a + (b - avgReturn) ** 2, 0) / returns.length : 0);
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(365) : 0;

  return {
    symbol: candles[0]?.symbol || '',
    timeframe,
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: Math.round(winRate * 10000) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    totalProfit: Math.round((equity - 10000) * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    avgWin: wins.length > 0 ? Math.round((wins.reduce((a, t) => a + t.profit, 0) / wins.length) * 100000) / 100000 : 0,
    avgLoss: losses.length > 0 ? Math.round((losses.reduce((a, t) => a + t.profit, 0) / losses.length) * 100000) / 100000 : 0,
    largestWin: wins.length > 0 ? Math.round(Math.max(...wins.map((t) => t.profit)) * 100000) / 100000 : 0,
    largestLoss: losses.length > 0 ? Math.round(Math.min(...losses.map((t) => t.profit)) * 100000) / 100000 : 0,
    avgConfidence: trades.length > 0 ? Math.round(trades.reduce((a, t) => a + t.confidence, 0) / trades.length) : 0,
    trades,
    equityCurve,
    params,
  };
}

function computeMaxDrawdown(equity: number[]): number {
  let peak = equity[0] || 0;
  let maxDd = 0;
  for (const e of equity) {
    if (e > peak) peak = e;
    const dd = peak > 0 ? (peak - e) / peak : 0;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd * 100;
}

export function runOptimizer(candles: Candle[], timeframe: Timeframe): OptimizerResult[] {
  const results: OptimizerResult[] = [];

  const macdFastOpts = [8, 12, 16];
  const macdSlowOpts = [21, 26, 30];
  const rsiPeriodOpts = [10, 14, 20];
  const stochKOpts = [10, 14, 20];

  for (const mf of macdFastOpts) {
    for (const ms of macdSlowOpts) {
      for (const rp of rsiPeriodOpts) {
        for (const sk of stochKOpts) {
          const params: OptimizerParams = {
            macdFast: mf, macdSlow: ms, macdSignal: 9,
            rsiPeriod: rp, rsiOverbought: 70, rsiOversold: 30,
            stochK: sk, stochD: 3, minConfidence: 50,
          };
          const result = runBacktest(candles, timeframe, params);
          results.push({ params, result });
        }
      }
    }
  }

  return results.sort((a, b) => b.result.sharpeRatio - a.result.sharpeRatio);
}

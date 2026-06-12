import type { Trade, Signal, PortfolioState, SignalDirection } from '../types';
import { useStore } from '../store/useStore';

let tradeCounter = 0;

export function openTrade(signal: Signal, balance: number, riskPerTrade: number): Trade {
  const riskAmount = balance * (riskPerTrade / 100);
  const priceRisk = Math.abs(signal.entry - signal.stopLoss);
  const size = priceRisk > 0 ? Math.round((riskAmount / priceRisk) * 1000) / 1000 : 0.001;

  const trade: Trade = {
    id: `trade_${++tradeCounter}_${Date.now()}`,
    signalId: signal.id,
    symbol: signal.symbol,
    direction: signal.direction,
    entry: signal.entry,
    stopLoss: signal.stopLoss,
    takeProfit: signal.takeProfit,
    size,
    entryTime: Date.now(),
    status: 'OPEN',
  };

  return trade;
}

export function closeTrade(trade: Trade, exitPrice: number): Trade {
  const isBuy = trade.direction === 'BUY';
  const profit = isBuy
    ? (exitPrice - trade.entry) * trade.size
    : (trade.entry - exitPrice) * trade.size;
  const profitPips = Math.abs((exitPrice - trade.entry) * 10000);

  return {
    ...trade,
    exitPrice: Math.round(exitPrice * 100000) / 100000,
    exitTime: Date.now(),
    profit: Math.round(profit * 100) / 100,
    profitPips: Math.round(profitPips),
    status: profit > 0 ? 'CLOSED_WIN' : 'CLOSED_LOSS',
  };
}

export function updatePortfolio(trades: Trade[]): PortfolioState {
  const open = trades.filter((t) => t.status === 'OPEN');
  const closed = trades.filter((t) => t.status !== 'OPEN');
  const wins = closed.filter((t) => t.status === 'CLOSED_WIN');
  const losses = closed.filter((t) => t.status === 'CLOSED_LOSS');

  const totalPnL = closed.reduce((a, t) => a + (t.profit || 0), 0);

  const now = Date.now();
  const dayMs = 86400000;
  const weekMs = 604800000;
  const dailyPnL = closed.filter((t) => (t.exitTime || 0) > now - dayMs).reduce((a, t) => a + (t.profit || 0), 0);
  const weeklyPnL = closed.filter((t) => (t.exitTime || 0) > now - weekMs).reduce((a, t) => a + (t.profit || 0), 0);

  const openUnrealized = 0;
  const balance = 10000 + totalPnL;
  const equity = balance + openUnrealized;

  return {
    balance: Math.round(balance * 100) / 100,
    equity: Math.round(equity * 100) / 100,
    margin: Math.round(open.length * 100),
    freeMargin: Math.round((equity - open.length * 100) * 100) / 100,
    openTrades: open,
    closedTrades: closed,
    dailyPnL: Math.round(dailyPnL * 100) / 100,
    weeklyPnL: Math.round(weeklyPnL * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
    winRate: closed.length > 0 ? Math.round((wins.length / closed.length) * 10000) / 100 : 0,
    totalTrades: closed.length,
  };
}

export function checkStopLossTakeProfit(trade: Trade, currentPrice: number): 'HOLD' | 'HIT_SL' | 'HIT_TP' {
  const isBuy = trade.direction === 'BUY';
  if (isBuy) {
    if (currentPrice <= trade.stopLoss) return 'HIT_SL';
    if (currentPrice >= trade.takeProfit) return 'HIT_TP';
  } else {
    if (currentPrice >= trade.stopLoss) return 'HIT_SL';
    if (currentPrice <= trade.takeProfit) return 'HIT_TP';
  }
  return 'HOLD';
}

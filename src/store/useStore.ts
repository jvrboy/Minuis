import { create } from 'zustand';
import type { Signal, SignalHistoryEntry, AppSettings, ConnectionStatus, Candle, Tick, Trade, PortfolioState, BacktestResult, OptimizerResult, EconomicEvent } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { updatePortfolio } from '../engine/portfolio';

interface AppState {
  settings: AppSettings;
  connection: ConnectionStatus;
  candles: Record<string, Candle[]>;
  candlesMulti: Record<string, Record<string, Candle[]>>;
  activeSignals: Signal[];
  signalHistory: SignalHistoryEntry[];
  lastTick: Tick | null;
  trades: Trade[];
  portfolio: PortfolioState;
  backtestResult: BacktestResult | null;
  optimizerResults: OptimizerResult[];
  economicEvents: EconomicEvent[];
  onboardingComplete: boolean;

  setSettings: (s: Partial<AppSettings>) => void;
  setConnection: (c: Partial<ConnectionStatus>) => void;
  setCandles: (symbol: string, candles: Candle[]) => void;
  setCandlesMulti: (symbol: string, tf: string, candles: Candle[]) => void;
  addCandle: (symbol: string, candle: Candle) => void;
  addSignal: (s: Signal) => void;
  closeSignal: (id: string, profit: number) => void;
  archiveSignal: (s: Signal) => void;
  setLastTick: (t: Tick) => void;
  loadHistory: (h: SignalHistoryEntry[]) => void;
  setTrades: (t: Trade[]) => void;
  addTrade: (t: Trade) => void;
  updateTrade: (id: string, t: Partial<Trade>) => void;
  recalcPortfolio: () => void;
  setBacktestResult: (r: BacktestResult | null) => void;
  setOptimizerResults: (r: OptimizerResult[]) => void;
  setEconomicEvents: (e: EconomicEvent[]) => void;
  setOnboardingComplete: (v: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  settings: DEFAULT_SETTINGS,
  connection: { connected: false, symbol: '' },
  candles: {},
  candlesMulti: {},
  activeSignals: [],
  signalHistory: [],
  lastTick: null,
  trades: [],
  portfolio: {
    balance: DEFAULT_SETTINGS.virtualBalance,
    equity: DEFAULT_SETTINGS.virtualBalance,
    margin: 0,
    freeMargin: DEFAULT_SETTINGS.virtualBalance,
    openTrades: [],
    closedTrades: [],
    dailyPnL: 0,
    weeklyPnL: 0,
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
  },
  backtestResult: null,
  optimizerResults: [],
  economicEvents: [],
  onboardingComplete: false,

  setSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
  setConnection: (partial) => set((s) => ({ connection: { ...s.connection, ...partial } })),
  setCandles: (symbol, candles) => set((s) => ({ candles: { ...s.candles, [symbol]: candles } })),
  setCandlesMulti: (symbol, tf, candles) => set((s) => ({
    candlesMulti: { ...s.candlesMulti, [symbol]: { ...(s.candlesMulti[symbol] || {}), [tf]: candles } },
  })),
  addCandle: (symbol, candle) => set((s) => {
    const existing = s.candles[symbol] || [];
    const last = existing[existing.length - 1];
    if (last && last.time === candle.time) {
      const updated = [...existing];
      updated[updated.length - 1] = candle;
      return { candles: { ...s.candles, [symbol]: updated } };
    }
    return { candles: { ...s.candles, [symbol]: [...existing, candle].slice(-200) } };
  }),
  addSignal: (signal) => set((s) => ({
    activeSignals: [signal, ...s.activeSignals].slice(0, 50),
    signalHistory: [{ ...signal, status: signal.status, closedAt: undefined }, ...s.signalHistory].slice(0, 500),
  })),
  closeSignal: (id, profit) => set((s) => ({
    activeSignals: s.activeSignals.filter((sig) => sig.id !== id),
    signalHistory: s.signalHistory.map((sig) =>
      sig.id === id ? { ...sig, status: profit > 0 ? 'HIT_TP' : 'HIT_SL', closedAt: Date.now(), profit, profitPips: Math.abs(profit) } : sig
    ),
  })),
  archiveSignal: (signal) => set((s) => ({ activeSignals: s.activeSignals.filter((sig) => sig.id !== signal.id) })),
  setLastTick: (tick) => set({ lastTick: tick }),
  loadHistory: (history) => set({ signalHistory: history }),
  setTrades: (trades) => set((s) => {
    const portfolio = updatePortfolio(trades);
    return { trades, portfolio };
  }),
  addTrade: (trade) => set((s) => {
    const trades = [...s.trades, trade];
    const portfolio = updatePortfolio(trades);
    return { trades, portfolio };
  }),
  updateTrade: (id, partial) => set((s) => {
    const trades = s.trades.map((t) => (t.id === id ? { ...t, ...partial } : t));
    const portfolio = updatePortfolio(trades);
    return { trades, portfolio };
  }),
  recalcPortfolio: () => set((s) => ({ portfolio: updatePortfolio(s.trades) })),
  setBacktestResult: (r) => set({ backtestResult: r }),
  setOptimizerResults: (r) => set({ optimizerResults: r }),
  setEconomicEvents: (e) => set({ economicEvents: e }),
  setOnboardingComplete: (v) => set({ onboardingComplete: v }),
}));

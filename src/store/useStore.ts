import { create } from 'zustand';
import type { Signal, SignalHistoryEntry, AppSettings, ConnectionStatus, Candle, Tick, Trade, PortfolioState, BacktestResult, OptimizerResult, EconomicEvent, ChatMessage, LLMModel, LearningEntry, AutoBacktestConfig } from '../types';
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
  // Chatbot
  chatMessages: ChatMessage[];
  chatInput: string;
  llmModels: LLMModel[];
  llmLoaded: boolean;
  llmTemperature: number;
  // Learning
  learningEntries: LearningEntry[];
  learningEnabled: boolean;
  // Auto Backtest
  autoBacktestConfig: AutoBacktestConfig;
  autoBacktestRunning: boolean;
  autoBacktestResults: BacktestResult[];

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
  // Chatbot
  addChatMessage: (m: ChatMessage) => void;
  clearChat: () => void;
  setChatInput: (v: string) => void;
  setLlmModels: (m: LLMModel[]) => void;
  setLlmLoaded: (v: boolean) => void;
  setLlmTemperature: (v: number) => void;
  // Learning
  addLearningEntry: (e: LearningEntry) => void;
  setLearningEnabled: (v: boolean) => void;
  learnFromSignal: (signal: SignalHistoryEntry) => void;
  // Auto Backtest
  setAutoBacktestConfig: (c: Partial<AutoBacktestConfig>) => void;
  setAutoBacktestRunning: (v: boolean) => void;
  addAutoBacktestResult: (r: BacktestResult) => void;
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
  // Chatbot
  chatMessages: [],
  chatInput: '',
  llmModels: [],
  llmLoaded: false,
  llmTemperature: 0.7,
  // Learning
  learningEntries: [],
  learningEnabled: true,
  // Auto Backtest
  autoBacktestConfig: {
    enabled: false,
    intervalMs: 3600000,
    symbols: ['frxEURUSD', 'frxGBPUSD', 'frxUSDJPY'],
    timeframes: ['1h', '4h', '1d'],
    maxResults: 20,
  },
  autoBacktestRunning: false,
  autoBacktestResults: [],

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
  // Chatbot
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg].slice(-100) })),
  clearChat: () => set({ chatMessages: [] }),
  setChatInput: (v) => set({ chatInput: v }),
  setLlmModels: (models) => set({ llmModels: models }),
  setLlmLoaded: (v) => set({ llmLoaded: v }),
  setLlmTemperature: (v) => set({ llmTemperature: v }),
  // Learning
  addLearningEntry: (entry) => set((s) => ({ learningEntries: [entry, ...s.learningEntries].slice(0, 1000) })),
  setLearningEnabled: (v) => set({ learningEnabled: v }),
  learnFromSignal: (signal) => set((s) => {
    if (!s.learningEnabled) return s;
    const pattern = `${signal.direction}_${signal.symbol}_${signal.reasons.slice(0, 3).join('_')}`;
    const entry: LearningEntry = {
      signalId: signal.id,
      symbol: signal.symbol,
      direction: signal.direction,
      entry: signal.entry,
      exit: signal.takeProfit || signal.entry,
      profit: signal.profit || 0,
      confidence: signal.confidence,
      reasons: signal.reasons,
      outcome: signal.status as 'HIT_TP' | 'HIT_SL',
      learnedAt: Date.now(),
      pattern,
    };
    return { learningEntries: [entry, ...s.learningEntries].slice(0, 1000) };
  }),
  // Auto Backtest
  setAutoBacktestConfig: (c) => set((s) => ({ autoBacktestConfig: { ...s.autoBacktestConfig, ...c } })),
  setAutoBacktestRunning: (v) => set({ autoBacktestRunning: v }),
  addAutoBacktestResult: (r) => set((s) => ({
    autoBacktestResults: [r, ...s.autoBacktestResults].slice(0, s.autoBacktestConfig.maxResults),
  })),
}));

export type SymbolKey = string;

export type SymbolCategory = 'forex' | 'metal' | 'crypto' | 'synthetic' | 'stock' | 'index';

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export type SignalDirection = 'BUY' | 'SELL';

export type SignalStrength = 1 | 2 | 3;

export type RegimeType = 'TRENDING' | 'RANGING' | 'VOLATILE' | 'QUIET';

export type StrategyPreset = 'AGGRESSIVE' | 'MODERATE' | 'CONSERVATIVE' | 'SCALPER';

export interface Tick {
  symbol: string;
  epoch: number;
  quote: number;
  bid?: number;
  ask?: number;
}

export interface Candle {
  symbol: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MACDResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
}

export interface RSIResult {
  value: number;
}

export interface ERMAResult {
  value: number;
}

export interface StochasticResult {
  k: number;
  d: number;
}

export interface BollingerResult {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
}

export interface IchimokuResult {
  tenkan: number;
  kijun: number;
  senkouA: number;
  senkouB: number;
  chikou: number;
  cloudGreen: boolean;
}

export interface VolumeProfileResult {
  poc: number;
  vah: number;
  val: number;
  tpoCount: number;
  valueArea: number;
  volumeNodes: { price: number; volume: number }[];
}

export interface MarketProfileResult {
  poc: number;
  vah: number;
  val: number;
  tpoCount: number;
  valueArea: number;
}

export interface IndicatorSet {
  macd: MACDResult;
  rsi: RSIResult;
  erma: ERMAResult;
  stochastic: StochasticResult;
  bollinger?: BollingerResult;
  ichimoku?: IchimokuResult;
  volumeProfile?: VolumeProfileResult;
  marketProfile?: MarketProfileResult;
}

export interface Divergence {
  type: 'regular_bullish' | 'regular_bearish' | 'hidden_bullish' | 'hidden_bearish';
  indicator: 'RSI' | 'MACD' | 'Stochastic';
  strength: SignalStrength;
  priceStart: number;
  priceEnd: number;
  indicatorStart: number;
  indicatorEnd: number;
}

export interface Trend {
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  strength: SignalStrength;
  duration: number;
}

export interface Regime {
  type: RegimeType;
  atr: number;
  volatilityPercentile: number;
  adx: number;
}

export interface MultiTimeframeSignal {
  direction: SignalDirection;
  confluence: number;
  timeframes: Timeframe[];
  signals: Record<Timeframe, Signal>;
}

export interface Signal {
  id: string;
  symbol: string;
  direction: SignalDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  strength: SignalStrength;
  timeframe: Timeframe;
  indicators: IndicatorSet;
  divergences: Divergence[];
  trend: Trend;
  regime: Regime;
  reasons: string[];
  timestamp: number;
  status: 'ACTIVE' | 'HIT_TP' | 'HIT_SL' | 'CANCELLED';
}

export interface SignalHistoryEntry extends Signal {
  closedAt?: number;
  profit?: number;
  profitPips?: number;
}

export interface Trade {
  id: string;
  signalId: string;
  symbol: string;
  direction: SignalDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  size: number;
  entryTime: number;
  exitTime?: number;
  exitPrice?: number;
  profit?: number;
  profitPips?: number;
  note?: string;
  status: 'OPEN' | 'CLOSED_WIN' | 'CLOSED_LOSS';
}

export interface PortfolioState {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  openTrades: Trade[];
  closedTrades: Trade[];
  dailyPnL: number;
  weeklyPnL: number;
  totalPnL: number;
  winRate: number;
  totalTrades: number;
}

export interface BacktestResult {
  symbol: string;
  timeframe: Timeframe;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  totalProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  avgConfidence: number;
  trades: BacktestTrade[];
  equityCurve: { time: number; equity: number }[];
  params: OptimizerParams;
}

export interface BacktestTrade {
  entryTime: number;
  exitTime: number;
  direction: SignalDirection;
  entry: number;
  exit: number;
  profit: number;
  profitPips: number;
  confidence: number;
  reasons: string[];
}

export interface OptimizerParams {
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  stochK: number;
  stochD: number;
  minConfidence: number;
}

export interface OptimizerResult {
  params: OptimizerParams;
  result: BacktestResult;
}

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  time: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  forecast?: string;
  previous?: string;
  actual?: string;
  currency: string;
}

export interface NewsFilter {
  enabled: boolean;
  suppressMinutesBefore: number;
  suppressMinutesAfter: number;
  minImpact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface StrategyPresetConfig {
  name: StrategyPreset;
  label: string;
  minConfidence: number;
  signalCooldownMs: number;
  riskPerTrade: number;
  maxOpenTrades: number;
  useMultiTimeframe: boolean;
  timeframes: Timeframe[];
  regimeFilter: boolean;
  divergenceBoost: boolean;
}

export interface AppSettings {
  symbols: string[];
  timeframe: Timeframe;
  multiTimeframeEnabled: boolean;
  multiTimeframes: Timeframe[];
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  ermaPeriod: number;
  stochK: number;
  stochD: number;
  stochSmooth: number;
  bbPeriod: number;
  bbStdDev: number;
  minConfidence: number;
  signalCooldownMs: number;
  theme: 'dark' | 'light';
  preset: StrategyPreset;
  backtestMode: boolean;
  virtualTrading: boolean;
  virtualBalance: number;
  riskPerTrade: number;
  maxOpenTrades: number;
  newsFilter: NewsFilter;
  pushNotifications: boolean;
  cloudSync: boolean;
  appLockPin: string;
  performanceMode: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  symbol: string;
  lastTick?: Tick;
  latencyMs?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface LLMModel {
  id: string;
  name: string;
  path: string;
  size: number;
  loaded: boolean;
}

export interface LearningEntry {
  signalId: string;
  symbol: string;
  direction: SignalDirection;
  entry: number;
  exit: number;
  profit: number;
  confidence: number;
  reasons: string[];
  outcome: 'HIT_TP' | 'HIT_SL';
  learnedAt: number;
  pattern: string;
}

export interface AutoBacktestConfig {
  enabled: boolean;
  intervalMs: number;
  symbols: string[];
  timeframes: Timeframe[];
  maxResults: number;
}

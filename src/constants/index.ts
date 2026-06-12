import type { AppSettings, Timeframe, StrategyPresetConfig, NewsFilter } from '../types';

export const DERIV_WS_URL = 'wss://ws.derivws.com/websockets/v3';

export const DEFAULT_SYMBOLS = [
  'frxEURUSD', 'frxGBPUSD', 'frxUSDJPY', 'frxAUDUSD', 'frxUSDCAD',
  'frxUSDCHF', 'frxNZDUSD', 'frxEURGBP', 'frxEURJPY', 'frxGBPJPY',
];

export const SYMBOL_NAMES: Record<string, string> = {
  frxEURUSD: 'EUR/USD', frxGBPUSD: 'GBP/USD', frxUSDJPY: 'USD/JPY',
  frxAUDUSD: 'AUD/USD', frxUSDCAD: 'USD/CAD', frxUSDCHF: 'USD/CHF',
  frxNZDUSD: 'NZD/USD', frxEURGBP: 'EUR/GBP', frxEURJPY: 'EUR/JPY',
  frxGBPJPY: 'GBP/JPY',
};

export const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '1m': '1 Min', '5m': '5 Min', '15m': '15 Min', '30m': '30 Min',
  '1h': '1 Hour', '4h': '4 Hours', '1d': '1 Day',
};

export const CANDLE_INTERVAL_MAP: Record<Timeframe, number> = {
  '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600, '4h': 14400, '1d': 86400,
};

export const STRATEGY_PRESETS: Record<string, StrategyPresetConfig> = {
  AGGRESSIVE: {
    name: 'AGGRESSIVE', label: 'Aggressive', minConfidence: 50, signalCooldownMs: 60000,
    riskPerTrade: 5, maxOpenTrades: 5, useMultiTimeframe: false,
    timeframes: ['5m', '15m', '1h'], regimeFilter: false, divergenceBoost: true,
  },
  MODERATE: {
    name: 'MODERATE', label: 'Moderate', minConfidence: 65, signalCooldownMs: 180000,
    riskPerTrade: 2.5, maxOpenTrades: 3, useMultiTimeframe: true,
    timeframes: ['15m', '1h', '4h'], regimeFilter: true, divergenceBoost: true,
  },
  CONSERVATIVE: {
    name: 'CONSERVATIVE', label: 'Conservative', minConfidence: 80, signalCooldownMs: 300000,
    riskPerTrade: 1, maxOpenTrades: 2, useMultiTimeframe: true,
    timeframes: ['1h', '4h', '1d'], regimeFilter: true, divergenceBoost: true,
  },
  SCALPER: {
    name: 'SCALPER', label: 'Scalper', minConfidence: 55, signalCooldownMs: 30000,
    riskPerTrade: 3, maxOpenTrades: 8, useMultiTimeframe: false,
    timeframes: ['1m', '5m', '15m'], regimeFilter: false, divergenceBoost: false,
  },
};

export const DEFAULT_NEWS_FILTER: NewsFilter = {
  enabled: true, suppressMinutesBefore: 30, suppressMinutesAfter: 30, minImpact: 'HIGH',
};

export const DEFAULT_SETTINGS: AppSettings = {
  symbols: ['frxEURUSD', 'frxGBPUSD', 'frxUSDJPY'],
  timeframe: '5m',
  multiTimeframeEnabled: true,
  multiTimeframes: ['15m', '1h', '4h'],
  macdFast: 12, macdSlow: 26, macdSignal: 9,
  rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30,
  ermaPeriod: 14,
  stochK: 14, stochD: 3, stochSmooth: 3,
  bbPeriod: 20, bbStdDev: 2,
  minConfidence: 60, signalCooldownMs: 180000,
  theme: 'dark',
  preset: 'MODERATE',
  backtestMode: false,
  virtualTrading: true,
  virtualBalance: 10000,
  riskPerTrade: 2,
  maxOpenTrades: 3,
  newsFilter: DEFAULT_NEWS_FILTER,
  pushNotifications: false,
  cloudSync: false,
  appLockPin: '',
  performanceMode: false,
};

export const COLORS = {
  bgPrimary: '#0D1117', bgSecondary: '#161B22', bgCard: '#1C2128',
  bgActive: '#262C34', textPrimary: '#E6EDF3', textSecondary: '#8B949E',
  textMuted: '#484F58', accentGreen: '#3FB950', accentRed: '#F85149',
  accentBlue: '#58A6FF', accentYellow: '#D29922', accentPurple: '#BC8CFF',
  accentOrange: '#F0883E', accentCyan: '#39D2C0', border: '#30363D',
  greenDim: 'rgba(63,185,80,0.15)', redDim: 'rgba(248,81,73,0.15)',
  blueDim: 'rgba(88,166,255,0.15)', yellowDim: 'rgba(210,153,34,0.15)',
  purpleDim: 'rgba(188,140,255,0.15)',
  candleUp: '#3FB950', candleDown: '#F85149', candleWick: '#8B949E',
};

export const LIGHT_COLORS = {
  bgPrimary: '#FFFFFF', bgSecondary: '#F6F8FA', bgCard: '#FFFFFF',
  bgActive: '#EBEDF0', textPrimary: '#1F2328', textSecondary: '#656D76',
  textMuted: '#8C959F', accentGreen: '#1A7F37', accentRed: '#CF222E',
  accentBlue: '#0969DA', accentYellow: '#9A6700', accentPurple: '#8250DF',
  accentOrange: '#BD561D', accentCyan: '#1B7C70', border: '#D0D7DE',
  greenDim: 'rgba(26,127,55,0.1)', redDim: 'rgba(207,34,46,0.1)',
  blueDim: 'rgba(9,105,218,0.1)', yellowDim: 'rgba(154,103,0,0.1)',
  purpleDim: 'rgba(130,80,223,0.1)',
  candleUp: '#1A7F37', candleDown: '#CF222E', candleWick: '#656D76',
};

export const ECONOMIC_EVENTS = [
  { title: 'Non-Farm Payrolls', country: 'US', currency: 'USD', impact: 'HIGH' as const },
  { title: 'CPI (YoY)', country: 'US', currency: 'USD', impact: 'HIGH' as const },
  { title: 'FOMC Rate Decision', country: 'US', currency: 'USD', impact: 'HIGH' as const },
  { title: 'GDP (QoQ)', country: 'US', currency: 'USD', impact: 'HIGH' as const },
  { title: 'Initial Jobless Claims', country: 'US', currency: 'USD', impact: 'MEDIUM' as const },
  { title: 'Retail Sales (MoM)', country: 'US', currency: 'USD', impact: 'MEDIUM' as const },
  { title: 'Industrial Production', country: 'US', currency: 'USD', impact: 'MEDIUM' as const },
  { title: 'PMI Manufacturing', country: 'US', currency: 'USD', impact: 'MEDIUM' as const },
  { title: 'ECB Rate Decision', country: 'EU', currency: 'EUR', impact: 'HIGH' as const },
  { title: 'EUR CPI (YoY)', country: 'EU', currency: 'EUR', impact: 'HIGH' as const },
  { title: 'EUR GDP (QoQ)', country: 'EU', currency: 'EUR', impact: 'HIGH' as const },
  { title: 'BOE Rate Decision', country: 'UK', currency: 'GBP', impact: 'HIGH' as const },
  { title: 'UK CPI (YoY)', country: 'UK', currency: 'GBP', impact: 'HIGH' as const },
  { title: 'UK GDP (MoM)', country: 'UK', currency: 'GBP', impact: 'HIGH' as const },
  { title: 'BOJ Rate Decision', country: 'JP', currency: 'JPY', impact: 'HIGH' as const },
  { title: 'JP CPI (YoY)', country: 'JP', currency: 'JPY', impact: 'HIGH' as const },
  { title: 'RBA Rate Decision', country: 'AU', currency: 'AUD', impact: 'HIGH' as const },
  { title: 'AU CPI (QoQ)', country: 'AU', currency: 'AUD', impact: 'HIGH' as const },
  { title: 'BOC Rate Decision', country: 'CA', currency: 'CAD', impact: 'HIGH' as const },
  { title: 'CA CPI (MoM)', country: 'CA', currency: 'CAD', impact: 'HIGH' as const },
  { title: 'RBNZ Rate Decision', country: 'NZ', currency: 'NZD', impact: 'HIGH' as const },
  { title: 'NZ GDP (QoQ)', country: 'NZ', currency: 'NZD', impact: 'HIGH' as const },
  { title: 'SNB Rate Decision', country: 'CH', currency: 'CHF', impact: 'HIGH' as const },
  { title: 'CH CPI (YoY)', country: 'CH', currency: 'CHF', impact: 'HIGH' as const },
];

export const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', JP: '🇯🇵',
  AU: '🇦🇺', CA: '🇨🇦', NZ: '🇳🇿', CH: '🇨🇭',
};

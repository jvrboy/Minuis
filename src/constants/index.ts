import type { AppSettings, Timeframe, StrategyPresetConfig, NewsFilter } from '../types';

export const DERIV_WS_URL = 'wss://ws.derivws.com/websockets/v3';

export const SYMBOL_CATEGORIES = ['forex', 'metal', 'crypto', 'synthetic', 'stock', 'index'] as const;

export const ALL_SYMBOLS: Record<string, { category: string; name: string }> = {
  // Forex Majors
  frxEURUSD: { category: 'forex', name: 'EUR/USD' },
  frxGBPUSD: { category: 'forex', name: 'GBP/USD' },
  frxUSDJPY: { category: 'forex', name: 'USD/JPY' },
  frxAUDUSD: { category: 'forex', name: 'AUD/USD' },
  frxUSDCAD: { category: 'forex', name: 'USD/CAD' },
  frxUSDCHF: { category: 'forex', name: 'USD/CHF' },
  frxNZDUSD: { category: 'forex', name: 'NZD/USD' },
  // Forex Crosses
  frxEURGBP: { category: 'forex', name: 'EUR/GBP' },
  frxEURJPY: { category: 'forex', name: 'EUR/JPY' },
  frxGBPJPY: { category: 'forex', name: 'GBP/JPY' },
  frxEURCHF: { category: 'forex', name: 'EUR/CHF' },
  frxEURAUD: { category: 'forex', name: 'EUR/AUD' },
  frxEURCAD: { category: 'forex', name: 'EUR/CAD' },
  frxEURNZD: { category: 'forex', name: 'EUR/NZD' },
  frxGBPCHF: { category: 'forex', name: 'GBP/CHF' },
  frxGBPAUD: { category: 'forex', name: 'GBP/AUD' },
  frxGBPCAD: { category: 'forex', name: 'GBP/CAD' },
  frxGBPNZD: { category: 'forex', name: 'GBP/NZD' },
  frxAUDJPY: { category: 'forex', name: 'AUD/JPY' },
  frxAUDCHF: { category: 'forex', name: 'AUD/CHF' },
  frxAUDCAD: { category: 'forex', name: 'AUD/CAD' },
  frxAUDNZD: { category: 'forex', name: 'AUD/NZD' },
  frxCADJPY: { category: 'forex', name: 'CAD/JPY' },
  frxCADCHF: { category: 'forex', name: 'CAD/CHF' },
  frxNZDJPY: { category: 'forex', name: 'NZD/JPY' },
  frxNZDCHF: { category: 'forex', name: 'NZD/CHF' },
  frxNZDCAD: { category: 'forex', name: 'NZD/CAD' },
  frxCHFJPY: { category: 'forex', name: 'CHF/JPY' },
  // Exotics
  frxUSDTRY: { category: 'forex', name: 'USD/TRY' },
  frxEURTRY: { category: 'forex', name: 'EUR/TRY' },
  frxUSDMXN: { category: 'forex', name: 'USD/MXN' },
  frxUSDZAR: { category: 'forex', name: 'USD/ZAR' },
  frxUSDSGD: { category: 'forex', name: 'USD/SGD' },
  frxUSDHKD: { category: 'forex', name: 'USD/HKD' },
  frxUSDNOK: { category: 'forex', name: 'USD/NOK' },
  frxUSDSEK: { category: 'forex', name: 'USD/SEK' },
  frxUSDPLN: { category: 'forex', name: 'USD/PLN' },
  frxUSDCZK: { category: 'forex', name: 'USD/CZK' },
  // Metals
  frxXAUUSD: { category: 'metal', name: 'XAU/USD (Gold)' },
  frxXAGUSD: { category: 'metal', name: 'XAG/USD (Silver)' },
  frxXAUXAG: { category: 'metal', name: 'XAU/XAG' },
  frxXPDUSD: { category: 'metal', name: 'XPD/USD (Palladium)' },
  frxXPTUSD: { category: 'metal', name: 'XPT/USD (Platinum)' },
  // Crypto
  BTC: { category: 'crypto', name: 'Bitcoin' },
  ETH: { category: 'crypto', name: 'Ethereum' },
  LTC: { category: 'crypto', name: 'Litecoin' },
  XRP: { category: 'crypto', name: 'Ripple' },
  BCH: { category: 'crypto', name: 'Bitcoin Cash' },
  EOS: { category: 'crypto', name: 'EOS' },
  // Synthetics (Deriv)
  R_10: { category: 'synthetic', name: 'Volatility 10 Index' },
  R_25: { category: 'synthetic', name: 'Volatility 25 Index' },
  R_50: { category: 'synthetic', name: 'Volatility 50 Index' },
  R_75: { category: 'synthetic', name: 'Volatility 75 Index' },
  R_100: { category: 'synthetic', name: 'Volatility 100 Index' },
  R_150: { category: 'synthetic', name: 'Volatility 150 Index' },
  R_200: { category: 'synthetic', name: 'Volatility 200 Index' },
  R_250: { category: 'synthetic', name: 'Volatility 250 Index' },
  R_300: { category: 'synthetic', name: 'Volatility 300 Index' },
  BOOM300: { category: 'synthetic', name: 'Boom 300 Index' },
  BOOM500: { category: 'synthetic', name: 'Boom 500 Index' },
  BOOM1000: { category: 'synthetic', name: 'Boom 1000 Index' },
  CRASH300: { category: 'synthetic', name: 'Crash 300 Index' },
  CRASH500: { category: 'synthetic', name: 'Crash 500 Index' },
  CRASH1000: { category: 'synthetic', name: 'Crash 1000 Index' },
  // Stocks
  STK_APPLE: { category: 'stock', name: 'Apple' },
  STK_GOOGLE: { category: 'stock', name: 'Google' },
  STK_AMAZON: { category: 'stock', name: 'Amazon' },
  STK_MICROSOFT: { category: 'stock', name: 'Microsoft' },
  STK_META: { category: 'stock', name: 'Meta' },
  STK_NVIDIA: { category: 'stock', name: 'NVIDIA' },
  STK_TESLA: { category: 'stock', name: 'Tesla' },
  STK_JPM: { category: 'stock', name: 'JP Morgan' },
  STK_VISA: { category: 'stock', name: 'Visa' },
  STK_NFLX: { category: 'stock', name: 'Netflix' },
  // Indices
  US30: { category: 'index', name: 'US Wall Street 30' },
  US100: { category: 'index', name: 'US Nasdaq 100' },
  US500: { category: 'index', name: 'US S&P 500' },
  FRA40: { category: 'index', name: 'France 40' },
  GER40: { category: 'index', name: 'Germany 40' },
  UK100: { category: 'index', name: 'UK 100' },
  JPN225: { category: 'index', name: 'Japan 225' },
  AUS200: { category: 'index', name: 'Australia 200' },
  EU50: { category: 'index', name: 'Europe 50' },
  HKG33: { category: 'index', name: 'Hong Kong 33' },
};

export const SYMBOL_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(ALL_SYMBOLS).map(([k, v]) => [k, v.name])
);

export const DEFAULT_SYMBOLS = ['frxEURUSD', 'frxGBPUSD', 'frxUSDJPY', 'frxAUDUSD', 'frxUSDCAD'];

export const CATEGORY_SYMBOLS: Record<string, string[]> = {
  forex: Object.entries(ALL_SYMBOLS).filter(([, v]) => v.category === 'forex').map(([k]) => k),
  metal: Object.entries(ALL_SYMBOLS).filter(([, v]) => v.category === 'metal').map(([k]) => k),
  crypto: Object.entries(ALL_SYMBOLS).filter(([, v]) => v.category === 'crypto').map(([k]) => k),
  synthetic: Object.entries(ALL_SYMBOLS).filter(([, v]) => v.category === 'synthetic').map(([k]) => k),
  stock: Object.entries(ALL_SYMBOLS).filter(([, v]) => v.category === 'stock').map(([k]) => k),
  index: Object.entries(ALL_SYMBOLS).filter(([, v]) => v.category === 'index').map(([k]) => k),
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

export const CATEGORY_COLORS: Record<string, string> = {
  forex: '#58A6FF',
  metal: '#F0883E',
  crypto: '#D29922',
  synthetic: '#BC8CFF',
  stock: '#39D2C0',
  index: '#3FB950',
};

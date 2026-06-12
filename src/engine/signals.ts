import type { Candle, Signal, SignalDirection, SignalStrength, IndicatorSet, Divergence, Trend, Regime, AppSettings, Timeframe } from '../types';
import { computeAllIndicators } from './indicators';
import { computeBollinger, computeIchimoku } from './advancedIndicators';
import { detectDivergences } from './divergences';
import { analyzeTrend } from './trends';
import { detectRegime, regimeAllowsSignal, regimeScore } from './regime';
import { isSuppressedByNews, getUpcomingEvents } from './newsFilter';
import { useStore } from '../store/useStore';

let signalCounter = 0;
const recentSignals = new Map<string, number>();

function generateId(): string {
  return `sig_${Date.now()}_${++signalCounter}`;
}

function computeConfidence(
  direction: SignalDirection,
  indicators: IndicatorSet,
  divergences: Divergence[],
  trend: Trend,
  regime: Regime,
  settings: AppSettings
): number {
  let score = 0;
  const isBullish = direction === 'BUY';
  const { macd, rsi, stochastic, bollinger, ichimoku } = indicators;

  if (isBullish) {
    if (macd.histogram > 0) score += 12;
    if (macd.macdLine > macd.signalLine) score += 8;
    if (rsi.value > 50 && rsi.value < 70) score += 12;
    if (rsi.value <= settings.rsiOversold) score += 18;
    if (stochastic.k > stochastic.d && stochastic.k < 80) score += 8;
    if (stochastic.k <= 20) score += 12;
    if (trend.direction === 'UP') score += 12;
    if (trend.direction === 'DOWN') score -= 8;
    if (bollinger && indicators.marketProfile) {
      if (indicators.marketProfile.poc > 0) score += 5;
    }
    if (ichimoku) {
      if (ichimoku.cloudGreen) score += 8;
      if (ichimoku.tenkan > ichimoku.kijun) score += 5;
    }
  } else {
    if (macd.histogram < 0) score += 12;
    if (macd.macdLine < macd.signalLine) score += 8;
    if (rsi.value < 50 && rsi.value > 30) score += 12;
    if (rsi.value >= settings.rsiOverbought) score += 18;
    if (stochastic.k < stochastic.d && stochastic.k > 20) score += 8;
    if (stochastic.k >= 80) score += 12;
    if (trend.direction === 'DOWN') score += 12;
    if (trend.direction === 'UP') score -= 8;
    if (ichimoku) {
      if (!ichimoku.cloudGreen) score += 8;
      if (ichimoku.tenkan < ichimoku.kijun) score += 5;
    }
  }

  for (const d of divergences) {
    const isBullishDiv = d.type === 'regular_bullish' || d.type === 'hidden_bullish';
    if ((isBullish && isBullishDiv) || (!isBullish && !isBullishDiv)) {
      score += d.strength * 8;
    }
  }

  score += regimeScore(regime);

  return Math.max(0, Math.min(100, score));
}

function computeSLTP(
  direction: SignalDirection,
  entry: number,
  _indicators: IndicatorSet,
  _marketProfile: any,
  volatility: number
): { stopLoss: number; takeProfit: number } {
  const atr = Math.max(volatility, 0.001);
  const multiplier = direction === 'BUY' ? 1 : -1;
  const stopLoss = entry - multiplier * atr * 1.5;
  const takeProfit = entry + multiplier * atr * 2.5;
  return { stopLoss, takeProfit };
}

function shouldGenerateSignal(symbol: string, direction: SignalDirection, settings: AppSettings): boolean {
  const key = `${symbol}_${direction}`;
  const lastTime = recentSignals.get(key) || 0;
  if (Date.now() - lastTime < settings.signalCooldownMs) return false;
  recentSignals.set(key, Date.now());
  return true;
}

function evaluateSymbol(
  symbol: string,
  candles: Candle[],
  settings: AppSettings,
  timeframe: Timeframe,
  candlesMulti: Record<string, Record<string, Candle[]>>
): Signal | null {
  if (!candles || candles.length < 50) return null;

  const closes = candles.map((c) => c.close);
  const {
    macd, macdHistory, rsi, rsiHistory, erma, ermaHistory,
    stochastic, stochasticHistory, marketProfile, lastCandle,
  } = computeAllIndicators(
    candles, settings.macdFast, settings.macdSlow, settings.macdSignal,
    settings.rsiPeriod, settings.ermaPeriod,
    settings.stochK, settings.stochD, settings.stochSmooth
  );

  const bollingerHistory = computeBollinger(closes, settings.bbPeriod, settings.bbStdDev);
  const ichimokuHistory = computeIchimoku(candles);

  const bollinger = bollingerHistory[bollingerHistory.length - 1];
  const ichimokuData = ichimokuHistory[ichimokuHistory.length - 1];

  const divergences = detectDivergences(candles, macdHistory, rsiHistory, stochasticHistory);
  const trend = analyzeTrend(candles, ermaHistory);
  const regime = detectRegime(candles);

  if (settings.preset !== 'SCALPER' && !regimeAllowsSignal(regime, { regimeFilter: true })) {
    return null;
  }

  const entry = lastCandle.close;
  const volatility = (lastCandle.high - lastCandle.low);

  const indicators: IndicatorSet = {
    macd, rsi, erma, stochastic,
    bollinger, ichimoku: ichimokuData,
    volumeProfile: undefined,
    marketProfile,
  };

  const directionsToCheck: SignalDirection[] = [];

  if (macd.histogram > 0 && rsi.value > 50 && stochastic.k > stochastic.d) directionsToCheck.push('BUY');
  if (macd.histogram > 0 && macd.macdLine > macd.signalLine) directionsToCheck.push('BUY');
  if (rsi.value <= settings.rsiOversold && stochastic.k <= 20) directionsToCheck.push('BUY');
  if (divergences.some((d) => d.type === 'regular_bullish' || d.type === 'hidden_bullish')) directionsToCheck.push('BUY');
  if (ichimokuData && ichimokuData.cloudGreen && ichimokuData.tenkan > ichimokuData.kijun) directionsToCheck.push('BUY');

  if (macd.histogram < 0 && rsi.value < 50 && stochastic.k < stochastic.d) directionsToCheck.push('SELL');
  if (macd.histogram < 0 && macd.macdLine < macd.signalLine) directionsToCheck.push('SELL');
  if (rsi.value >= settings.rsiOverbought && stochastic.k >= 80) directionsToCheck.push('SELL');
  if (divergences.some((d) => d.type === 'regular_bearish' || d.type === 'hidden_bearish')) directionsToCheck.push('SELL');
  if (ichimokuData && !ichimokuData.cloudGreen && ichimokuData.tenkan < ichimokuData.kijun) directionsToCheck.push('SELL');

  const seen = new Set<SignalDirection>();
  for (const direction of directionsToCheck) {
    if (seen.has(direction)) continue;
    seen.add(direction);
    if (!shouldGenerateSignal(symbol, direction, settings)) continue;

    let confidence = computeConfidence(direction, indicators, divergences, trend, regime, settings);

    if (settings.multiTimeframeEnabled && timeframe === settings.timeframe) {
      let tfConfluence = 0;
      for (const tf of settings.multiTimeframes) {
        if (tf === settings.timeframe) continue;
        const tfCandles = candlesMulti[symbol]?.[tf];
        if (!tfCandles || tfCandles.length < 50) continue;
        const tfCloses = tfCandles.map((c) => c.close);
        const tfResult = computeAllIndicators(
          tfCandles, settings.macdFast, settings.macdSlow, settings.macdSignal,
          settings.rsiPeriod, settings.ermaPeriod,
          settings.stochK, settings.stochD, settings.stochSmooth
        );
        const aligns =
          direction === 'BUY'
            ? tfResult.macd.histogram > 0 && tfResult.rsi.value > 50
            : tfResult.macd.histogram < 0 && tfResult.rsi.value < 50;
        if (aligns) tfConfluence++;
      }
      if (tfConfluence > 0) {
        confidence = Math.min(100, confidence + tfConfluence * 8);
        if (tfConfluence === settings.multiTimeframes.length - 1) {
          confidence = Math.min(100, confidence + 5);
        }
      } else if (settings.multiTimeframes.length > 1) {
        confidence = Math.max(0, confidence - 10);
      }
    }

    if (confidence < settings.minConfidence) continue;

    const { stopLoss, takeProfit } = computeSLTP(direction, entry, indicators, marketProfile, volatility);

    const reasons: string[] = [];
    if (direction === 'BUY') {
      if (macd.histogram > 0) reasons.push(`MACD+ (${macd.histogram.toFixed(5)})`);
      if (macd.macdLine > macd.signalLine) reasons.push('MACD > Signal');
      if (rsi.value <= settings.rsiOversold) reasons.push(`RSI oversold (${rsi.value.toFixed(1)})`);
      if (rsi.value > 50) reasons.push(`RSI bullish (${rsi.value.toFixed(1)})`);
      if (stochastic.k <= 20) reasons.push('Stoch oversold');
      if (stochastic.k > stochastic.d) reasons.push('Stoch bullish cross');
      if (trend.direction === 'UP') reasons.push(`Trend: ${trend.direction}`);
      if (regime.type === 'TRENDING') reasons.push('Trending regime');
      if (ichimokuData?.cloudGreen) reasons.push('Ichimoku bullish');
      if (entry > (marketProfile?.poc || 0)) reasons.push('Above POC');
    } else {
      if (macd.histogram < 0) reasons.push(`MACD- (${macd.histogram.toFixed(5)})`);
      if (macd.macdLine < macd.signalLine) reasons.push('MACD < Signal');
      if (rsi.value >= settings.rsiOverbought) reasons.push(`RSI overbought (${rsi.value.toFixed(1)})`);
      if (rsi.value < 50) reasons.push(`RSI bearish (${rsi.value.toFixed(1)})`);
      if (stochastic.k >= 80) reasons.push('Stoch overbought');
      if (stochastic.k < stochastic.d) reasons.push('Stoch bearish cross');
      if (trend.direction === 'DOWN') reasons.push(`Trend: ${trend.direction}`);
      if (regime.type === 'TRENDING') reasons.push('Trending regime');
      if (!ichimokuData?.cloudGreen) reasons.push('Ichimoku bearish');
      if (entry < (marketProfile?.poc || 0)) reasons.push('Below POC');
    }

    for (const d of divergences) {
      reasons.push(`${d.indicator} ${d.type.replace('_', ' ')}`);
    }
    if (bollinger) {
      if (entry <= bollinger.lower) reasons.push('BB lower touch');
      if (entry >= bollinger.upper) reasons.push('BB upper touch');
    }

    const strength: SignalStrength = confidence >= 80 ? 3 : confidence >= 65 ? 2 : 1;

    return {
      id: generateId(),
      symbol, direction,
      entry: Math.round(entry * 100000) / 100000,
      stopLoss: Math.round(stopLoss * 100000) / 100000,
      takeProfit: Math.round(takeProfit * 100000) / 100000,
      confidence: Math.round(confidence),
      strength,
      timeframe,
      indicators,
      divergences, trend, regime,
      reasons,
      timestamp: Date.now(),
      status: 'ACTIVE',
    };
  }

  return null;
}

export function evaluateSignals(
  candlesMap: Record<string, Candle[]>,
  settings: AppSettings,
  candlesMulti?: Record<string, Record<string, Candle[]>>
): Signal[] {
  const signals: Signal[] = [];
  const upcomingEvents = getUpcomingEvents(20);
  if (isSuppressedByNews(upcomingEvents, settings.newsFilter)) {
    return signals;
  }

  for (const symbol of settings.symbols) {
    const candles = candlesMap[symbol];
    const signal = evaluateSymbol(symbol, candles, settings, settings.timeframe, candlesMulti || {});
    if (signal) signals.push(signal);
  }

  return signals;
}

export function runSignalEngine() {
  const { candles, candlesMulti, settings } = useStore.getState();
  const newSignals = evaluateSignals(candles, settings, candlesMulti);
  for (const signal of newSignals) {
    useStore.getState().addSignal(signal);
  }
}

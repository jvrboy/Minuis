import type { BacktestResult, Timeframe, Candle, AppSettings } from '../types';
import { useStore } from '../store/useStore';
import { derivApi } from './derivApi';
import { evaluateSignals } from '../engine/signals';

class AutoBacktestService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private lastResults = new Map<string, BacktestResult>();

  async start() {
    if (this.running) return;
    this.running = true;
    const { autoBacktestConfig } = useStore.getState();
    if (!autoBacktestConfig.enabled) return;

    useStore.getState().setAutoBacktestRunning(true);
    await this.runBacktestCycle();
    this.timer = setInterval(() => this.runBacktestCycle(), autoBacktestConfig.intervalMs);
  }

  stop() {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    useStore.getState().setAutoBacktestRunning(false);
  }

  isRunning() { return this.running; }

  private async runBacktestCycle() {
    try {
      const { settings, autoBacktestConfig } = useStore.getState();
      if (!autoBacktestConfig.enabled) return;

      for (const symbol of autoBacktestConfig.symbols) {
        for (const tf of autoBacktestConfig.timeframes) {
          const key = `${symbol}_${tf}`;
          const result = await this.backtestSymbol(symbol, tf, settings);
          if (result && result.totalTrades > 0) {
            this.lastResults.set(key, result);
            useStore.getState().addAutoBacktestResult(result);
          }
        }
      }
    } catch { }
  }

  private async backtestSymbol(
    symbol: string,
    timeframe: Timeframe,
    settings: AppSettings
  ): Promise<BacktestResult | null> {
    try {
      const candles = await derivApi.fetchCandles(symbol, timeframe, 500);
      if (!candles || candles.length < 100) return null;

      const trades: any[] = [];
      let equity = settings.virtualBalance;
      const equityCurve: { time: number; equity: number }[] = [{ time: candles[0].time, equity }];
      let wins = 0, losses = 0;
      let totalProfit = 0;
      let maxDrawdown = 0;
      let peak = equity;
      let sumWins = 0, sumLosses = 0;
      let largestWin = 0, largestLoss = 0;
      let totalConf = 0;

      const candleMap: Record<string, Candle[]> = {};
      const candleMultiMap: Record<string, Record<string, Candle[]>> = {};

      for (let i = 100; i < candles.length; i++) {
        const slice = candles.slice(0, i + 1);
        candleMap[symbol] = slice;

        const signals = evaluateSignals(candleMap, settings, candleMultiMap);
        const signal = signals.find((s) => s.symbol === symbol);
        if (!signal) continue;

        const entryBar = slice[slice.length - 1];
        const futureBars = candles.slice(i + 1, i + 50);
        let exitBar: Candle | null = null;

        for (const fb of futureBars) {
          if (signal.direction === 'BUY') {
            if (fb.high >= signal.takeProfit) { exitBar = fb; break; }
            if (fb.low <= signal.stopLoss) { exitBar = fb; break; }
          } else {
            if (fb.low <= signal.takeProfit) { exitBar = fb; break; }
            if (fb.high >= signal.stopLoss) { exitBar = fb; break; }
          }
        }

        if (exitBar) {
          const isWin = signal.direction === 'BUY'
            ? exitBar.high >= signal.takeProfit
            : exitBar.low <= signal.takeProfit;
          const profit = isWin
            ? ((signal.takeProfit - signal.entry) / signal.entry) * 100
            : ((signal.stopLoss - signal.entry) / signal.entry) * 100;
          const profitVal = (profit / 100) * settings.virtualBalance * (settings.riskPerTrade / 100);

          if (isWin) { wins++; sumWins += profitVal; largestWin = Math.max(largestWin, profitVal); }
          else { losses++; sumLosses += Math.abs(profitVal); largestLoss = Math.min(largestLoss, profitVal); }

          totalProfit += profitVal;
          equity += profitVal;
          totalConf += signal.confidence;

          trades.push({
            entryTime: entryBar.time,
            exitTime: exitBar.time,
            direction: signal.direction,
            entry: signal.entry,
            exit: isWin ? signal.takeProfit : signal.stopLoss,
            profit: profitVal,
            profitPips: Math.abs(profitVal),
            confidence: signal.confidence,
            reasons: signal.reasons,
          });

          peak = Math.max(peak, equity);
          maxDrawdown = Math.max(maxDrawdown, ((peak - equity) / peak) * 100);
          equityCurve.push({ time: exitBar.time, equity });
        }
      }

      const totalTrades = trades.length;
      if (totalTrades === 0) return null;

      const winRate = (wins / totalTrades) * 100;
      const avgWin = wins > 0 ? sumWins / wins : 0;
      const avgLoss = losses > 0 ? sumLosses / losses : 0;
      const profitFactor = sumLosses > 0 ? sumWins / sumLosses : sumWins > 0 ? Infinity : 0;

      let returns: number[] = [];
      for (let i = 1; i < equityCurve.length; i++) {
        returns.push((equityCurve[i].equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity);
      }
      const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      const stdDev = Math.sqrt(returns.length > 0 ? returns.map((r) => (r - avgReturn) ** 2).reduce((a, b) => a + b, 0) / returns.length : 1);
      const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

      return {
        symbol, timeframe,
        totalTrades, wins, losses,
        winRate: Math.round(winRate * 100) / 100,
        profitFactor: Math.round(profitFactor * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        avgWin: Math.round(avgWin * 100) / 100,
        avgLoss: Math.round(avgLoss * 100) / 100,
        largestWin: Math.round(largestWin * 100) / 100,
        largestLoss: Math.round(largestLoss * 100) / 100,
        avgConfidence: totalTrades > 0 ? Math.round(totalConf / totalTrades) : 0,
        trades,
        equityCurve,
        params: {
          macdFast: settings.macdFast,
          macdSlow: settings.macdSlow,
          macdSignal: settings.macdSignal,
          rsiPeriod: settings.rsiPeriod,
          rsiOverbought: settings.rsiOverbought,
          rsiOversold: settings.rsiOversold,
          stochK: settings.stochK,
          stochD: settings.stochD,
          minConfidence: settings.minConfidence,
        },
      };
    } catch {
      return null;
    }
  }

  getLastResults() { return this.lastResults; }
}

export const autoBacktest = new AutoBacktestService();

import type { Signal, SignalHistoryEntry, LearningEntry, BacktestResult } from '../types';
import { useStore } from '../store/useStore';
import { llmEngine } from './llmEngine';

class LearningSystem {
  private patternScores = new Map<string, { wins: number; losses: number; totalProfit: number }>();
  private symbolPerformance = new Map<string, { wins: number; losses: number; totalProfit: number }>();
  private indicatorPerformance = new Map<string, { wins: number; losses: number }>();

  learnFromSignal(signal: SignalHistoryEntry) {
    if (!useStore.getState().learningEnabled) return;

    const store = useStore.getState();
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
      pattern: this.extractPattern(signal),
    };

    store.addLearningEntry(entry);
    llmEngine.learnFromEntry(entry);
    this.updateStats(entry);

    this.adjustSettings(entry);
  }

  private extractPattern(signal: SignalHistoryEntry): string {
    const keyIndicators = signal.reasons
      .filter((r) => r.includes('MACD') || r.includes('RSI') || r.includes('Stoch') || r.includes('Trend') || r.includes('Ichimoku'))
      .slice(0, 3);
    return `${signal.direction}_${signal.symbol}_${signal.timeframe}_${keyIndicators.join('|')}`;
  }

  private updateStats(entry: LearningEntry) {
    const pattern = entry.pattern;
    const existing = this.patternScores.get(pattern) || { wins: 0, losses: 0, totalProfit: 0 };
    if (entry.outcome === 'HIT_TP') existing.wins++;
    else existing.losses++;
    existing.totalProfit += entry.profit;
    this.patternScores.set(pattern, existing);

    const symPerf = this.symbolPerformance.get(entry.symbol) || { wins: 0, losses: 0, totalProfit: 0 };
    if (entry.outcome === 'HIT_TP') symPerf.wins++;
    else symPerf.losses++;
    symPerf.totalProfit += entry.profit;
    this.symbolPerformance.set(entry.symbol, symPerf);

    for (const reason of entry.reasons) {
      const key = reason.split('(')[0].trim();
      const indPerf = this.indicatorPerformance.get(key) || { wins: 0, losses: 0 };
      if (entry.outcome === 'HIT_TP') indPerf.wins++;
      else indPerf.losses++;
      this.indicatorPerformance.set(key, indPerf);
    }
  }

  private adjustSettings(entry: LearningEntry) {
    const { settings } = useStore.getState();
    const symbolPerf = this.symbolPerformance.get(entry.symbol);
    if (!symbolPerf || (symbolPerf.wins + symbolPerf.losses) < 10) return;

    const winRate = symbolPerf.wins / (symbolPerf.wins + symbolPerf.losses);
    const currentSymbols = settings.symbols;

    if (winRate < 0.3 && currentSymbols.includes(entry.symbol)) {
      const newSymbols = currentSymbols.filter((s) => s !== entry.symbol);
      if (newSymbols.length > 0) {
        useStore.getState().setSettings({ symbols: newSymbols });
      }
    } else if (winRate > 0.7 && !currentSymbols.includes(entry.symbol)) {
      useStore.getState().setSettings({ symbols: [...currentSymbols, entry.symbol] });
    }
  }

  getBestPatterns(limit = 5): { pattern: string; winRate: number; totalProfit: number; count: number }[] {
    const results: { pattern: string; winRate: number; totalProfit: number; count: number }[] = [];
    this.patternScores.forEach((v, k) => {
      const total = v.wins + v.losses;
      if (total >= 3) {
        results.push({ pattern: k, winRate: v.wins / total, totalProfit: v.totalProfit, count: total });
      }
    });
    return results.sort((a, b) => b.winRate - a.winRate).slice(0, limit);
  }

  getWorstPatterns(limit = 5): { pattern: string; winRate: number; totalProfit: number; count: number }[] {
    const results: { pattern: string; winRate: number; totalProfit: number; count: number }[] = [];
    this.patternScores.forEach((v, k) => {
      const total = v.wins + v.losses;
      if (total >= 3) {
        results.push({ pattern: k, winRate: v.wins / total, totalProfit: v.totalProfit, count: total });
      }
    });
    return results.sort((a, b) => a.winRate - b.winRate).slice(0, limit);
  }

  getSymbolAdvice(): { symbol: string; winRate: number; action: 'KEEP' | 'REMOVE' | 'ADD' }[] {
    const advice: { symbol: string; winRate: number; action: 'KEEP' | 'REMOVE' | 'ADD' }[] = [];
    this.symbolPerformance.forEach((v, k) => {
      const total = v.wins + v.losses;
      if (total >= 5) {
        const wr = v.wins / total;
        let action: 'KEEP' | 'REMOVE' | 'ADD' = 'KEEP';
        if (wr < 0.3) action = 'REMOVE';
        else if (wr > 0.7) action = 'ADD';
        advice.push({ symbol: k, winRate: wr, action });
      }
    });
    return advice;
  }

  getPerformanceSummary(): string {
    let totalWins = 0, totalLosses = 0, totalProfit = 0;
    this.patternScores.forEach((v) => {
      totalWins += v.wins;
      totalLosses += v.losses;
      totalProfit += v.totalProfit;
    });
    const total = totalWins + totalLosses;
    if (total === 0) return 'No learning data yet.';
    const wr = ((totalWins / total) * 100).toFixed(1);
    return `Analyzed ${total} signals: ${wr}% win rate, $${totalProfit.toFixed(2)} total profit. ${this.patternScores.size} unique patterns tracked.`;
  }
}

export const learningSystem = new LearningSystem();

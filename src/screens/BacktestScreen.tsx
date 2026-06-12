import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { runBacktest, runOptimizer } from '../engine/backtest';
import { SYMBOL_NAMES, TIMEFRAMES, COLORS } from '../constants';
import type { Timeframe, OptimizerParams, BacktestResult } from '../types';

function MetricBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.metricBox}>
      <Text style={[styles.metricBoxValue, color ? { color } : undefined]}>{value}</Text>
      <Text style={styles.metricBoxLabel}>{label}</Text>
    </View>
  );
}

function BacktestView({ result }: { result: BacktestResult }) {
  return (
    <ScrollView style={styles.resultScroll}>
      <View style={styles.resultGrid}>
        <MetricBox label="Total Trades" value={result.totalTrades.toString()} />
        <MetricBox label="Win Rate" value={`${result.winRate}%`} color={COLORS.accentGreen} />
        <MetricBox label="Profit Factor" value={result.profitFactor.toFixed(2)} color={result.profitFactor > 1.5 ? COLORS.accentGreen : COLORS.accentRed} />
        <MetricBox label="Total P&L" value={`${result.totalProfit >= 0 ? '+' : ''}${result.totalProfit}`} color={result.totalProfit >= 0 ? COLORS.accentGreen : COLORS.accentRed} />
        <MetricBox label="Max DD" value={`${result.maxDrawdown}%`} color={result.maxDrawdown < 15 ? COLORS.accentGreen : COLORS.accentRed} />
        <MetricBox label="Sharpe" value={result.sharpeRatio.toFixed(2)} color={result.sharpeRatio > 1.5 ? COLORS.accentGreen : COLORS.accentRed} />
        <MetricBox label="Avg Win" value={result.avgWin.toFixed(5)} color={COLORS.accentGreen} />
        <MetricBox label="Avg Loss" value={result.avgLoss.toFixed(5)} color={COLORS.accentRed} />
        <MetricBox label="Best" value={result.largestWin.toFixed(5)} color={COLORS.accentGreen} />
        <MetricBox label="Worst" value={result.largestLoss.toFixed(5)} color={COLORS.accentRed} />
        <MetricBox label="Avg Conf" value={`${result.avgConfidence}%`} />
        <MetricBox label="Wins" value={result.wins.toString()} color={COLORS.accentGreen} />
      </View>

      <View style={styles.paramsSection}>
        <Text style={styles.paramsTitle}>Parameters Used</Text>
        <View style={styles.paramsGrid}>
          <Text style={styles.paramText}>MACD: {result.params.macdFast}/{result.params.macdSlow}/{result.params.macdSignal}</Text>
          <Text style={styles.paramText}>RSI: {result.params.rsiPeriod} (OB:{result.params.rsiOverbought}, OS:{result.params.rsiOversold})</Text>
          <Text style={styles.paramText}>Stoch: K={result.params.stochK} D={result.params.stochD}</Text>
          <Text style={styles.paramText}>Min Conf: {result.params.minConfidence}%</Text>
        </View>
      </View>

      <View style={styles.tradesSection}>
        <Text style={styles.paramsTitle}>Recent Trades</Text>
        {result.trades.slice(-20).reverse().map((t, i) => (
          <View key={i} style={styles.tradeRow}>
            <Text style={[styles.tradeDir, { color: t.direction === 'BUY' ? COLORS.accentGreen : COLORS.accentRed }]}>{t.direction}</Text>
            <Text style={styles.tradeDetail}>${t.profit.toFixed(2)}</Text>
            <Text style={[styles.tradeDetail, { color: t.profit > 0 ? COLORS.accentGreen : COLORS.accentRed }]}>{t.profitPips.toFixed(0)}p</Text>
            <Text style={styles.tradeDetail}>{t.confidence}%</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function BacktestScreen() {
  const { candles, settings, backtestResult, optimizerResults, setBacktestResult, setOptimizerResults } = useStore();
  const [selectedSymbol, setSelectedSymbol] = useState(settings.symbols[0] || 'frxEURUSD');
  const [selectedTF, setSelectedTF] = useState<Timeframe>('1h');
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<'backtest' | 'optimize'>('backtest');

  const symbolCandles = candles[selectedSymbol] || [];

  const handleRun = useCallback(async () => {
    if (symbolCandles.length < 100) return;
    setRunning(true);

    const params: OptimizerParams = {
      macdFast: settings.macdFast, macdSlow: settings.macdSlow, macdSignal: settings.macdSignal,
      rsiPeriod: settings.rsiPeriod, rsiOverbought: settings.rsiOverbought, rsiOversold: settings.rsiOversold,
      stochK: settings.stochK, stochD: settings.stochD, minConfidence: settings.minConfidence,
    };

    setTimeout(() => {
      if (mode === 'optimize') {
        const results = runOptimizer(symbolCandles, selectedTF);
        setOptimizerResults(results);
        setBacktestResult(results[0]?.result || null);
      } else {
        const result = runBacktest(symbolCandles, selectedTF, params);
        setBacktestResult(result);
      }
      setRunning(false);
    }, 100);
  }, [symbolCandles, selectedTF, mode, settings, setBacktestResult, setOptimizerResults]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Backtest</Text>
        <Text style={styles.subtitle}>Historical performance analysis</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.symbolRow}>
          {settings.symbols.slice(0, 5).map((sym) => (
            <TouchableOpacity key={sym} style={[styles.chip, selectedSymbol === sym && styles.chipActive]} onPress={() => setSelectedSymbol(sym)}>
              <Text style={[styles.chipText, selectedSymbol === sym && styles.chipTextActive]}>{SYMBOL_NAMES[sym] || sym}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.controlRow}>
          <View style={styles.tfRow}>
            {TIMEFRAMES.slice(2, 6).map((tf) => (
              <TouchableOpacity key={tf} style={[styles.tfBtn, selectedTF === tf && styles.tfBtnActive]} onPress={() => setSelectedTF(tf)}>
                <Text style={[styles.tfText, selectedTF === tf && styles.tfTextActive]}>{tf}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.modeRow}>
          <TouchableOpacity style={[styles.modeBtn, mode === 'backtest' && styles.modeBtnActive]} onPress={() => setMode('backtest')}>
            <Text style={[styles.modeText, mode === 'backtest' && styles.modeTextActive]}>Backtest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, mode === 'optimize' && styles.modeBtnActive]} onPress={() => setMode('optimize')}>
            <Text style={[styles.modeText, mode === 'optimize' && styles.modeTextActive]}>Optimize</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.runBtn} onPress={handleRun} disabled={running}>
            {running ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.runText}>Run</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {symbolCandles.length < 100 && (
        <View style={styles.noData}>
          <Text style={styles.noDataText}>Need at least 100 candles. Fetching data...</Text>
        </View>
      )}

      {backtestResult ? (
        <BacktestView result={backtestResult} />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Run a Backtest</Text>
          <Text style={styles.emptyText}>Select a symbol and timeframe, then tap Run.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500', marginTop: 2 },
  controls: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 10 },
  symbolRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 10, gap: 6, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.bgActive },
  chipActive: { backgroundColor: COLORS.accentBlue },
  chipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  controlRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, alignItems: 'center' },
  tfRow: { flexDirection: 'row', gap: 4 },
  tfBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: COLORS.bgActive },
  tfBtnActive: { backgroundColor: COLORS.accentPurple },
  tfText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  tfTextActive: { color: '#fff' },
  modeRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, gap: 6 },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.bgActive },
  modeBtnActive: { backgroundColor: COLORS.accentBlue },
  modeText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  runBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.accentGreen, marginLeft: 'auto', minWidth: 60, alignItems: 'center' },
  runText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  noData: { padding: 20, alignItems: 'center' },
  noDataText: { color: COLORS.textMuted, fontSize: 13 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  emptyText: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },
  resultScroll: { flex: 1 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  metricBox: { backgroundColor: COLORS.bgCard, borderRadius: 10, padding: 12, minWidth: '30%', flex: 1, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  metricBoxValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  metricBoxLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  paramsSection: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  paramsTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  paramsGrid: { gap: 4 },
  paramText: { color: COLORS.textSecondary, fontSize: 12, fontFamily: 'monospace' },
  tradesSection: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingBottom: 40 },
  tradeRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  tradeDir: { fontSize: 12, fontWeight: '700', width: 40 },
  tradeDetail: { color: COLORS.textSecondary, fontSize: 12, fontFamily: 'monospace', width: 70, textAlign: 'right' },
});

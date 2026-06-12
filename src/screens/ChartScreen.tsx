import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CandlestickChart from '../components/CandlestickChart';
import { useStore } from '../store/useStore';
import { SYMBOL_NAMES, TIMEFRAMES } from '../constants';
import { useColors } from '../theme/colors';
import type { Timeframe } from '../types';

export default function ChartScreen() {
  const COLORS = useColors();
  const { candles, settings } = useStore();
  const [selectedSymbol, setSelectedSymbol] = useState(settings.symbols[0] || 'frxEURUSD');
  const [selectedTF, setSelectedTF] = useState<Timeframe>(settings.timeframe);
  const [showSR, setShowSR] = useState(true);

  const chartCandles = candles[selectedSymbol] || [];

  const stats = useMemo(() => {
    if (chartCandles.length === 0) return null;
    const last = chartCandles[chartCandles.length - 1];
    const prev = chartCandles[chartCandles.length - 2];
    const change = prev ? ((last.close - prev.close) / prev.close) * 100 : 0;
    return { close: last.close, change, high: last.high, low: last.low, range: last.high - last.low, volume: last.volume };
  }, [chartCandles]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgPrimary }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: COLORS.border }]}>
        <Text style={[styles.title, { color: COLORS.textPrimary }]}>Charts</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.symbolStrip, { borderBottomColor: COLORS.border }]} contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}>
        {settings.symbols.map((sym) => (
          <TouchableOpacity key={sym} style={[styles.symbolBtn, { backgroundColor: COLORS.bgActive }, selectedSymbol === sym && { backgroundColor: COLORS.accentBlue }]} onPress={() => setSelectedSymbol(sym)}>
            <Text style={[styles.symbolText, { color: COLORS.textSecondary }, selectedSymbol === sym && { color: '#fff' }]}>{SYMBOL_NAMES[sym] || sym}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {stats && (
        <View style={[styles.statsRow, { borderBottomColor: COLORS.border }]}>
          <Text style={[styles.price, { color: stats.change >= 0 ? COLORS.accentGreen : COLORS.accentRed }]}>
            {stats.close.toFixed(5)}
          </Text>
          <Text style={[styles.change, { color: stats.change >= 0 ? COLORS.accentGreen : COLORS.accentRed }]}>
            {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(3)}%
          </Text>
          <Text style={[styles.stat, { color: COLORS.textMuted }]}>H:{stats.high.toFixed(5)}</Text>
          <Text style={[styles.stat, { color: COLORS.textMuted }]}>L:{stats.low.toFixed(5)}</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tfStrip, { borderBottomColor: COLORS.border }]} contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}>
        {TIMEFRAMES.map((tf) => (
          <TouchableOpacity key={tf} style={[styles.tfBtn, { backgroundColor: COLORS.bgActive }, selectedTF === tf && { backgroundColor: COLORS.accentPurple }]} onPress={() => setSelectedTF(tf)}>
            <Text style={[styles.tfText, { color: COLORS.textSecondary }, selectedTF === tf && { color: '#fff' }]}>{tf}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.tfBtn, { backgroundColor: showSR ? COLORS.accentBlue : COLORS.bgActive }]} onPress={() => setShowSR(!showSR)}>
          <Text style={[styles.tfText, { color: showSR ? '#fff' : COLORS.textSecondary }]}>SR</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.chartContainer}>
        {chartCandles.length > 0 ? (
          <CandlestickChart candles={chartCandles} showVolume srLevels={showSR ? undefined : []} />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={[styles.emptyText, { color: COLORS.textMuted }]}>No data for {SYMBOL_NAMES[selectedSymbol] || selectedSymbol}</Text>
          </View>
        )}
      </View>

      <View style={[styles.legend, { borderTopColor: COLORS.border }]}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.candleUp }]} /><Text style={[styles.legendText, { color: COLORS.textMuted }]}>Bullish</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.candleDown }]} /><Text style={[styles.legendText, { color: COLORS.textMuted }]}>Bearish</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.accentOrange }]} /><Text style={[styles.legendText, { color: COLORS.textMuted }]}>S/R</Text></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  symbolStrip: { maxHeight: 44, borderBottomWidth: 1 },
  symbolBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  symbolText: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12, borderBottomWidth: 1 },
  price: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  change: { fontSize: 14, fontWeight: '600' },
  stat: { fontSize: 11, fontWeight: '500' },
  tfStrip: { maxHeight: 40, borderBottomWidth: 1 },
  tfBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  tfText: { fontSize: 11, fontWeight: '600' },
  chartContainer: { flex: 1, padding: 8, justifyContent: 'center' },
  emptyChart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 8, borderTopWidth: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11 },
});

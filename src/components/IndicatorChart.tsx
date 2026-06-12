import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import type { MACDResult, RSIResult, StochasticResult } from '../types';

interface Props {
  macd?: MACDResult;
  rsi?: RSIResult;
  stoch?: StochasticResult;
  compact?: boolean;
}

function MiniBar({ value, maxAbs }: { value: number; maxAbs: number }) {
  const barWidth = Math.min(Math.abs(value) / maxAbs, 1) * 60;
  const isPositive = value >= 0;
  return (
    <View style={styles.barRow}>
      <View
        style={[
          styles.bar,
          {
            width: barWidth,
            backgroundColor: isPositive ? COLORS.accentGreen : COLORS.accentRed,
            alignSelf: isPositive ? 'flex-start' : 'flex-end',
          },
        ]}
      />
    </View>
  );
}

export default function IndicatorChart({ macd, rsi, stoch, compact }: Props) {
  const maxAbs = macd ? Math.max(Math.abs(macd.macdLine), Math.abs(macd.histogram), 0.001) : 1;

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {rsi && (
        <View style={styles.row}>
          <Text style={styles.label}>RSI</Text>
          <Text
            style={[
              styles.value,
              {
                color:
                  rsi.value >= 70
                    ? COLORS.accentRed
                    : rsi.value <= 30
                      ? COLORS.accentGreen
                      : COLORS.textPrimary,
              },
            ]}
          >
            {rsi.value.toFixed(1)}
          </Text>
        </View>
      )}

      {stoch && (
        <View style={styles.row}>
          <Text style={styles.label}>STOCH</Text>
          <Text style={styles.value}>
            {stoch.k.toFixed(0)}/{stoch.d.toFixed(0)}
          </Text>
        </View>
      )}

      {macd && (
        <View style={styles.macdSection}>
          <View style={styles.row}>
            <Text style={styles.label}>MACD</Text>
            <Text style={styles.value}>{macd.macdLine.toFixed(5)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>SIGNAL</Text>
            <Text style={styles.value}>{macd.signalLine.toFixed(5)}</Text>
          </View>
          <View style={styles.histogramSection}>
            <Text style={[styles.label, { marginBottom: 4 }]}>HISTOGRAM</Text>
            <MiniBar value={macd.histogram} maxAbs={maxAbs} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  compact: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  macdSection: {
    gap: 3,
  },
  histogramSection: {
    marginTop: 4,
  },
  barRow: {
    height: 8,
    justifyContent: 'center',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
});

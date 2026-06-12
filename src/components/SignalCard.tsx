import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert as RNAlert } from 'react-native';
import { useColors } from '../theme/colors';
import { useStore } from '../store/useStore';
import { COLORS, SYMBOL_NAMES } from '../constants';
import MetricBadge from './MetricBadge';
import IndicatorChart from './IndicatorChart';
import type { Signal } from '../types';

interface Props {
  signal: Signal;
  onClose?: (id: string) => void;
}

function getConfidenceColor(confidence: number, COLORS: any): string {
  if (confidence >= 80) return COLORS.accentGreen;
  if (confidence >= 65) return COLORS.accentBlue;
  return COLORS.accentYellow;
}

export default function SignalCard({ signal, onClose }: Props) {
  const COLORS = useColors();
  const { candles, setBacktestResult } = useStore();
  const isBuy = signal.direction === 'BUY';
  const bgColor = isBuy ? COLORS.greenDim : COLORS.redDim;
  const accentColor = isBuy ? COLORS.accentGreen : COLORS.accentRed;
  const symbolName = SYMBOL_NAMES[signal.symbol] || signal.symbol;

  const handleLongPress = () => {
    const symbolCandles = candles[signal.symbol];
    if (!symbolCandles || symbolCandles.length < 50) {
      RNAlert.alert('Not enough data', 'Need at least 50 candles to backtest.');
      return;
    }
    try {
      const { runBacktest } = require('../engine/backtest');
      const params = {
        macdFast: 12, macdSlow: 26, macdSignal: 9,
        rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30,
        stochK: 14, stochD: 3, minConfidence: signal.confidence,
      };
      const result = runBacktest(symbolCandles, signal.timeframe, params);
      setBacktestResult(result);
      RNAlert.alert(
        'Backtest Result',
        `${symbolName} on ${signal.timeframe}\n\nTrades: ${result.totalTrades}\nWin Rate: ${result.winRate}%\nProfit Factor: ${result.profitFactor}\nTotal P&L: $${result.totalProfit.toFixed(2)}\nSharpe: ${result.sharpeRatio.toFixed(2)}`
      );
    } catch { }
  };
  const confidenceColor = getConfidenceColor(signal.confidence, COLORS);

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]} activeOpacity={0.8} onLongPress={handleLongPress}>
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.directionBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.directionText}>{signal.direction}</Text>
          </View>
          <View>
            <Text style={styles.symbol}>{symbolName}</Text>
            <Text style={styles.timeframe}>{signal.timeframe}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.confidence, { color: confidenceColor }]}>
            {signal.confidence}%
          </Text>
          <Text style={styles.confLabel}>CONFIDENCE</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.priceRow}>
          <MetricBadge label="Entry" value={signal.entry.toFixed(5)} color={COLORS.textPrimary} />
          <MetricBadge label="Stop Loss" value={signal.stopLoss.toFixed(5)} color={COLORS.accentRed} />
          <MetricBadge label="Take Profit" value={signal.takeProfit.toFixed(5)} color={COLORS.accentGreen} />
        </View>

        <View style={styles.trendRow}>
          <MetricBadge
            label="Trend"
            value={signal.trend.direction}
            color={
              signal.trend.direction === 'UP'
                ? COLORS.accentGreen
                : signal.trend.direction === 'DOWN'
                  ? COLORS.accentRed
                  : COLORS.accentYellow
            }
          />
          {signal.divergences.length > 0 && (
            <MetricBadge
              label="Divergence"
              value={signal.divergences.length.toString()}
              color={COLORS.accentPurple}
            />
          )}
          <MetricBadge
            label="Strength"
            value={signal.strength.toString() + '/3'}
            color={
              signal.strength === 3
                ? COLORS.accentGreen
                : signal.strength === 2
                  ? COLORS.accentBlue
                  : COLORS.accentYellow
            }
          />
        </View>

        <IndicatorChart
          macd={signal.indicators.macd}
          rsi={signal.indicators.rsi}
          stoch={signal.indicators.stochastic}
          compact
        />

        <View style={styles.reasonsContainer}>
          {signal.reasons.slice(0, 4).map((reason, i) => (
            <View key={i} style={styles.reasonChip}>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.time}>
          {new Date(signal.timestamp).toLocaleTimeString()}
        </Text>
        {onClose && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => onClose(signal.id)}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  directionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  directionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  symbol: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  timeframe: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  confidence: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  confLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  body: {
    padding: 14,
    gap: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  reasonChip: {
    backgroundColor: COLORS.bgActive,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reasonText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.bgActive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});

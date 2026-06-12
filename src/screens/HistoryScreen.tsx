import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { loadHistory, saveHistory } from '../services/storage';
import { COLORS, SYMBOL_NAMES } from '../constants';
import type { SignalHistoryEntry, SignalDirection } from '../types';

function HistoryCard({ entry }: { entry: SignalHistoryEntry }) {
  const isBuy = entry.direction === 'BUY';
  const isWin = entry.status === 'HIT_TP';
  const symbolName = SYMBOL_NAMES[entry.symbol] || entry.symbol;

  return (
    <View style={[styles.card, isWin ? styles.cardWin : styles.cardLoss]}>
      <View style={styles.cardHeader}>
        <View style={[styles.dirBadge, { backgroundColor: isBuy ? COLORS.accentGreen : COLORS.accentRed }]}>
          <Text style={styles.dirText}>{entry.direction}</Text>
        </View>
        <Text style={styles.symbolName}>{symbolName}</Text>
        <Text style={styles.timeframe}>{entry.timeframe}</Text>
        <View style={styles.spacer} />
        <Text style={[styles.status, { color: isWin ? COLORS.accentGreen : COLORS.accentRed }]}>
          {isWin ? 'WIN' : 'LOSS'}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Entry</Text>
          <Text style={styles.metricValue}>{entry.entry.toFixed(5)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Confidence</Text>
          <Text style={styles.metricValue}>{entry.confidence}%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Pips</Text>
          <Text style={[styles.metricValue, { color: entry.profit && entry.profit > 0 ? COLORS.accentGreen : COLORS.accentRed }]}>
            {entry.profitPips?.toFixed(1) || '—'}
          </Text>
        </View>
      </View>

      {entry.reasons && (
        <View style={styles.reasons}>
          {entry.reasons.slice(0, 3).map((r, i) => (
            <Text key={i} style={styles.reason}>{r}</Text>
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.timeText}>
          {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
        </Text>
        {entry.closedAt && (
          <Text style={styles.timeText}>
            Closed: {new Date(entry.closedAt).toLocaleTimeString()}
          </Text>
        )}
      </View>
    </View>
  );
}

function StatsBar({ entries }: { entries: SignalHistoryEntry[] }) {
  const total = entries.length;
  const wins = entries.filter((e) => e.status === 'HIT_TP').length;
  const losses = entries.filter((e) => e.status === 'HIT_SL').length;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
  const avgConf = total > 0 ? (entries.reduce((a, e) => a + e.confidence, 0) / total).toFixed(0) : '0';

  return (
    <View style={styles.statsBar}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{total}</Text>
        <Text style={styles.statLabel}>TOTAL</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: COLORS.accentGreen }]}>{wins}</Text>
        <Text style={styles.statLabel}>WINS</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: COLORS.accentRed }]}>{losses}</Text>
        <Text style={styles.statLabel}>LOSSES</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: COLORS.accentBlue }]}>{winRate}%</Text>
        <Text style={styles.statLabel}>WIN RATE</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: COLORS.accentPurple }]}>{avgConf}%</Text>
        <Text style={styles.statLabel}>AVG CONF</Text>
      </View>
    </View>
  );
}

type FilterType = 'ALL' | SignalDirection;

export default function HistoryScreen() {
  const { signalHistory, loadHistory: loadHistoryToStore } = useStore();
  const [filter, setFilter] = useState<FilterType>('ALL');

  useEffect(() => {
    loadHistory().then(loadHistoryToStore);
  }, [loadHistoryToStore]);

  useEffect(() => {
    saveHistory(signalHistory);
  }, [signalHistory]);

  const filtered = filter === 'ALL' ? signalHistory : signalHistory.filter((e) => e.direction === filter);

  const renderItem = useCallback(
    ({ item }: { item: SignalHistoryEntry }) => <HistoryCard entry={item} />,
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>{signalHistory.length} signals tracked</Text>
      </View>

      <StatsBar entries={signalHistory} />

      <View style={styles.filterRow}>
        {(['ALL', 'BUY', 'SELL'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'All' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyText}>
              Completed signals will appear here with their outcomes.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.bgActive,
  },
  filterBtnActive: {
    backgroundColor: COLORS.accentBlue,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  cardWin: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accentGreen,
  },
  cardLoss: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accentRed,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dirBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dirText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  symbolName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  timeframe: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  status: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  reasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  reason: {
    color: COLORS.textMuted,
    fontSize: 10,
    backgroundColor: COLORS.bgActive,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
});

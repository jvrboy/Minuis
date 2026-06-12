import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { SYMBOL_NAMES } from '../constants';
import { useColors } from '../theme/colors';
import type { Trade } from '../types';

function TradeCard({ trade }: { trade: Trade }) {
  const COLORS = useColors();
  const { updateTrade } = useStore();
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(trade.note || '');
  const isOpen = trade.status === 'OPEN';
  const isWin = trade.status === 'CLOSED_WIN';
  const symbolName = SYMBOL_NAMES[trade.symbol] || trade.symbol;

  const saveNote = () => {
    updateTrade(trade.id, { note: noteText });
    setEditingNote(false);
  };

  return (
    <View style={[styles.tradeCard, isOpen ? styles.tradeOpen : isWin ? styles.tradeWin : styles.tradeLoss]}>
      <View style={styles.tradeHeader}>
        <View style={[styles.dirBadge, { backgroundColor: trade.direction === 'BUY' ? COLORS.accentGreen : COLORS.accentRed }]}>
          <Text style={styles.dirText}>{trade.direction}</Text>
        </View>
        <Text style={styles.tradeSymbol}>{symbolName}</Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.tradeStatus, { color: isOpen ? COLORS.accentBlue : isWin ? COLORS.accentGreen : COLORS.accentRed }]}>
          {isOpen ? 'OPEN' : isWin ? 'WIN' : 'LOSS'}
        </Text>
      </View>
      <View style={styles.tradeBody}>
        <View style={styles.metric}><Text style={styles.metricLabel}>Entry</Text><Text style={styles.metricValue}>{trade.entry.toFixed(5)}</Text></View>
        <View style={styles.metric}><Text style={styles.metricLabel}>Size</Text><Text style={styles.metricValue}>{trade.size.toFixed(3)}</Text></View>
        <View style={styles.metric}><Text style={styles.metricLabel}>SL</Text><Text style={[styles.metricValue, { color: COLORS.accentRed }]}>{trade.stopLoss.toFixed(5)}</Text></View>
        <View style={styles.metric}><Text style={styles.metricLabel}>TP</Text><Text style={[styles.metricValue, { color: COLORS.accentGreen }]}>{trade.takeProfit.toFixed(5)}</Text></View>
      </View>
      {!isOpen && trade.profit !== undefined && (
        <View style={styles.tradeFooter}>
          <Text style={[styles.profit, { color: trade.profit >= 0 ? COLORS.accentGreen : COLORS.accentRed }]}>
            {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)} ({trade.profitPips?.toFixed(1)} pips)
          </Text>
        </View>
      )}
      <View style={[styles.noteSection, { borderTopColor: COLORS.border }]}>
        {editingNote ? (
          <View style={styles.noteEditRow}>
            <TextInput
              style={[styles.noteInput, { backgroundColor: COLORS.bgActive, color: COLORS.textPrimary, borderColor: COLORS.border }]}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add note..."
              placeholderTextColor={COLORS.textMuted}
              maxLength={120}
            />
            <TouchableOpacity onPress={saveNote}>
              <Text style={[styles.noteSave, { color: COLORS.accentBlue }]}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditingNote(true)}>
            <Text style={[styles.notePlaceholder, { color: trade.note ? COLORS.textSecondary : COLORS.textMuted }]}>
              {trade.note || 'Add note...'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function PortfolioScreen() {
  const COLORS = useColors();
  const { trades, portfolio, settings } = useStore();

  const renderTrade = useCallback(({ item }: { item: Trade }) => <TradeCard trade={item} />, []);
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgPrimary }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: COLORS.border }]}>
        <Text style={[styles.title, { color: COLORS.textPrimary }]}>Portfolio</Text>
        <Text style={[styles.subtitle, { color: COLORS.textMuted }]}>Virtual Trading</Text>
      </View>

      <View style={[styles.balanceBar, { backgroundColor: COLORS.bgSecondary, borderBottomColor: COLORS.border }]}>
        <View style={styles.balanceItem}>
          <Text style={[styles.balanceValue, { color: COLORS.textPrimary }]}>${portfolio.balance.toFixed(2)}</Text>
          <Text style={[styles.balanceLabel, { color: COLORS.textMuted }]}>BALANCE</Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={[styles.balanceValue, { color: portfolio.totalPnL >= 0 ? COLORS.accentGreen : COLORS.accentRed }]}>
            {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL.toFixed(2)}
          </Text>
          <Text style={[styles.balanceLabel, { color: COLORS.textMuted }]}>TOTAL P&L</Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={[styles.balanceValue, { color: COLORS.textPrimary }]}>{portfolio.winRate.toFixed(1)}%</Text>
          <Text style={[styles.balanceLabel, { color: COLORS.textMuted }]}>WIN RATE</Text>
        </View>
      </View>

      <View style={[styles.statsRow, { backgroundColor: COLORS.bgCard, borderBottomColor: COLORS.border }]}>
        <View style={styles.stat}><Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{portfolio.totalTrades}</Text><Text style={[styles.statLabel, { color: COLORS.textMuted }]}>Trades</Text></View>
        <View style={styles.stat}><Text style={[styles.statValue, { color: COLORS.accentGreen }]}>{trades.filter((t) => t.status === 'OPEN').length}</Text><Text style={[styles.statLabel, { color: COLORS.textMuted }]}>Open</Text></View>
        <View style={styles.stat}><Text style={[styles.statValue, { color: COLORS.accentBlue }]}>${portfolio.dailyPnL.toFixed(0)}</Text><Text style={[styles.statLabel, { color: COLORS.textMuted }]}>Daily</Text></View>
        <View style={styles.stat}><Text style={[styles.statValue, { color: COLORS.accentPurple }]}>${portfolio.weeklyPnL.toFixed(0)}</Text><Text style={[styles.statLabel, { color: COLORS.textMuted }]}>Weekly</Text></View>
      </View>

      <FlatList
        data={trades}
        keyExtractor={(item) => item.id}
        renderItem={renderTrade}
        contentContainerStyle={trades.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>No Trades Yet</Text>
            <Text style={[styles.emptyText, { color: COLORS.textMuted }]}>Signals will be auto-traded when virtual trading is enabled.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  balanceBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderBottomWidth: 1 },
  balanceItem: { alignItems: 'center' },
  balanceValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  balanceLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderBottomWidth: 1 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 9, fontWeight: '600' },
  list: { paddingVertical: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  tradeCard: { borderRadius: 12, marginHorizontal: 16, marginVertical: 4, borderWidth: 1, padding: 14 },
  tradeOpen: { borderLeftWidth: 3 },
  tradeWin: { borderLeftWidth: 3 },
  tradeLoss: { borderLeftWidth: 3 },
  tradeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dirBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  dirText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  tradeSymbol: { fontSize: 14, fontWeight: '700' },
  tradeStatus: { fontSize: 13, fontWeight: '800' },
  tradeBody: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  metric: { alignItems: 'center' },
  metricLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  metricValue: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 2 },
  tradeFooter: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, alignItems: 'center' },
  profit: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  noteSection: { marginTop: 8, paddingTop: 6, borderTopWidth: 1 },
  noteEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteInput: { flex: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, borderWidth: 1 },
  noteSave: { fontSize: 13, fontWeight: '700' },
  notePlaceholder: { fontSize: 12, fontWeight: '500' },
});

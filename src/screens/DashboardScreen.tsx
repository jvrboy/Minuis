import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { SYMBOL_NAMES, TIMEFRAMES } from '../constants';
import { useColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import MarketSessions from '../components/MarketSessions';

export default function DashboardScreen({ navigation }: any) {
  const COLORS = useColors();
  const { activeSignals, signalHistory, trades, portfolio, connection, settings, lastTick } = useStore();

  const stats = useMemo(() => {
    const totalSignals = signalHistory.length;
    const wins = signalHistory.filter((s) => s.status === 'HIT_TP').length;
    const losses = signalHistory.filter((s) => s.status === 'HIT_SL').length;
    const winRate = totalSignals > 0 ? (wins / totalSignals) * 100 : 0;

    let bestStreak = 0, currentStreak = 0, bestLossStreak = 0, currentLossStreak = 0;
    for (const s of signalHistory) {
      if (s.status === 'HIT_TP') {
        currentStreak++;
        currentLossStreak = 0;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else if (s.status === 'HIT_SL') {
        currentLossStreak++;
        currentStreak = 0;
        if (currentLossStreak > bestLossStreak) bestLossStreak = currentLossStreak;
      }
    }

    const closedTrades = trades.filter((t) => t.status !== 'OPEN');
    const profitableTrades = closedTrades.filter((t) => (t.profit || 0) > 0);
    const losingTrades = closedTrades.filter((t) => (t.profit || 0) <= 0);
    const bestTrade = profitableTrades.length > 0 ? Math.max(...profitableTrades.map((t) => t.profit || 0)) : 0;
    const worstTrade = losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.profit || 0)) : 0;

    return { totalSignals, wins, losses, winRate: Math.round(winRate), bestStreak, bestLossStreak, bestTrade, worstTrade, totalTrades: closedTrades.length };
  }, [signalHistory, trades]);

  const nextEvent = useMemo(() => {
    try {
      const { getUpcomingEvents } = require('../engine/newsFilter');
      const events = getUpcomingEvents(5);
      return events[0] || null;
    } catch { return null; }
  }, []);

  const recentSignals = activeSignals.slice(0, 3);
  const openTradesCount = trades.filter((t) => t.status === 'OPEN').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgPrimary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.topBar, { borderBottomColor: COLORS.border }]}>
          <Text style={[styles.title, { color: COLORS.textPrimary }]}>Minuis</Text>
          <View style={styles.connectionRow}>
            <View style={[styles.dot, { backgroundColor: connection.connected ? COLORS.accentGreen : COLORS.accentRed }]} />
            <Text style={[styles.connectionText, { color: COLORS.textMuted }]}>
              {connection.connected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.balanceRow}>
          <View style={styles.balanceCard}>
            <Text style={[styles.balanceLabel, { color: COLORS.textMuted }]}>Balance</Text>
            <Text style={[styles.balanceValue, { color: COLORS.textPrimary }]}>
              ${portfolio.balance.toFixed(2)}
            </Text>
            <Text style={[styles.pnlText, { color: portfolio.totalPnL >= 0 ? COLORS.accentGreen : COLORS.accentRed }]}>
              {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL.toFixed(2)} total
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
            <Ionicons name="pulse" size={20} color={COLORS.accentBlue} />
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{activeSignals.length}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textMuted }]}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
            <Ionicons name="wallet" size={20} color={COLORS.accentGreen} />
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{openTradesCount}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textMuted }]}>Open Trades</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.accentGreen} />
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.winRate}%</Text>
            <Text style={[styles.statLabel, { color: COLORS.textMuted }]}>Win Rate</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
            <Ionicons name="bar-chart" size={20} color={COLORS.accentPurple} />
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.totalSignals}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textMuted }]}>Signals</Text>
          </View>
        </View>

        <View style={styles.extraStats}>
          <View style={[styles.extraStat, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
            <Text style={[styles.extraValue, { color: COLORS.accentGreen }]}>{stats.bestStreak}</Text>
            <Text style={[styles.extraLabel, { color: COLORS.textMuted }]}>Win Streak</Text>
          </View>
          <View style={[styles.extraStat, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
            <Text style={[styles.extraValue, { color: COLORS.accentRed }]}>{stats.bestLossStreak}</Text>
            <Text style={[styles.extraLabel, { color: COLORS.textMuted }]}>Loss Streak</Text>
          </View>
          <View style={[styles.extraStat, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
            <Text style={[styles.extraValue, { color: COLORS.accentGreen }]}>+{stats.bestTrade.toFixed(0)}</Text>
            <Text style={[styles.extraLabel, { color: COLORS.textMuted }]}>Best Trade</Text>
          </View>
          <View style={[styles.extraStat, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
            <Text style={[styles.extraValue, { color: COLORS.accentRed }]}>{stats.worstTrade.toFixed(0)}</Text>
            <Text style={[styles.extraLabel, { color: COLORS.textMuted }]}>Worst Trade</Text>
          </View>
        </View>

        <MarketSessions />

        {nextEvent && (
          <TouchableOpacity style={[styles.eventCard, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border, borderLeftColor: COLORS.accentRed }]} onPress={() => navigation?.navigate?.('Calendar')}>
            <View style={styles.eventContent}>
              <View>
                <Text style={[styles.eventLabel, { color: COLORS.textMuted }]}>Next Economic Event</Text>
                <Text style={[styles.eventTitle, { color: COLORS.textPrimary }]}>{nextEvent.title}</Text>
                <Text style={[styles.eventTime, { color: COLORS.textMuted }]}>
                  {new Date(nextEvent.time).toLocaleDateString()} {new Date(nextEvent.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[styles.impactBadge, { backgroundColor: COLORS.redDim }]}>
                <Text style={[styles.impactText, { color: COLORS.accentRed }]}>{nextEvent.impact}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: COLORS.textSecondary }]}>Recent Signals</Text>
          <TouchableOpacity onPress={() => navigation?.navigate?.('Signals')}>
            <Text style={[styles.seeAll, { color: COLORS.accentBlue }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentSignals.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
            <Ionicons name="pulse-outline" size={24} color={COLORS.textMuted} />
            <Text style={[styles.emptyText, { color: COLORS.textMuted }]}>No active signals</Text>
          </View>
        ) : (
          recentSignals.map((sig) => (
            <View key={sig.id} style={[styles.signalRow, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border, borderLeftColor: sig.direction === 'BUY' ? COLORS.accentGreen : COLORS.accentRed }]}>
              <View style={[styles.dirBadge, { backgroundColor: sig.direction === 'BUY' ? COLORS.accentGreen : COLORS.accentRed }]}>
                <Text style={styles.dirText}>{sig.direction}</Text>
              </View>
              <Text style={[styles.signalSymbol, { color: COLORS.textPrimary }]}>{SYMBOL_NAMES[sig.symbol] || sig.symbol}</Text>
              <Text style={[styles.signalConf, { color: sig.confidence >= 80 ? COLORS.accentGreen : sig.confidence >= 65 ? COLORS.accentBlue : COLORS.accentYellow }]}>{sig.confidence}%</Text>
            </View>
          ))
        )}

        <View style={styles.quickLinks}>
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]} onPress={() => navigation?.navigate?.('Portfolio')}>
            <Ionicons name="wallet" size={18} color={COLORS.accentBlue} />
            <Text style={[styles.quickText, { color: COLORS.textPrimary }]}>Portfolio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]} onPress={() => navigation?.navigate?.('Backtest')}>
            <Ionicons name="analytics" size={18} color={COLORS.accentBlue} />
            <Text style={[styles.quickText, { color: COLORS.textPrimary }]}>Backtest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]} onPress={() => navigation?.navigate?.('Settings')}>
            <Ionicons name="settings" size={18} color={COLORS.accentBlue} />
            <Text style={[styles.quickText, { color: COLORS.textPrimary }]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 30 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  connectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  connectionText: { fontSize: 12, fontWeight: '500' },
  balanceRow: { paddingHorizontal: 16, paddingTop: 16 },
  balanceCard: { borderRadius: 14, padding: 20 },
  balanceLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceValue: { fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: 4 },
  pnlText: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  statCard: { borderRadius: 12, borderWidth: 1, padding: 14, minWidth: '46%', flex: 1, gap: 4 },
  statValue: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  eventCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 12, borderWidth: 1, borderLeftWidth: 3, padding: 14 },
  eventContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  eventTitle: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  eventTime: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  impactBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  impactText: { fontSize: 10, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  seeAll: { fontSize: 13, fontWeight: '600' },
  emptyBox: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 13, fontWeight: '500' },
  signalRow: { marginHorizontal: 16, marginVertical: 3, borderRadius: 10, borderWidth: 1, borderLeftWidth: 3, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dirBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  dirText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  signalSymbol: { fontSize: 14, fontWeight: '700', flex: 1 },
  signalConf: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  quickLinks: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  extraStats: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, gap: 6 },
  extraStat: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center', gap: 2 },
  extraValue: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  extraLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  quickBtn: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  quickText: { fontSize: 12, fontWeight: '600' },
});

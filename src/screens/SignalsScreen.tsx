import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { derivApi } from '../services/derivApi';
import { runSignalEngine } from '../engine/signals';
import { COLORS, SYMBOL_NAMES, CANDLE_INTERVAL_MAP } from '../constants';
import SignalCard from '../components/SignalCard';
import type { Signal, Timeframe } from '../types';

function ConnectionDot({ connected }: { connected: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (connected) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [connected, pulse]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: connected ? COLORS.accentGreen : COLORS.accentRed,
          opacity: connected ? pulse : 1,
        },
      ]}
    />
  );
}

function SummaryBar({ signals }: { signals: Signal[] }) {
  const buySignals = signals.filter((s) => s.direction === 'BUY');
  const sellSignals = signals.filter((s) => s.direction === 'SELL');
  const highConf = signals.filter((s) => s.confidence >= 80).length;

  return (
    <View style={styles.summaryBar}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{signals.length}</Text>
        <Text style={styles.summaryLabel}>TOTAL</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryValue, { color: COLORS.accentGreen }]}>
          {buySignals.length}
        </Text>
        <Text style={styles.summaryLabel}>BUY</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryValue, { color: COLORS.accentRed }]}>
          {sellSignals.length}
        </Text>
        <Text style={styles.summaryLabel}>SELL</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryValue, { color: COLORS.accentBlue }]}>
          {highConf}
        </Text>
        <Text style={styles.summaryLabel}>HIGH</Text>
      </View>
    </View>
  );
}

type FilterDir = 'ALL' | 'BUY' | 'SELL';

export default function SignalsScreen() {
  const { activeSignals, connection, settings, setConnection, setCandles, setCandlesMulti } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [filterDir, setFilterDir] = useState<FilterDir>('ALL');
  const [filterSymbol, setFilterSymbol] = useState<string>('ALL');
  const engineInterval = useRef<ReturnType<typeof setInterval>>();

  const connectAndSubscribe = useCallback(async () => {
    try {
      await derivApi.connect();
      for (const symbol of settings.symbols) {
        await derivApi.subscribeTicks(symbol);
        const candles = await derivApi.fetchCandles(symbol, settings.timeframe);
        if (candles.length > 0) {
          setCandles(symbol, candles);
        }
        await derivApi.subscribeCandles(symbol, settings.timeframe);

        if (settings.multiTimeframeEnabled) {
          for (const tf of settings.multiTimeframes) {
            if (tf === settings.timeframe) continue;
            const tfCandles = await derivApi.fetchCandles(symbol, tf);
            if (tfCandles.length > 0) {
              setCandlesMulti(symbol, tf, tfCandles);
            }
          }
        }
      }
      setConnection({ connected: true });
    } catch {
      setConnection({ connected: false });
    } finally {
      setInitializing(false);
    }
  }, [settings.symbols, settings.timeframe, settings.multiTimeframeEnabled, settings.multiTimeframes, setCandles, setCandlesMulti, setConnection]);

  useEffect(() => {
    connectAndSubscribe();

    return () => {
      if (engineInterval.current) clearInterval(engineInterval.current);
    };
  }, [connectAndSubscribe]);

  useEffect(() => {
    if (connection.connected) {
      engineInterval.current = setInterval(() => {
        runSignalEngine();
      }, 15000);
    }
    return () => {
      if (engineInterval.current) clearInterval(engineInterval.current);
    };
  }, [connection.connected]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await connectAndSubscribe();
    runSignalEngine();
    setRefreshing(false);
  }, [connectAndSubscribe]);

  const handleCloseSignal = useCallback(
    (id: string) => {
      const sig = activeSignals.find((s) => s.id === id);
      if (sig) useStore.getState().archiveSignal(sig);
    },
    [activeSignals]
  );

  const renderSignal = useCallback(
    ({ item }: { item: Signal }) => <SignalCard signal={item} onClose={handleCloseSignal} />,
    [handleCloseSignal]
  );

  if (initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
          <Text style={styles.loadingText}>Connecting to Deriv API...</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={connectAndSubscribe}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Minuis</Text>
          <ConnectionDot connected={connection.connected} />
        </View>
        <Text style={styles.subtitle}>
          {connection.connected
            ? `${settings.symbols.map((s) => SYMBOL_NAMES[s] || s).join(', ')}`
            : 'Disconnected'}
        </Text>
      </View>

      <SummaryBar signals={activeSignals} />

      <View style={styles.filterRow}>
        {(['ALL', 'BUY', 'SELL'] as FilterDir[]).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, { backgroundColor: COLORS.bgActive }, filterDir === f && { backgroundColor: COLORS.accentBlue }]} onPress={() => setFilterDir(f)}>
            <Text style={[styles.filterText, { color: COLORS.textSecondary }, filterDir === f && { color: '#fff' }]}>{f === 'ALL' ? 'All' : f}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: COLORS.bgActive }, filterSymbol !== 'ALL' && { backgroundColor: COLORS.accentPurple }]} onPress={() => setFilterSymbol(filterSymbol === 'ALL' ? settings.symbols[0] || 'frxEURUSD' : 'ALL')}>
          <Text style={[styles.filterText, { color: COLORS.textSecondary }, filterSymbol !== 'ALL' && { color: '#fff' }]}>{filterSymbol === 'ALL' ? 'All Pairs' : SYMBOL_NAMES[filterSymbol] || filterSymbol}</Text>
        </TouchableOpacity>
      </View>

      {!connection.connected && (
        <View style={styles.disconnectedBanner}>
          <Text style={styles.disconnectedText}>
            Disconnected from Deriv API. Pull to retry.
          </Text>
        </View>
      )}

      <FlatList
        data={activeSignals.filter((s) => {
          if (filterDir !== 'ALL' && s.direction !== filterDir) return false;
          if (filterSymbol !== 'ALL' && s.symbol !== filterSymbol) return false;
          return true;
        })}
        keyExtractor={(item) => item.id}
        renderItem={renderSignal}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accentBlue}
            colors={[COLORS.accentBlue]}
          />
        }
        contentContainerStyle={activeSignals.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Active Signals</Text>
            <Text style={styles.emptyText}>
              Waiting for market conditions to align.{'\n'}New signals will appear here automatically.
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.bgActive,
    borderRadius: 8,
  },
  retryBtnText: {
    color: COLORS.accentBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  filterText: { fontSize: 11, fontWeight: '600' },
  disconnectedBanner: {
    backgroundColor: COLORS.redDim,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  disconnectedText: {
    color: COLORS.accentRed,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
});

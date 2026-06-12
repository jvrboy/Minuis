import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useColors } from '../theme/colors';
import { useStore } from '../store/useStore';

interface Alert {
  id: string;
  message: string;
  type: 'signal' | 'trade' | 'event' | 'info';
}

export default function AlertBanner() {
  const COLORS = useColors();
  const { activeSignals, trades } = useStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const prevSignalCount = useRef(0);
  const prevTradeCount = useRef(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const currentAlert = alerts[0];

  useEffect(() => {
    const newAlerts: Alert[] = [];
    if (activeSignals.length > prevSignalCount.current) {
      const latest = activeSignals[0];
      newAlerts.push({ id: `sig_${latest.id}`, message: `${latest.direction} ${latest.symbol} at ${latest.confidence}%`, type: 'signal' });
    }
    if (trades.length > prevTradeCount.current) {
      const latest = trades[trades.length - 1];
      if (latest.status !== 'OPEN') {
        newAlerts.push({ id: `trade_${latest.id}`, message: `Trade closed: ${latest.symbol} ${latest.profit && latest.profit >= 0 ? '+' : ''}${latest.profit?.toFixed(2)}`, type: 'trade' });
      }
    }
    prevSignalCount.current = activeSignals.length;
    prevTradeCount.current = trades.length;

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 5));
    }
  }, [activeSignals.length, trades.length]);

  useEffect(() => {
    if (currentAlert) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setAlerts((prev) => prev.slice(1));
      });
    }
  }, [currentAlert?.id]);

  if (!currentAlert) return null;

  const colors: Record<string, string> = {
    signal: COLORS.accentBlue,
    trade: COLORS.accentGreen,
    event: COLORS.accentRed,
    info: COLORS.textMuted,
  };

  return (
    <Animated.View style={[styles.banner, { backgroundColor: colors[currentAlert.type] + '22', borderColor: colors[currentAlert.type], opacity: fadeAnim }]}>
      <Text style={[styles.text, { color: colors[currentAlert.type] }]}>{currentAlert.message}</Text>
      <TouchableOpacity onPress={() => setAlerts((prev) => prev.slice(1))}>
        <Text style={[styles.close, { color: COLORS.textMuted }]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  text: { fontSize: 12, fontWeight: '600', flex: 1 },
  close: { fontSize: 14, marginLeft: 8 },
});

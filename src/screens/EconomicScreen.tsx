import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { getUpcomingEvents, getFlag } from '../engine/newsFilter';
import { useColors } from '../theme/colors';

const IMPACT_ORDER: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

function Countdown({ targetTime }: { targetTime: number }) {
  const COLORS = useColors();
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) { setRemaining('NOW'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <Text style={[styles.countdownText, { color: COLORS.accentBlue }]}>{remaining}</Text>
  );
}

export default function EconomicScreen() {
  const COLORS = useColors();
  const events = getUpcomingEvents(30);

  const now = Date.now();
  const nearest = events.length > 0 ? events[0] : null;
  const nearestImpact = nearest ? IMPACT_ORDER[nearest.impact] || 0 : 0;

  const grouped = events.reduce((acc: Record<string, typeof events>, ev) => {
    const date = new Date(ev.time).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(ev);
    return acc;
  }, {});

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgPrimary }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: COLORS.border }]}>
        <Text style={[styles.title, { color: COLORS.textPrimary }]}>Economic Calendar</Text>
        <Text style={[styles.subtitle, { color: COLORS.textMuted }]}>High-impact events that may affect signals</Text>
      </View>

      {nearest && (
        <View style={[styles.nextEventBar, { backgroundColor: COLORS.bgCard, borderBottomColor: COLORS.border }]}>
          <View style={styles.nextEventContent}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nextLabel, { color: COLORS.textMuted }]}>Next Event</Text>
              <Text style={[styles.nextTitle, { color: COLORS.textPrimary }]}>{nearest.title}</Text>
              <View style={styles.nextMeta}>
                <Text style={[styles.nextCurrency, { color: COLORS.textMuted }]}>{getFlag(nearest.country)} {nearest.currency}</Text>
                <View style={[styles.impactBadgeSmall, { backgroundColor: nearestImpact >= 3 ? COLORS.redDim : nearestImpact >= 2 ? COLORS.yellowDim : COLORS.blueDim }]}>
                  <Text style={[styles.impactTextSmall, { color: nearestImpact >= 3 ? COLORS.accentRed : nearestImpact >= 2 ? COLORS.accentYellow : COLORS.textMuted }]}>{nearest.impact}</Text>
                </View>
              </View>
            </View>
            <Countdown targetTime={nearest.time} />
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {Object.entries(grouped).map(([date, dateEvents]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={[styles.dateHeader, { color: COLORS.textMuted }]}>{date}</Text>
            {dateEvents.map((ev) => (
              <View key={ev.id} style={[styles.eventCard, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
                <View style={styles.eventMain}>
                  <View style={styles.eventLeft}>
                    <Text style={styles.flag}>{getFlag(ev.country)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.eventTitle, { color: COLORS.textPrimary }]}>{ev.title}</Text>
                      <Text style={[styles.eventCurrency, { color: COLORS.textMuted }]}>{ev.currency} • {ev.country}</Text>
                    </View>
                  </View>
                  <View style={styles.eventRight}>
                    <View style={[styles.impactBadge, { backgroundColor: IMPACT_ORDER[ev.impact] >= 3 ? COLORS.redDim : IMPACT_ORDER[ev.impact] >= 2 ? COLORS.yellowDim : COLORS.blueDim }]}>
                      <Text style={[styles.impactText, { color: IMPACT_ORDER[ev.impact] >= 3 ? COLORS.accentRed : IMPACT_ORDER[ev.impact] >= 2 ? COLORS.accentYellow : COLORS.textMuted }]}>{ev.impact}</Text>
                    </View>
                    <Text style={[styles.eventTime, { color: COLORS.textMuted }]}>
                      {new Date(ev.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {ev.time - now > 0 && ev.time - now < 86400000 && (
                      <Countdown targetTime={ev.time} />
                    )}
                  </View>
                </View>
                {(ev.forecast || ev.previous) && (
                  <View style={[styles.eventData, { borderTopColor: COLORS.border }]}>
                    {ev.forecast && <Text style={[styles.dataText, { color: COLORS.textSecondary }]}>Forecast: {ev.forecast}</Text>}
                    {ev.previous && <Text style={[styles.dataText, { color: COLORS.textSecondary }]}>Previous: {ev.previous}</Text>}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  nextEventBar: { borderBottomWidth: 1, padding: 14 },
  nextEventContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  nextTitle: { fontSize: 16, fontWeight: '700', marginTop: 1 },
  nextMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  nextCurrency: { fontSize: 12, fontWeight: '500' },
  impactBadgeSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  impactTextSmall: { fontSize: 9, fontWeight: '800' },
  countdownText: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  scroll: { paddingBottom: 40 },
  dateGroup: { marginTop: 16 },
  dateHeader: { fontSize: 12, fontWeight: '700', paddingHorizontal: 20, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  eventCard: { marginHorizontal: 16, marginVertical: 3, borderRadius: 10, borderWidth: 1, padding: 14 },
  eventMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  flag: { fontSize: 20 },
  eventTitle: { fontSize: 14, fontWeight: '600' },
  eventCurrency: { fontSize: 11, marginTop: 2 },
  eventRight: { alignItems: 'flex-end', gap: 4 },
  impactBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  impactText: { fontSize: 9, fontWeight: '800' },
  eventTime: { fontSize: 11, fontWeight: '500' },
  eventData: { flexDirection: 'row', gap: 16, marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  dataText: { fontSize: 11, fontWeight: '500' },
});

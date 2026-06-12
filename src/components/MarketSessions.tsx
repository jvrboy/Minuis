import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../theme/colors';
import { getActiveSessions, FOREX_SESSIONS } from '../utils/marketHours';

export default function MarketSessions() {
  const COLORS = useColors();
  const [sessions, setSessions] = useState(getActiveSessions());

  useEffect(() => {
    const interval = setInterval(() => setSessions(getActiveSessions()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
      <Text style={[styles.title, { color: COLORS.textMuted }]}>Market Sessions</Text>
      <View style={styles.grid}>
        {sessions.map((s) => {
          const isOpen = s.minutesUntilClose > 0;
          return (
            <View key={s.session.name} style={[styles.session, { backgroundColor: isOpen ? COLORS.greenDim : COLORS.bgActive }]}>
              <View style={[styles.dot, { backgroundColor: isOpen ? COLORS.accentGreen : COLORS.textMuted }]} />
              <Text style={[styles.name, { color: COLORS.textPrimary }]}>{s.session.abbr}</Text>
              <Text style={[styles.status, { color: isOpen ? COLORS.accentGreen : COLORS.textMuted }]}>
                {isOpen ? `${Math.floor(s.minutesUntilClose / 60)}h` : `${Math.floor(s.minutesUntilOpen / 60)}h`}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 14, borderRadius: 12, borderWidth: 1, padding: 14 },
  title: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  grid: { flexDirection: 'row', gap: 6 },
  session: { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  name: { fontSize: 11, fontWeight: '700' },
  status: { fontSize: 9, fontWeight: '600' },
});

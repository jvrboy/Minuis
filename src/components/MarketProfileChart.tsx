import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../theme/colors';
import type { Candle } from '../types';
import { computeMarketProfile } from '../engine/indicators';

interface Props {
  yesterdayCandles: Candle[];
  todayCandles: Candle[];
  currentPrice: number;
  symbol: string;
}

function ProfileBar({ poc, val, vah, price, maxVol, label, color }: {
  poc: number; val: number; vah: number; price: number; maxVol: number; label: string; color: string;
}) {
  const COLORS = useColors();
  const range = vah - val || 0.0001;
  const pocPos = ((poc - val) / range) * 100;
  const valPos = 0;
  const vahPos = 100;
  const pricePos = ((price - val) / range) * 100;

  return (
    <View style={styles.profileCol}>
      <Text style={[styles.profileLabel, { color: COLORS.textMuted }]}>{label}</Text>
      <View style={[styles.profileBar, { backgroundColor: COLORS.bgActive, borderColor: COLORS.border }]}>
        <View style={[styles.vaRange, {
          top: `${valPos}%`, height: `${vahPos - valPos}%`,
          borderColor: color,
        }]} />
        <View style={[styles.pocLine, {
          top: `${pocPos}%`,
          backgroundColor: color,
        }]} />
        <View style={[styles.priceDot, {
          top: `${Math.max(0, Math.min(100, pricePos))}%`,
          borderColor: COLORS.textPrimary,
        }]} />
      </View>
      <Text style={[styles.priceLabel, { color: COLORS.textSecondary }]}>POC: {poc.toFixed(5)}</Text>
      <Text style={[styles.priceLabel, { color: COLORS.accentGreen }]}>VAH: {vah.toFixed(5)}</Text>
      <Text style={[styles.priceLabel, { color: COLORS.accentRed }]}>VAL: {val.toFixed(5)}</Text>
    </View>
  );
}

export default function MarketProfileChart({ yesterdayCandles, todayCandles, currentPrice, symbol }: Props) {
  const COLORS = useColors();

  const yesterdayMP = useMemo(() => {
    if (yesterdayCandles.length < 10) return null;
    return computeMarketProfile(yesterdayCandles);
  }, [yesterdayCandles]);

  const todayMP = useMemo(() => {
    if (todayCandles.length < 5) return null;
    return computeMarketProfile(todayCandles);
  }, [todayCandles]);

  if (!yesterdayMP && !todayMP) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
        <Text style={[styles.emptyText, { color: COLORS.textMuted }]}>Insufficient data for Market Profile</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.textPrimary }]}>Market Profile</Text>
        <Text style={[styles.symbol, { color: COLORS.textMuted }]}>{symbol}</Text>
      </View>
      <View style={styles.profilesRow}>
        <View style={styles.profileSection}>
          <Text style={[styles.sectionTitle, { color: COLORS.textSecondary }]}>Yesterday</Text>
          {yesterdayMP ? (
            <ProfileBar
              poc={yesterdayMP.poc}
              val={yesterdayMP.val}
              vah={yesterdayMP.vah}
              price={currentPrice}
              maxVol={yesterdayMP.tpoCount}
              label="D-1"
              color={COLORS.accentBlue}
            />
          ) : (
            <Text style={[styles.noData, { color: COLORS.textMuted }]}>No data</Text>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.profileSection}>
          <Text style={[styles.sectionTitle, { color: COLORS.textSecondary }]}>Today</Text>
          {todayMP ? (
            <ProfileBar
              poc={todayMP.poc}
              val={todayMP.val}
              vah={todayMP.vah}
              price={currentPrice}
              maxVol={todayMP.tpoCount}
              label="D0"
              color={COLORS.accentOrange}
            />
          ) : (
            <Text style={[styles.noData, { color: COLORS.textMuted }]}>Building...</Text>
          )}
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.accentBlue }]} /><Text style={[styles.legendText, { color: COLORS.textMuted }]}>POC</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendLine, { borderColor: COLORS.accentGreen }]} /><Text style={[styles.legendText, { color: COLORS.textMuted }]}>VAH</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendLine, { borderColor: COLORS.accentRed }]} /><Text style={[styles.legendText, { color: COLORS.textMuted }]}>VAL</Text></View>
        <View style={styles.legendItem}><View style={[styles.priceDotSmall, { borderColor: COLORS.textPrimary }]} /><Text style={[styles.legendText, { color: COLORS.textMuted }]}>Price</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginHorizontal: 16, marginTop: 14,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '700' },
  symbol: { fontSize: 12, fontWeight: '500' },
  profilesRow: { flexDirection: 'row', justifyContent: 'space-around', minHeight: 200 },
  profileSection: { flex: 1, alignItems: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  divider: { width: 1, backgroundColor: '#30363D', marginHorizontal: 8 },
  profileCol: { alignItems: 'center', width: '100%' },
  profileLabel: { fontSize: 9, fontWeight: '600', marginBottom: 4 },
  profileBar: { width: 40, height: 160, borderRadius: 6, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  vaRange: { position: 'absolute', left: 0, right: 0, borderLeftWidth: 2, borderRightWidth: 2, opacity: 0.3 },
  pocLine: { position: 'absolute', left: 0, right: 0, height: 2 },
  priceDot: { position: 'absolute', left: -3, right: -3, height: 6, borderRadius: 3, borderWidth: 1.5 },
  priceLabel: { fontSize: 9, fontWeight: '600', marginTop: 2, fontVariant: ['tabular-nums'] },
  noData: { fontSize: 12, marginTop: 60 },
  emptyText: { fontSize: 13, textAlign: 'center', padding: 20 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#30363D' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLine: { width: 12, height: 2, borderTopWidth: 2 },
  priceDotSmall: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
});

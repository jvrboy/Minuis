import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { useColors } from '../theme/colors';
import type { Candle } from '../types';

interface SRLevel {
  price: number;
  label?: string;
}

interface TrendLine {
  x1: number; y1: number;
  x2: number; y2: number;
}

interface Props {
  candles: Candle[];
  width?: number;
  height?: number;
  showVolume?: boolean;
  srLevels?: SRLevel[];
  trendLines?: TrendLine[];
}

function formatPrice(p: number): string {
  return p.toFixed(5);
}

export default function CandlestickChart({ candles, width: w, height: h, showVolume, srLevels, trendLines }: Props) {
  const COLORS = useColors();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = w || screenWidth - 32;
  const chartHeight = h || 220;
  const candleWidth = Math.max(2, (chartWidth - 20) / Math.max(candles.length, 1));
  const volumeHeight = showVolume ? 40 : 0;

  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      setCrosshair({ x: gs.moveX, y: gs.moveY });
    },
    onPanResponderRelease: () => setCrosshair(null),
  }), []);

  const { high, low, minV, maxV } = useMemo(() => {
    if (candles.length === 0) return { high: 0, low: 0, minV: 0, maxV: 0 };
    let hh = -Infinity, ll = Infinity, minVol = Infinity, maxVol = 0;
    for (const c of candles) {
      if (c.high > hh) hh = c.high;
      if (c.low < ll) ll = c.low;
      if (c.volume > maxVol) maxVol = c.volume;
      if (c.volume < minVol) minVol = c.volume;
    }

    if (srLevels && srLevels.length > 0) {
      for (const sr of srLevels) {
        if (sr.price > hh) hh = sr.price;
        if (sr.price < ll) ll = sr.price;
      }
    }
    if (trendLines && trendLines.length > 0) {
      for (const tl of trendLines) {
        if (tl.y1 > hh) hh = tl.y1;
        if (tl.y1 < ll) ll = tl.y1;
        if (tl.y2 > hh) hh = tl.y2;
        if (tl.y2 < ll) ll = tl.y2;
      }
    }

    const pad = (hh - ll) * 0.05 || 0.0001;
    return { high: hh + pad, low: ll - pad, minV: minVol, maxV: maxVol };
  }, [candles, srLevels, trendLines]);

  const priceRange = high - low || 0.0001;
  const scaleY = (price: number) => chartHeight - ((price - low) / priceRange) * chartHeight;
  const scaleVol = (v: number) => ((v - minV) / (maxV - minV || 1)) * volumeHeight;

  const gridLines = useMemo(() => {
    const lines: number[] = [];
    for (let i = 0; i <= 4; i++) {
      lines.push(low + (priceRange * i) / 4);
    }
    return lines;
  }, [low, priceRange]);

  const crosshairCandle = useMemo(() => {
    if (!crosshair) return null;
    const idx = Math.min(Math.max(Math.floor((crosshair.x - 16) / candleWidth), 0), candles.length - 1);
    return candles[idx];
  }, [crosshair, candles, candleWidth]);

  const computedSR = useMemo(() => {
    if (srLevels) return srLevels;
    if (candles.length < 20) return [];
    const closes = candles.map((c) => c.close);
    const levels: SRLevel[] = [];
    const freq = new Map<number, number>();
    for (const c of closes) {
      const rounded = Math.round(c / 0.001) * 0.001;
      freq.set(rounded, (freq.get(rounded) || 0) + 1);
    }
    const threshold = Math.max(3, Math.floor(candles.length * 0.08));
    freq.forEach((count, price) => {
      if (count >= threshold) {
        levels.push({ price });
      }
    });
    return levels.slice(0, 5);
  }, [candles, srLevels]);

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bgSecondary }]}>
      <View style={styles.yAxis}>
        {gridLines.map((p, i) => (
          <Text key={i} style={[styles.yLabel, { top: scaleY(p) - 7, color: COLORS.textMuted }]}>
            {formatPrice(p)}
          </Text>
        ))}
      </View>

      <View style={[styles.chartArea, { width: chartWidth, height: chartHeight + volumeHeight }]} {...panResponder.panHandlers}>
        <View style={{ width: chartWidth, height: chartHeight }}>
          {gridLines.map((p, i) => (
            <View key={i} style={[styles.gridLine, { top: scaleY(p), width: chartWidth, backgroundColor: COLORS.border }]} />
          ))}

          {computedSR.map((sr, i) => {
            const y = scaleY(sr.price);
            return (
              <React.Fragment key={`sr_${i}`}>
                <View style={[styles.srLine, { top: y, width: chartWidth, backgroundColor: COLORS.accentOrange }]} />
                <Text style={[styles.srLabel, { top: y - 8, color: COLORS.accentOrange }]}>
                  {sr.label || formatPrice(sr.price)}
                </Text>
              </React.Fragment>
            );
          })}

          {trendLines?.map((tl, i) => (
            <View key={`tl_${i}`} style={[styles.trendLine, {
              left: 0,
              top: 0,
              width: chartWidth,
              height: chartHeight,
            }]}>
              <View style={[styles.trendLineInner, {
                backgroundColor: COLORS.accentCyan,
                transform: [
                  { translateX: tl.x1 },
                  { translateY: tl.y1 },
                  { rotate: `${Math.atan2(tl.y2 - tl.y1, tl.x2 - tl.x1)}rad` },
                ],
                width: Math.sqrt((tl.x2 - tl.x1) ** 2 + (tl.y2 - tl.y1) ** 2),
                height: 1,
              }]} />
            </View>
          ))}

          {candles.map((c, i) => {
            const x = i * candleWidth + 2;
            const isUp = c.close >= c.open;
            const color = isUp ? COLORS.candleUp : COLORS.candleDown;
            const openY = scaleY(c.open);
            const closeY = scaleY(c.close);
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1);

            return (
              <React.Fragment key={i}>
                <View style={[styles.wick, {
                  left: x + candleWidth / 2 - 0.5,
                  top: scaleY(c.high),
                  height: scaleY(c.low) - scaleY(c.high),
                  backgroundColor: color,
                }]} />
                <View style={[styles.candle, {
                  left: x,
                  top: bodyTop,
                  width: Math.max(3, candleWidth - 2),
                  height: bodyHeight,
                  backgroundColor: color,
                }]} />
                {showVolume && (
                  <View style={[styles.volume, {
                    left: x,
                    top: chartHeight + volumeHeight - scaleVol(c.volume),
                    width: Math.max(2, candleWidth - 2),
                    height: scaleVol(c.volume),
                    backgroundColor: isUp ? COLORS.greenDim : COLORS.redDim,
                  }]} />
                )}
              </React.Fragment>
            );
          })}

          {crosshair && (
            <View style={[styles.crosshairLine, { left: crosshair.x - 16, height: chartHeight, backgroundColor: COLORS.accentBlue }]} />
          )}
        </View>

        {crosshairCandle && (
          <View style={[styles.tooltip, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
            <Text style={[styles.tooltipText, { color: COLORS.textPrimary }]}>
              O:{crosshairCandle.open.toFixed(5)} H:{crosshairCandle.high.toFixed(5)} L:{crosshairCandle.low.toFixed(5)} C:{crosshairCandle.close.toFixed(5)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: 10, padding: 6 },
  yAxis: { width: 60, position: 'relative' },
  yLabel: { position: 'absolute', right: 4, fontSize: 8, fontWeight: '500', fontVariant: ['tabular-nums'] },
  chartArea: { position: 'relative', overflow: 'hidden' },
  gridLine: { position: 'absolute', height: 1, opacity: 0.3 },
  srLine: { position: 'absolute', height: 1, opacity: 0.6 },
  srLabel: { position: 'absolute', fontSize: 7, fontWeight: '600', right: 0 },
  trendLine: { position: 'absolute' },
  trendLineInner: { position: 'absolute', opacity: 0.7 },
  wick: { position: 'absolute', width: 1 },
  candle: { position: 'absolute', borderRadius: 1 },
  volume: { position: 'absolute', borderRadius: 1 },
  crosshairLine: { position: 'absolute', width: 1, opacity: 0.5, top: 0 },
  tooltip: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 4, paddingHorizontal: 8 },
  tooltipText: { fontSize: 9, fontFamily: 'monospace' },
});

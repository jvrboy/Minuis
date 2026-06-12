import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { STRATEGY_PRESETS, COLORS } from '../constants';
import type { StrategyPreset } from '../types';

const slides = [
  {
    title: 'Welcome to Minuis',
    subtitle: 'Advanced Forex Signal Engine',
    desc: 'Real-time multi-indicator analysis powered by Deriv API. Professional-grade trading signals in your pocket.',
  },
  {
    title: 'Smart Signals',
    subtitle: 'High Win Rate Strategy',
    desc: 'Combines MACD, RSI, ERMA, Stochastic, Bollinger Bands, Ichimoku Cloud, and Market Profile for high-confluence signals.',
  },
  {
    title: 'Multi-Timeframe',
    subtitle: 'See the Bigger Picture',
    desc: 'Analyze across 3 timeframes simultaneously. Only the strongest signals with multi-timeframe confluence get through.',
  },
  {
    title: 'Virtual Trading',
    subtitle: 'Practice Risk-Free',
    desc: 'Start with $10,000 virtual balance. Auto-trade signals, track P&L, and refine your strategy before going live.',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const { setSettings, setOnboardingComplete } = useStore();

  const selectPreset = (preset: StrategyPreset) => {
    const config = STRATEGY_PRESETS[preset];
    setSettings({
      preset,
      minConfidence: config.minConfidence,
      signalCooldownMs: config.signalCooldownMs,
      riskPerTrade: config.riskPerTrade,
      maxOpenTrades: config.maxOpenTrades,
      multiTimeframeEnabled: config.useMultiTimeframe,
      multiTimeframes: config.timeframes,
    });
    setOnboardingComplete(true);
  };

  if (step < slides.length) {
    const s = slides[step];
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.top} />
        <View style={styles.content}>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.subtitle}>{s.subtitle}</Text>
          <Text style={styles.desc}>{s.desc}</Text>
        </View>
        <View style={styles.bottom}>
          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(step + 1)}>
            <Text style={styles.nextText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(slides.length)}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top} />
      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Style</Text>
        <Text style={styles.subtitle}>Select a strategy preset to get started</Text>
        <View style={styles.presets}>
          {(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'SCALPER'] as StrategyPreset[]).map((p) => {
            const config = STRATEGY_PRESETS[p];
            const colors = {
              CONSERVATIVE: COLORS.accentGreen,
              MODERATE: COLORS.accentBlue,
              AGGRESSIVE: COLORS.accentRed,
              SCALPER: COLORS.accentPurple,
            };
            return (
              <TouchableOpacity key={p} style={[styles.presetCard, { borderLeftColor: colors[p] }]} onPress={() => selectPreset(p)}>
                <Text style={[styles.presetName, { color: colors[p] }]}>{config.label}</Text>
                <Text style={styles.presetDesc}>Min conf: {config.minConfidence}% • Cooldown: {config.signalCooldownMs / 60000}m</Text>
                <Text style={styles.presetDesc}>Risk: {config.riskPerTrade}% • Max trades: {config.maxOpenTrades}</Text>
                <Text style={styles.presetDesc}>Timeframes: {config.timeframes.join(', ')}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  top: { flex: 1 },
  content: { flex: 3, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.bgActive },
  dotActive: { backgroundColor: COLORS.accentBlue, width: 24, borderRadius: 4 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: COLORS.accentBlue, fontSize: 14, fontWeight: '600', marginTop: 8 },
  desc: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 16, paddingHorizontal: 10 },
  bottom: { paddingHorizontal: 30, paddingBottom: 40, alignItems: 'center', gap: 12 },
  nextBtn: { backgroundColor: COLORS.accentBlue, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, width: '100%', alignItems: 'center' },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '500' },
  presets: { width: '100%', gap: 10, marginTop: 20 },
  presetCard: { backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3 },
  presetName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  presetDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
});

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { saveSettings, loadSettings } from '../services/storage';
import { derivApi } from '../services/derivApi';
import { autoBacktest } from '../services/autoBacktest';
import { COLORS, SYMBOL_NAMES, TIMEFRAMES, DEFAULT_SYMBOLS, STRATEGY_PRESETS, CATEGORY_SYMBOLS, SYMBOL_CATEGORIES, CATEGORY_COLORS } from '../constants';
import { signalsToCSV, tradesToCSV, shareCSV } from '../services/export';
import type { Timeframe, StrategyPreset } from '../types';

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionDivider} />
    </View>
  );
}

function ToggleRow({ label, value, onToggle, subtitle }: { label: string; value: boolean; onToggle: () => void; subtitle?: string }) {
  return (
    <View style={styles.paramRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.paramLabel}>{label}</Text>
        {subtitle && <Text style={styles.paramSub}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.bgActive, true: COLORS.accentBlue }}
        thumbColor={value ? '#fff' : COLORS.textMuted}
      />
    </View>
  );
}

function SymbolToggle({ symbol, enabled, onToggle }: { symbol: string; enabled: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={[styles.symbolRow, enabled && styles.symbolRowActive]} onPress={onToggle}>
      <Text style={[styles.symbolText, enabled && styles.symbolTextActive]}>{SYMBOL_NAMES[symbol] || symbol}</Text>
      <View style={[styles.checkbox, enabled && styles.checkboxActive]}>
        {enabled && <Text style={styles.checkMark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

function ParamRow({ label, value, onChange, min, max, step, subtitle }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; subtitle?: string;
}) {
  return (
    <View style={styles.paramRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.paramLabel}>{label}</Text>
        {subtitle && <Text style={styles.paramSub}>{subtitle}</Text>}
      </View>
      <View style={styles.paramControl}>
        <TouchableOpacity style={styles.paramBtn} onPress={() => onChange(Math.max(min, value - step))}>
          <Text style={styles.paramBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.paramValue}>{value}</Text>
        <TouchableOpacity style={styles.paramBtn} onPress={() => onChange(Math.min(max, value + step))}>
          <Text style={styles.paramBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, setSettings, connection, signalHistory, trades } = useStore();
  const [minConfStr, setMinConfStr] = useState(String(settings.minConfidence));
  const [balanceStr, setBalanceStr] = useState(String(settings.virtualBalance));
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setMinConfStr(String(s.minConfidence));
      setBalanceStr(String(s.virtualBalance));
    });
  }, [setSettings]);

  useEffect(() => { saveSettings(settings); }, [settings]);

  const toggleSymbol = useCallback((symbol: string) => {
    const enabled = settings.symbols.includes(symbol);
    setSettings({ symbols: enabled ? settings.symbols.filter((s) => s !== symbol) : [...settings.symbols, symbol] });
  }, [settings.symbols, setSettings]);

  const setTimeframe = useCallback((tf: Timeframe) => setSettings({ timeframe: tf }), [setSettings]);

  const applyPreset = useCallback((p: StrategyPreset) => {
    const c = STRATEGY_PRESETS[p];
    setSettings({
      preset: p, minConfidence: c.minConfidence, signalCooldownMs: c.signalCooldownMs,
      riskPerTrade: c.riskPerTrade, maxOpenTrades: c.maxOpenTrades,
      multiTimeframeEnabled: c.useMultiTimeframe, multiTimeframes: c.timeframes,
    });
    setMinConfStr(String(c.minConfidence));
  }, [setSettings]);

  const handleReconnect = useCallback(() => { derivApi.forceReconnect(); }, []);

  const handleExportSignals = useCallback(async () => {
    if (signalHistory.length === 0) return;
    const csv = signalsToCSV(signalHistory);
    await shareCSV(csv, `minuis_signals_${Date.now()}.csv`);
  }, [signalHistory]);

  const handleExportTrades = useCallback(async () => {
    if (trades.length === 0) return;
    const csv = tradesToCSV(trades);
    await shareCSV(csv, `minuis_trades_${Date.now()}.csv`);
  }, [trades]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Connection */}
        <SectionHeader title="Connection" />
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Deriv API</Text>
            <View style={styles.statusRight}>
              <View style={[styles.statusDot, { backgroundColor: connection.connected ? COLORS.accentGreen : COLORS.accentRed }]} />
              <Text style={[styles.statusText, { color: connection.connected ? COLORS.accentGreen : COLORS.accentRed }]}>
                {connection.connected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          {!connection.connected && (
            <TouchableOpacity style={styles.reconnectBtn} onPress={handleReconnect}>
              <Text style={styles.reconnectText}>Reconnect</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.hint}>wss://ws.derivws.com/websockets/v3</Text>
        </View>

        {/* Strategy Preset */}
        <SectionHeader title="Strategy Preset" />
        <View style={styles.card}>
          {(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'SCALPER'] as StrategyPreset[]).map((p) => {
            const c = STRATEGY_PRESETS[p];
            const colors: Record<string, string> = { CONSERVATIVE: COLORS.accentGreen, MODERATE: COLORS.accentBlue, AGGRESSIVE: COLORS.accentRed, SCALPER: COLORS.accentPurple };
            return (
              <TouchableOpacity key={p} style={[styles.presetRow, settings.preset === p && { backgroundColor: colors[p] + '22' }]} onPress={() => applyPreset(p)}>
                <View style={[styles.presetDot, { backgroundColor: colors[p] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.presetName, { color: settings.preset === p ? colors[p] : COLORS.textPrimary }]}>{c.label}</Text>
                  <Text style={styles.presetDetail}>Risk {c.riskPerTrade}% • {c.label === 'Scalper' ? 'Fast' : 'Multi-TF'}</Text>
                </View>
                <View style={[styles.radio, settings.preset === p && { backgroundColor: colors[p], borderColor: colors[p] }]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Symbols */}
        <SectionHeader title="Active Symbols" />
        <View style={styles.card}>
          {SYMBOL_CATEGORIES.map((cat) => {
            const catSymbols = CATEGORY_SYMBOLS[cat] || [];
            const activeCount = catSymbols.filter((s) => settings.symbols.includes(s)).length;
            const isExpanded = expandedCategory === cat;
            return (
              <View key={cat}>
                <TouchableOpacity style={styles.categoryRow} onPress={() => setExpandedCategory(isExpanded ? null : cat)}>
                  <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[cat] || COLORS.accentBlue }]} />
                  <Text style={[styles.categoryName, { color: COLORS.textPrimary }]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                  <Text style={[styles.categoryCount, { color: COLORS.textMuted }]}>{activeCount}/{catSymbols.length}</Text>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
                {isExpanded && catSymbols.map((symbol) => (
                  <SymbolToggle key={symbol} symbol={symbol} enabled={settings.symbols.includes(symbol)} onToggle={() => toggleSymbol(symbol)} />
                ))}
              </View>
            );
          })}
        </View>

        {/* Timeframe */}
        <SectionHeader title="Primary Timeframe" />
        <View style={styles.card}>
          <View style={styles.timeframeRow}>
            {TIMEFRAMES.map((tf) => (
              <TouchableOpacity key={tf} style={[styles.tfBtn, settings.timeframe === tf && styles.tfBtnActive]} onPress={() => setTimeframe(tf)}>
                <Text style={[styles.tfText, settings.timeframe === tf && styles.tfTextActive]}>{tf}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Multi-Timeframe */}
        <SectionHeader title="Multi-Timeframe" />
        <View style={styles.card}>
          <ToggleRow label="Enable Multi-TF" value={settings.multiTimeframeEnabled} onToggle={() => setSettings({ multiTimeframeEnabled: !settings.multiTimeframeEnabled })} subtitle="Analyze across 3 timeframes" />
          <View style={styles.timeframeRow}>
            {['15m', '1h', '4h', '1d'].map((tf) => (
              <TouchableOpacity
                key={tf} style={[styles.tfBtn, settings.multiTimeframes.includes(tf as Timeframe) && styles.tfBtnActive]}
                onPress={() => {
                  const tfs = settings.multiTimeframes.includes(tf as Timeframe)
                    ? settings.multiTimeframes.filter((t) => t !== tf)
                    : [...settings.multiTimeframes, tf as Timeframe].slice(0, 3);
                  setSettings({ multiTimeframes: tfs });
                }}
              >
                <Text style={[styles.tfText, settings.multiTimeframes.includes(tf as Timeframe) && styles.tfTextActive]}>{tf}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* MACD */}
        <SectionHeader title="MACD" />
        <View style={styles.card}>
          <ParamRow label="Fast Period" value={settings.macdFast} onChange={(v) => setSettings({ macdFast: v })} min={5} max={30} step={1} />
          <ParamRow label="Slow Period" value={settings.macdSlow} onChange={(v) => setSettings({ macdSlow: v })} min={15} max={50} step={1} />
          <ParamRow label="Signal Period" value={settings.macdSignal} onChange={(v) => setSettings({ macdSignal: v })} min={3} max={20} step={1} />
        </View>

        {/* RSI */}
        <SectionHeader title="RSI" />
        <View style={styles.card}>
          <ParamRow label="Period" value={settings.rsiPeriod} onChange={(v) => setSettings({ rsiPeriod: v })} min={5} max={30} step={1} />
          <ParamRow label="Overbought" value={settings.rsiOverbought} onChange={(v) => setSettings({ rsiOverbought: v })} min={60} max={90} step={5} />
          <ParamRow label="Oversold" value={settings.rsiOversold} onChange={(v) => setSettings({ rsiOversold: v })} min={10} max={40} step={5} />
        </View>

        {/* Bollinger Bands */}
        <SectionHeader title="Bollinger Bands" />
        <View style={styles.card}>
          <ParamRow label="Period" value={settings.bbPeriod} onChange={(v) => setSettings({ bbPeriod: v })} min={10} max={50} step={1} />
          <ParamRow label="Std Dev" value={settings.bbStdDev} onChange={(v) => setSettings({ bbStdDev: v })} min={1} max={4} step={0.5} />
        </View>

        {/* Stochastic */}
        <SectionHeader title="Stochastic" />
        <View style={styles.card}>
          <ParamRow label="%K Period" value={settings.stochK} onChange={(v) => setSettings({ stochK: v })} min={5} max={30} step={1} />
          <ParamRow label="%D Period" value={settings.stochD} onChange={(v) => setSettings({ stochD: v })} min={2} max={10} step={1} />
          <ParamRow label="Smoothing" value={settings.stochSmooth} onChange={(v) => setSettings({ stochSmooth: v })} min={1} max={10} step={1} />
        </View>

        {/* Signal Settings */}
        <SectionHeader title="Signal Settings" />
        <View style={styles.card}>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Min Confidence (%)</Text>
            <TextInput style={styles.confInput} value={minConfStr} onChangeText={(t) => { setMinConfStr(t); const n = parseInt(t, 10); if (!isNaN(n) && n >= 0 && n <= 100) setSettings({ minConfidence: n }); }} keyboardType="number-pad" maxLength={3} />
          </View>
          <ParamRow label="Cooldown (min)" value={Math.round(settings.signalCooldownMs / 60000)} onChange={(v) => setSettings({ signalCooldownMs: v * 60000 })} min={1} max={30} step={1} />
        </View>

        {/* Virtual Trading */}
        <SectionHeader title="Virtual Trading" />
        <View style={styles.card}>
          <ToggleRow label="Enable Virtual Trading" value={settings.virtualTrading} onToggle={() => setSettings({ virtualTrading: !settings.virtualTrading })} subtitle="Auto-trade signals with virtual account" />
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Starting Balance ($)</Text>
            <TextInput style={styles.confInput} value={balanceStr} onChangeText={(t) => { setBalanceStr(t); const n = parseFloat(t); if (!isNaN(n) && n > 0) setSettings({ virtualBalance: n }); }} keyboardType="decimal-pad" />
          </View>
          <ParamRow label="Risk Per Trade (%)" value={settings.riskPerTrade} onChange={(v) => setSettings({ riskPerTrade: v })} min={0.5} max={20} step={0.5} />
          <ParamRow label="Max Open Trades" value={settings.maxOpenTrades} onChange={(v) => setSettings({ maxOpenTrades: v })} min={1} max={20} step={1} />
        </View>

        {/* News Filter */}
        <SectionHeader title="News Filter" />
        <View style={styles.card}>
          <ToggleRow label="Suppress Around News" value={settings.newsFilter.enabled} onToggle={() => setSettings({ newsFilter: { ...settings.newsFilter, enabled: !settings.newsFilter.enabled } })} subtitle="Avoid signals near high-impact events" />
          <ParamRow label="Suppress Before (min)" value={settings.newsFilter.suppressMinutesBefore} onChange={(v) => setSettings({ newsFilter: { ...settings.newsFilter, suppressMinutesBefore: v } })} min={5} max={120} step={5} />
          <ParamRow label="Suppress After (min)" value={settings.newsFilter.suppressMinutesAfter} onChange={(v) => setSettings({ newsFilter: { ...settings.newsFilter, suppressMinutesAfter: v } })} min={5} max={120} step={5} />
        </View>

        {/* App Lock */}
        <SectionHeader title="App Lock" />
        <View style={styles.card}>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>PIN Code</Text>
            <TextInput
              style={styles.confInput}
              value={settings.appLockPin}
              onChangeText={(t) => setSettings({ appLockPin: t.replace(/[^0-9]/g, '').slice(0, 4) })}
              placeholder="Set 4-digit PIN"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>
          <Text style={styles.hint}>App will lock when backgrounded</Text>
        </View>

        {/* Learning System */}
        <SectionHeader title="AI Learning" />
        <View style={styles.card}>
          <ToggleRow label="Enable Learning" value={useStore.getState().learningEnabled} onToggle={() => useStore.getState().setLearningEnabled(!useStore.getState().learningEnabled)} subtitle="Learn from TP/SL outcomes to improve signals" />
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Models</Text>
            <TouchableOpacity onPress={() => useStore.getState().setLlmLoaded(!useStore.getState().llmLoaded)}>
              <Text style={[styles.paramValue, { color: useStore.getState().llmLoaded ? COLORS.accentGreen : COLORS.textMuted }]}>
                {useStore.getState().llmLoaded ? 'Loaded' : 'Built-in'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auto Backtest */}
        <SectionHeader title="Auto Backtest" />
        <View style={styles.card}>
          <ToggleRow label="Run Auto Backtest" value={useStore.getState().autoBacktestConfig.enabled} onToggle={() => {
            const cfg = useStore.getState().autoBacktestConfig;
            useStore.getState().setAutoBacktestConfig({ enabled: !cfg.enabled });
            if (!cfg.enabled) autoBacktest.start(); else autoBacktest.stop();
          }} subtitle="Background strategy validation" />
          <Text style={styles.hint}>Results: {useStore.getState().autoBacktestResults.length} backtests</Text>
        </View>

        {/* Performance */}
        <SectionHeader title="Performance" />
        <View style={styles.card}>
          <ToggleRow label="Performance Mode" value={settings.performanceMode} onToggle={() => setSettings({ performanceMode: !settings.performanceMode })} subtitle="30s engine interval (reduces CPU)" />
        </View>

        {/* Notifications & Sync */}
        <SectionHeader title="Notifications & Sync" />
        <View style={styles.card}>
          <ToggleRow label="Push Notifications" value={settings.pushNotifications} onToggle={() => setSettings({ pushNotifications: !settings.pushNotifications })} subtitle="Alert on high-confidence signals" />
          <ToggleRow label="Cloud Sync" value={settings.cloudSync} onToggle={() => setSettings({ cloudSync: !settings.cloudSync })} subtitle="Sync history across devices" />
        </View>

        {/* Export */}
        <SectionHeader title="Export Data" />
        <View style={styles.card}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportSignals}>
            <Text style={styles.exportText}>Export Signals (CSV)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportTrades}>
            <Text style={styles.exportText}>Export Trades (CSV)</Text>
          </TouchableOpacity>
        </View>

        {/* Theme */}
        <SectionHeader title="Appearance" />
        <View style={styles.card}>
          <ToggleRow label="Dark Mode" value={settings.theme === 'dark'} onToggle={() => setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  scroll: { paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, gap: 12 },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionDivider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  card: { backgroundColor: COLORS.bgCard, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  statusLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  reconnectBtn: { marginHorizontal: 16, marginBottom: 12, paddingVertical: 10, backgroundColor: COLORS.accentBlue, borderRadius: 8, alignItems: 'center' },
  reconnectText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  hint: { color: COLORS.textMuted, fontSize: 11, paddingHorizontal: 16, paddingBottom: 12 },
  symbolRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  symbolRowActive: { backgroundColor: COLORS.blueDim },
  symbolText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  symbolTextActive: { color: COLORS.textPrimary, fontWeight: '700' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: COLORS.accentBlue, borderColor: COLORS.accentBlue },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  timeframeRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 6 },
  tfBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.bgActive },
  tfBtnActive: { backgroundColor: COLORS.accentBlue },
  tfText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  tfTextActive: { color: '#fff' },
  paramRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  paramLabel: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '500' },
  paramSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  paramControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paramBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.bgActive, justifyContent: 'center', alignItems: 'center' },
  paramBtnText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  paramValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 30, textAlign: 'center' },
  confInput: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'], backgroundColor: COLORS.bgActive, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, minWidth: 60, textAlign: 'center' },
  presetRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  presetDot: { width: 10, height: 10, borderRadius: 5 },
  presetName: { fontSize: 15, fontWeight: '700' },
  presetDetail: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border },
  exportBtn: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  exportText: { color: COLORS.accentBlue, fontSize: 14, fontWeight: '600' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { fontSize: 14, fontWeight: '700', flex: 1 },
  categoryCount: { fontSize: 12, fontWeight: '600' },
});

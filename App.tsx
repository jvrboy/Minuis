import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, StatusBar, Vibration, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PinLockScreen from './src/screens/PinLockScreen';
import { useStore } from './src/store/useStore';
import { loadSettings, loadHistory } from './src/services/storage';
import { derivApi } from './src/services/derivApi';
import { runSignalEngine } from './src/engine/signals';
import { openTrade, checkStopLossTakeProfit, closeTrade } from './src/engine/portfolio';
import AlertBanner from './src/components/AlertBanner';
import { COLORS, LIGHT_COLORS } from './src/constants';

const darkTheme = {
  dark: true,
  colors: {
    primary: COLORS.accentBlue,
    background: COLORS.bgPrimary,
    card: COLORS.bgSecondary,
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.accentRed,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

const lightTheme = {
  dark: false,
  colors: {
    primary: LIGHT_COLORS.accentBlue,
    background: LIGHT_COLORS.bgPrimary,
    card: LIGHT_COLORS.bgSecondary,
    text: LIGHT_COLORS.textPrimary,
    border: LIGHT_COLORS.border,
    notification: LIGHT_COLORS.accentRed,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

export default function App() {
  const { settings, onboardingComplete, setSettings, loadHistory: loadHistoryToStore, addTrade, updateTrade, activeSignals, trades, lastTick } = useStore();
  const [locked, setLocked] = useState(false);
  const prevSignalCount = useRef(0);

  useEffect(() => {
    loadSettings().then((s) => setSettings(s));
    loadHistory().then((h) => loadHistoryToStore(h));
  }, []);

  useEffect(() => {
    if (settings.appLockPin) {
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'background' || state === 'inactive') {
          setLocked(true);
        }
      });
      return () => sub.remove();
    }
  }, [settings.appLockPin]);

  useEffect(() => {
    if (activeSignals.length > prevSignalCount.current && activeSignals.length > 0) {
      Vibration.vibrate(100);
    }
    prevSignalCount.current = activeSignals.length;
  }, [activeSignals.length]);

  useEffect(() => {
    if (settings.virtualTrading && activeSignals.length > 0) {
      for (const signal of activeSignals) {
        const alreadyOpen = trades.some((t) => t.signalId === signal.id);
        if (!alreadyOpen) {
          const trade = openTrade(signal, settings.virtualBalance, settings.riskPerTrade);
          addTrade(trade);
        }
      }
    }
  }, [activeSignals.length, settings.virtualTrading]);

  useEffect(() => {
    if (!lastTick || !settings.virtualTrading) return;
    for (const trade of trades.filter((t) => t.status === 'OPEN')) {
      if (trade.symbol === lastTick.symbol) {
        const result = checkStopLossTakeProfit(trade, lastTick.quote);
        if (result !== 'HOLD') {
          const closed = closeTrade(trade, result === 'HIT_TP' ? trade.takeProfit : trade.stopLoss);
          updateTrade(trade.id, closed);
        }
      }
    }
  }, [lastTick]);

  useEffect(() => {
    const interval = setInterval(runSignalEngine, settings.performanceMode ? 30000 : 15000);
    return () => clearInterval(interval);
  }, [settings.performanceMode]);

  if (!onboardingComplete) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
          <OnboardingScreen />
          <StatusBar barStyle="light-content" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (locked && settings.appLockPin) {
    return (
      <SafeAreaProvider>
        <PinLockScreen onUnlock={() => setLocked(false)} />
        <StatusBar barStyle="light-content" />
      </SafeAreaProvider>
    );
  }

  const theme = settings.theme === 'light' ? lightTheme : darkTheme;
  const barStyle = settings.theme === 'light' ? 'dark-content' : 'light-content';

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <AlertBanner />
        <NavigationContainer theme={theme}>
          <TabNavigator />
        </NavigationContainer>
        <StatusBar barStyle={barStyle} />
      </View>
    </SafeAreaProvider>
  );
}

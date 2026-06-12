import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

import DashboardScreen from '../screens/DashboardScreen';
import SignalsScreen from '../screens/SignalsScreen';
import ChartScreen from '../screens/ChartScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import BacktestScreen from '../screens/BacktestScreen';
import EconomicScreen from '../screens/EconomicScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgSecondary,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarActiveTintColor: COLORS.accentBlue,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '600', letterSpacing: 0.2 },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
      }} />
      <Tab.Screen name="Signals" component={SignalsScreen} options={{
        tabBarLabel: 'Signals',
        tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} />,
      }} />
      <Tab.Screen name="Charts" component={ChartScreen} options={{
        tabBarLabel: 'Charts',
        tabBarIcon: ({ color, size }) => <Ionicons name="candles" size={size} color={color} />,
      }} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} options={{
        tabBarLabel: 'Portfolio',
        tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
      }} />
      <Tab.Screen name="Backtest" component={BacktestScreen} options={{
        tabBarLabel: 'Backtest',
        tabBarIcon: ({ color, size }) => <Ionicons name="analytics" size={size} color={color} />,
      }} />
      <Tab.Screen name="Calendar" component={EconomicScreen} options={{
        tabBarLabel: 'Calendar',
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
      }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{
        tabBarLabel: 'History',
        tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
      }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
      }} />
    </Tab.Navigator>
  );
}

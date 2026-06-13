import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/colors';

import DashboardScreen from '../screens/DashboardScreen';
import SignalsScreen from '../screens/SignalsScreen';
import ChartScreen from '../screens/ChartScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import BacktestScreen from '../screens/BacktestScreen';
import EconomicScreen from '../screens/EconomicScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const COLORS = useColors();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgSecondary,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 52,
          paddingBottom: 4,
          paddingTop: 4,
        },
        tabBarActiveTintColor: COLORS.accentBlue,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 8, fontWeight: '600', letterSpacing: 0.2 },
        tabBarIconStyle: { marginBottom: -2 },
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
        tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
      }} />
      <Tab.Screen name="AI" component={ChatbotScreen} options={{
        tabBarLabel: 'AI Chat',
        tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
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

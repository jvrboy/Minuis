import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onUnlock: () => void;
}

export default function PinLockScreen({ onUnlock }: Props) {
  const COLORS = useColors();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { appLockPin } = require('../store/useStore').useStore.getState().settings;
  const inputRef = useRef<TextInput>(null);

  const handlePress = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);
    if (newPin.length === 4) {
      if (newPin === appLockPin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const dots = [];
  for (let i = 0; i < 4; i++) {
    dots.push(
      <View key={i} style={[styles.dot, { backgroundColor: pin.length > i ? COLORS.accentBlue : COLORS.bgActive, borderColor: COLORS.border }]} />
    );
  }

  const keys = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','DEL']];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgPrimary }]}>
      <View style={styles.content}>
        <Ionicons name="lock-closed" size={32} color={COLORS.accentBlue} />
        <Text style={[styles.title, { color: COLORS.textPrimary }]}>Enter PIN</Text>
        <Text style={[styles.subtitle, { color: COLORS.textMuted }]}>App is locked</Text>
        <View style={styles.dotsRow}>{dots}</View>
        {error && <Text style={[styles.errorText, { color: COLORS.accentRed }]}>Incorrect PIN</Text>}
      </View>
      <View style={styles.keypad}>
        {keys.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key) => {
              if (key === '') return <View key="spacer" style={styles.keySpacer} />;
              if (key === 'DEL') return (
                <TouchableOpacity key="del" style={[styles.key, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]} onPress={handleDelete}>
                  <Ionicons name="backspace" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              );
              return (
                <TouchableOpacity key={key} style={[styles.key, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]} onPress={() => handlePress(key)}>
                  <Text style={[styles.keyText, { color: COLORS.textPrimary }]}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, fontWeight: '500', marginBottom: 20 },
  dotsRow: { flexDirection: 'row', gap: 14 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  errorText: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  keypad: { paddingHorizontal: 30, paddingBottom: 40 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 },
  key: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 26, fontWeight: '700' },
  keySpacer: { width: 72, height: 72 },
});

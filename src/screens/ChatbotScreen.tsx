import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { llmEngine } from '../services/llmEngine';
import { useColors } from '../theme/colors';
import type { ChatMessage } from '../types';

function ModelSelector({ onClose }: { onClose: () => void }) {
  const COLORS = useColors();
  const { llmModels, setLlmModels, setLlmLoaded } = useStore();
  const [scanning, setScanning] = useState(false);

  const handleScan = useCallback(async () => {
    setScanning(true);
    const models = await llmEngine.scanForModels();
    setLlmModels(models);
    setScanning(false);
  }, [setLlmModels]);

  const handleLoad = useCallback(async (modelId: string) => {
    const ok = await llmEngine.loadModel(modelId);
    setLlmLoaded(ok);
    if (ok) onClose();
  }, [setLlmLoaded, onClose]);

  useEffect(() => { handleScan(); }, [handleScan]);

  return (
    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
      <View style={[styles.modalContent, { backgroundColor: COLORS.bgCard, borderColor: COLORS.border }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>GGUF Models</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        </View>
        <Text style={[styles.modalHint, { color: COLORS.textMuted }]}>
          Place .gguf files in the app documents folder, then scan.
        </Text>
        <TouchableOpacity style={[styles.scanBtn, { backgroundColor: COLORS.accentBlue }]} onPress={handleScan}>
          {scanning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.scanBtnText}>Scan for Models</Text>
          )}
        </TouchableOpacity>
        {llmModels.length === 0 ? (
          <Text style={[styles.noModels, { color: COLORS.textMuted }]}>No .gguf models found</Text>
        ) : (
          llmModels.map((model) => (
            <TouchableOpacity key={model.id} style={[styles.modelRow, { borderBottomColor: COLORS.border }]} onPress={() => handleLoad(model.id)}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modelName, { color: COLORS.textPrimary }]}>{model.name}</Text>
                <Text style={[styles.modelSize, { color: COLORS.textMuted }]}>{(model.size / 1024 / 1024).toFixed(0)} MB</Text>
              </View>
              {model.loaded && <Text style={[styles.loadedBadge, { color: COLORS.accentGreen }]}>Loaded</Text>}
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  const COLORS = useColors();
  return (
    <TouchableOpacity style={[styles.quickAction, { backgroundColor: COLORS.bgActive }]} onPress={onPress}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[styles.quickActionLabel, { color: COLORS.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ChatbotScreen() {
  const COLORS = useColors();
  const { chatMessages, addChatMessage, chatInput, setChatInput, llmLoaded, llmTemperature, setLlmTemperature, learningSystem } = useStore();
  const [loading, setLoading] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };
    addChatMessage(userMsg);
    setChatInput('');
    setLoading(true);

    try {
      const fullResponse = await llmEngine.generateResponse(
        [...chatMessages, userMsg],
        llmTemperature,
        (token) => {
          setChatInput((prev) => prev + token);
        },
      );

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now(),
      };
      addChatMessage(assistantMsg);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `Error: ${e.message || 'Failed to generate response'}`,
        timestamp: Date.now(),
      };
      addChatMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [chatMessages, loading, addChatMessage, setChatInput, llmTemperature]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgUser : styles.msgAssistant]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: COLORS.accentPurple }]}>
            <Text style={styles.avatarText}>M</Text>
          </View>
        )}
        <View style={[styles.msgBubble, {
          backgroundColor: isUser ? COLORS.accentBlue : COLORS.bgActive,
          borderBottomRightRadius: isUser ? 4 : 12,
          borderBottomLeftRadius: isUser ? 12 : 4,
        }]}>
          <Text style={[styles.msgText, { color: isUser ? '#fff' : COLORS.textPrimary }]}>{item.content}</Text>
          <Text style={[styles.msgTime, { color: isUser ? 'rgba(255,255,255,0.6)' : COLORS.textMuted }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {isUser && (
          <View style={[styles.avatar, { backgroundColor: COLORS.accentBlue }]}>
            <Text style={styles.avatarText}>U</Text>
          </View>
        )}
      </View>
    );
  }, [COLORS]);

  const handleQuickAction = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgPrimary }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: COLORS.border }]}>
        <View style={styles.topBarLeft}>
          <View style={[styles.avatarSmall, { backgroundColor: COLORS.accentPurple }]}>
            <Text style={styles.avatarTextSmall}>M</Text>
          </View>
          <View>
            <Text style={[styles.title, { color: COLORS.textPrimary }]}>Minuis AI</Text>
            <Text style={[styles.subtitle, { color: llmLoaded ? COLORS.accentGreen : COLORS.textMuted }]}>
              {llmLoaded ? 'Local LLM' : 'Built-in AI'}
            </Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => setShowModels(true)}>
            <Ionicons name="server" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => useStore.getState().clearChat()}>
            <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {showModels && <ModelSelector onClose={() => setShowModels(false)} />}

      {chatMessages.length === 0 && (
        <View style={styles.quickActions}>
          <Text style={[styles.quickTitle, { color: COLORS.textMuted }]}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            <QuickAction icon="trending-up" label="Market Analysis" color={COLORS.accentGreen} onPress={() => handleQuickAction('Analyze the current market conditions and give me trading advice.')} />
            <QuickAction icon="analytics" label="Explain MACD" color={COLORS.accentBlue} onPress={() => handleQuickAction('Explain how MACD works and how to use it for trading.')} />
            <QuickAction icon="school" label="Risk Management" color={COLORS.accentOrange} onPress={() => handleQuickAction('What is proper risk management in forex trading?')} />
            <QuickAction icon="pulse" label="Signal Quality" color={COLORS.accentPurple} onPress={() => handleQuickAction('How does the signal engine determine trade quality?')} />
            <QuickAction icon="git-network" label="Market Profile" color={COLORS.accentCyan} onPress={() => handleQuickAction('What is Market Profile and how do I use POC, VAL, VAH?')} />
          </ScrollView>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={loading ? (
          <View style={styles.loadingRow}>
            <View style={[styles.avatar, { backgroundColor: COLORS.accentPurple }]}>
              <Text style={styles.avatarText}>M</Text>
            </View>
            <View style={[styles.loadingDots, { backgroundColor: COLORS.bgActive }]}>
              <ActivityIndicator size="small" color={COLORS.accentPurple} />
              <Text style={[styles.loadingText, { color: COLORS.textMuted }]}>Thinking...</Text>
            </View>
          </View>
        ) : null}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <View style={[styles.inputBar, { backgroundColor: COLORS.bgSecondary, borderTopColor: COLORS.border }]}>
          <View style={[styles.tempRow, { borderColor: COLORS.border }]}>
            <Text style={[styles.tempLabel, { color: COLORS.textMuted }]}>Temp</Text>
            <View style={styles.tempControl}>
              <TouchableOpacity style={styles.tempBtn} onPress={() => setLlmTemperature(Math.max(0.1, +(llmTemperature - 0.1).toFixed(1)))}>
                <Text style={[styles.tempBtnText, { color: COLORS.textSecondary }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.tempValue, { color: COLORS.textPrimary }]}>{llmTemperature.toFixed(1)}</Text>
              <TouchableOpacity style={styles.tempBtn} onPress={() => setLlmTemperature(Math.min(2.0, +(llmTemperature + 0.1).toFixed(1)))}>
                <Text style={[styles.tempBtnText, { color: COLORS.textSecondary }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { backgroundColor: COLORS.bgActive, color: COLORS.textPrimary, borderColor: COLORS.border }]}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Ask Minuis AI..."
              placeholderTextColor={COLORS.textMuted}
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(chatInput)}
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: loading ? COLORS.textMuted : COLORS.accentBlue }]} onPress={() => sendMessage(chatInput)} disabled={loading}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarRight: { flexDirection: 'row', gap: 8 },
  topBarBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  avatarSmall: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  avatarTextSmall: { color: '#fff', fontSize: 14, fontWeight: '800' },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 11, fontWeight: '500' },
  quickActions: { paddingVertical: 12 },
  quickTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 16 },
  quickAction: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  quickActionLabel: { fontSize: 12, fontWeight: '600' },
  msgList: { paddingHorizontal: 12, paddingVertical: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 12, gap: 8, maxWidth: '85%' },
  msgUser: { alignSelf: 'flex-end' },
  msgAssistant: { alignSelf: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  msgBubble: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  msgText: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  msgTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  loadingRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  loadingDots: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13 },
  inputBar: { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1 },
  tempRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 4 },
  tempLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  tempControl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tempBtn: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  tempBtnText: { fontSize: 16, fontWeight: '700' },
  tempValue: { fontSize: 12, fontWeight: '700', minWidth: 20, textAlign: 'center', fontVariant: ['tabular-nums'] },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1 },
  sendBtn: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, justifyContent: 'center', padding: 40 },
  modalContent: { borderRadius: 14, borderWidth: 1, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalHint: { fontSize: 12, marginBottom: 12 },
  scanBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  scanBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  noModels: { textAlign: 'center', padding: 20, fontSize: 13 },
  modelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  modelName: { fontSize: 14, fontWeight: '600' },
  modelSize: { fontSize: 11, marginTop: 2 },
  loadedBadge: { fontSize: 12, fontWeight: '700' },
});

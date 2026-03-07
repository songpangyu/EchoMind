import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
  Image,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';

const IMAGE_STYLES = [
  { id: 'realistic', label: 'Realistic', emoji: '📷', uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop' },
  { id: '3d-cartoon', label: '3D Cartoon', emoji: '🌟', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop' },
  { id: 'anime', label: 'Anime / Manga', emoji: '🎌', uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop' },
  { id: 'watercolor', label: 'Watercolor', emoji: '🎨', uri: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=600&h=400&fit=crop' },
  { id: 'oil-paint', label: 'Oil Painting', emoji: '🖼️', uri: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop' },
  { id: 'sketch', label: 'Pencil Sketch', emoji: '✏️', uri: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=600&h=400&fit=crop' },
  { id: 'fantasy', label: 'Fantasy Art', emoji: '🌈', uri: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop' },
];

const MOCK_WORDS = [
  'I', 'was', 'walking', 'through', 'a', 'misty', 'forest', 'at', 'night.',
  'The', 'trees', 'were', 'enormous,', 'like', 'ancient', 'guardians.',
  'Tiny', 'glowing', 'fireflies', 'danced', 'around', 'me,', 'leaving',
  'trails', 'of', 'golden', 'light.', 'I', 'could', 'hear', 'a', 'gentle',
  'stream', 'nearby', 'and', 'the', 'air', 'smelled', 'like', 'pine', 'and', 'rain...',
];

const SUGGESTED_TAGS = ['Forest', 'Night', 'Fireflies', 'Nature', 'Peaceful', 'Water', 'Mystery'];

// Mock AI auto-fill results
const AI_AUTO_FILL = {
  title: 'Fireflies in the Misty Forest',
  moodIndex: 0, // Peaceful
  tags: ['Forest', 'Night', 'Fireflies', 'Peaceful', 'Nature'],
};

const WAVE_HEIGHTS = [0.3, 0.7, 1, 0.5, 0.8, 0.4, 0.9, 0.6, 0.3, 0.75, 0.5, 0.85];

type InputMode = 'voice' | 'text';
type RecordState = 'idle' | 'recording' | 'done';

export const RecordScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [mode, setMode] = useState<InputMode>('voice');
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [imageGenState, setImageGenState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [generatedImageUri, setGeneratedImageUri] = useState<string | null>(null);
  const [generatedStyleId, setGeneratedStyleId] = useState<string | null>(null);
  const [aiAutoFilling, setAiAutoFilling] = useState(false);
  const [imageStyleId, setImageStyleId] = useState('realistic');
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);

  const shimmerAnim = useRef(new RNAnimated.Value(0)).current;
  const shimmerLoopRef = useRef<RNAnimated.CompositeAnimation | null>(null);
  const saveToastAnim = useRef(new RNAnimated.Value(0)).current;
  const [isSaving, setIsSaving] = useState(false);

  const scale = useSharedValue(1);
  const waveAnims = useRef(WAVE_HEIGHTS.map(() => new RNAnimated.Value(0.3))).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordIndexRef = useRef(0);

  const startWave = () => {
    waveAnims.forEach((anim, i) => {
      RNAnimated.loop(RNAnimated.sequence([
        RNAnimated.timing(anim, { toValue: WAVE_HEIGHTS[i], duration: 250 + i * 60, useNativeDriver: false }),
        RNAnimated.timing(anim, { toValue: 0.2, duration: 250 + i * 60, useNativeDriver: false }),
      ])).start();
    });
  };

  const stopWave = () => {
    waveAnims.forEach(anim => {
      anim.stopAnimation();
      RNAnimated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: false }).start();
    });
  };

  const startTranscriptStream = () => {
    wordIndexRef.current = 0;
    setTranscript('');
    transcriptRef.current = setInterval(() => {
      if (wordIndexRef.current < MOCK_WORDS.length) {
        const word = MOCK_WORDS[wordIndexRef.current++];
        setTranscript(prev => prev ? `${prev} ${word}` : word);
      } else {
        if (transcriptRef.current) clearInterval(transcriptRef.current);
      }
    }, 180);
  };

  const startRecording = () => {
    setRecordState('recording');
    setTranscript('');
    setTimer(0);
    setShowDetails(false);
    setImageGenState('idle');
    setGeneratedImageUri(null);
    setGeneratedStyleId(null);
    wordIndexRef.current = 0;
    scale.value = withRepeat(withSequence(
      withTiming(1.12, { duration: 900 }),
      withTiming(1.0, { duration: 900 }),
    ), -1, false);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    setTimeout(startTranscriptStream, 800);
    startWave();
  };

  const stopRecording = () => {
    setRecordState('done');
    scale.value = withTiming(1);
    if (timerRef.current) clearInterval(timerRef.current);
    if (transcriptRef.current) clearInterval(transcriptRef.current);
    stopWave();
    setTranscript(MOCK_WORDS.join(' '));
    setTimeout(() => setShowDetails(true), 400);
  };

  const handleAiAutoFill = () => {
    setAiAutoFilling(true);
    setTimeout(() => {
      setTitle(AI_AUTO_FILL.title);
      setSelectedMood(AI_AUTO_FILL.moodIndex);
      setSelectedTags(AI_AUTO_FILL.tags);
      setAiAutoFilling(false);
    }, 1200);
  };

  const resetAll = () => {
    setRecordState('idle');
    setTranscript('');
    setTitle('');
    setSelectedMood(null);
    setSelectedTags([]);
    setTimer(0);
    setShowDetails(false);
    setImageGenState('idle');
    setGeneratedImageUri(null);
    setGeneratedStyleId(null);
    setAiAutoFilling(false);
    setImageStyleId('realistic');
    setStyleDropdownOpen(false);
    wordIndexRef.current = 0;
  };

  const generateImage = (styleId: string) => {
    setImageGenState('loading');
    setStyleDropdownOpen(false);
    // Stop any previous shimmer
    if (shimmerLoopRef.current) {
      shimmerLoopRef.current.stop();
      shimmerLoopRef.current = null;
    }
    shimmerAnim.setValue(0);
    // 3-second shimmer pulse loop stored in ref
    shimmerLoopRef.current = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(shimmerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        RNAnimated.timing(shimmerAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    shimmerLoopRef.current.start();
    setTimeout(() => {
      if (shimmerLoopRef.current) {
        shimmerLoopRef.current.stop();
        shimmerLoopRef.current = null;
      }
      const found = IMAGE_STYLES.find(s => s.id === styleId);
      setGeneratedImageUri(found?.uri ?? null);
      setGeneratedStyleId(styleId);
      setImageGenState('done');
    }, 3000);
  };

  const switchMode = (m: InputMode) => {
    resetAll();
    setMode(m);
  };

  const saveDream = () => {
    if (isSaving) return;
    setIsSaving(true);
    // Show toast
    saveToastAnim.setValue(0);
    RNAnimated.sequence([
      RNAnimated.timing(saveToastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      RNAnimated.delay(900),
      RNAnimated.timing(saveToastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      // Reset Record state then navigate
      resetAll();
      setIsSaving(false);
      navigation.reset({
        index: 1,
        routes: [
          { name: 'MainTabs', params: { screen: 'Home' } },
          { name: 'DreamDetail', params: { dreamId: 'new-dream' } },
        ],
      });
    });
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (transcriptRef.current) clearInterval(transcriptRef.current);
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const pulseBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <FloatingParticles />

        {/* Save success toast */}
        <RNAnimated.View
          style={[
            styles.saveToast,
            { opacity: saveToastAnim, transform: [{ translateY: saveToastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.saveToastText}>✅  Dream saved!</Text>
        </RNAnimated.View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Record Dream</Text>
            <Text style={styles.subtitle}>
              {mode === 'voice'
                ? recordState === 'idle' ? 'Tap the mic and start speaking'
                  : recordState === 'recording' ? 'Listening...'
                    : 'Recording complete — review & save'
                : 'Describe your dream in your own words'}
            </Text>
          </View>

          {/* Mode Switcher */}
          <View style={styles.modeSwitcher}>
            {(['voice', 'text'] as InputMode[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                onPress={() => switchMode(m)}
              >
                <Text style={styles.modeBtnIcon}>{m === 'voice' ? '🎙️' : '✍️'}</Text>
                <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                  {m === 'voice' ? 'Voice' : 'Type'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── VOICE MODE ── */}
          {mode === 'voice' && (
            <>
              {/* Big Record Button */}
              <View style={styles.recordArea}>
                <TouchableOpacity
                  onPress={recordState === 'recording' ? stopRecording : recordState === 'idle' ? startRecording : undefined}
                  activeOpacity={0.85}
                  disabled={recordState === 'done'}
                >
                  <Animated.View style={[styles.recordRing, pulseBtnStyle,
                  recordState === 'recording' && styles.recordRingActive]}>
                    <View style={[styles.recordInner, recordState === 'recording' && styles.recordInnerActive]}>
                      <Text style={styles.recordIcon}>
                        {recordState === 'recording' ? '⏹' : '🎙️'}
                      </Text>
                    </View>
                  </Animated.View>
                </TouchableOpacity>

                {recordState !== 'idle' && (
                  <View style={styles.timerRow}>
                    {recordState === 'recording' && <View style={styles.redDot} />}
                    <Text style={styles.timerText}>{fmt(timer)}</Text>
                    {recordState === 'done' && (
                      <TouchableOpacity onPress={() => { setRecordState('idle'); setTranscript(''); setShowDetails(false); }} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Re-record</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Waveform */}
              {recordState === 'recording' && (
                <View style={styles.waveContainer}>
                  {waveAnims.map((anim, i) => (
                    <RNAnimated.View key={i} style={[styles.waveBar,
                    { height: anim.interpolate({ inputRange: [0, 1], outputRange: [4, 40] }) }]} />
                  ))}
                </View>
              )}

              {/* Live / Editable Transcript */}
              {(recordState === 'recording' || recordState === 'done') && (
                <GlassCard style={styles.transcriptCard}>
                  <Text style={styles.transcriptLabel}>
                    {recordState === 'recording' ? '🔴  Live Transcript' : '📝  Transcript — tap to edit'}
                  </Text>
                  <TextInput
                    style={styles.transcriptInput}
                    value={transcript}
                    onChangeText={setTranscript}
                    multiline
                    editable={recordState === 'done'}
                    placeholder="Transcription will appear here..."
                    placeholderTextColor={colors.textTertiary}
                    scrollEnabled={false}
                  />
                </GlassCard>
              )}
            </>
          )}

          {/* ── TEXT MODE ── */}
          {mode === 'text' && (
            <GlassCard style={styles.transcriptCard}>
              <Text style={styles.transcriptLabel}>✍️  Your dream</Text>
              <TextInput
                style={[styles.transcriptInput, { minHeight: 180 }]}
                value={transcript}
                onChangeText={(t) => {
                  setTranscript(t);
                  setShowDetails(t.trim().length > 10);
                }}
                multiline
                placeholder="Describe your dream in as much detail as you remember..."
                placeholderTextColor={colors.textTertiary}
                textAlignVertical="top"
                scrollEnabled={false}
              />
              {transcript.length > 0 && (
                <Text style={styles.charCount}>{transcript.length} chars</Text>
              )}
            </GlassCard>
          )}

          {/* ── DETAILS — shown after recording stops or user types enough ── */}
          {showDetails && (
            <View style={styles.detailsWrapper}>
              <GlassCard style={styles.detailsCard}>
                {/* AI badge button — top-right corner */}
                <TouchableOpacity
                  style={[styles.aiBadgeBtn, aiAutoFilling && styles.aiBadgeBtnLoading]}
                  onPress={handleAiAutoFill}
                  disabled={aiAutoFilling}
                >
                  <Text style={styles.aiBadgeLabel}>
                    {aiAutoFilling ? '⏳ Filling...' : '⚡ AI Auto Fill'}
                  </Text>
                </TouchableOpacity>

                {/* Title */}
                <Text style={styles.detailLabel}>Dream Title</Text>
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Give your dream a name..."
                  placeholderTextColor={colors.textTertiary}
                />

                {/* Mood */}
                <Text style={styles.detailLabel}>How did it feel?</Text>
                <View style={styles.moodRow}>
                  {[
                    { emoji: '😌', label: 'Peaceful' },
                    { emoji: '😊', label: 'Happy' },
                    { emoji: '😢', label: 'Sad' },
                    { emoji: '😰', label: 'Anxious' },
                    { emoji: '😴', label: 'Calm' },
                  ].map((m, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.moodBtn, selectedMood === i && styles.moodBtnActive]}
                      onPress={() => setSelectedMood(selectedMood === i ? null : i)}
                    >
                      <Text style={styles.moodEmoji}>{m.emoji}</Text>
                      <Text style={[styles.moodLabel, selectedMood === i && styles.moodLabelActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Tags */}
                <Text style={styles.detailLabel}>Tags</Text>
                <View style={styles.tagRow}>
                  {SUGGESTED_TAGS.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* AI Image — style picker + generate */}
                <Text style={styles.detailLabel}>Generate AI Image</Text>

                {/* Style dropdown trigger */}
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setStyleDropdownOpen(v => !v)}
                >
                  <Text style={styles.dropdownTriggerText}>
                    {IMAGE_STYLES.find(s => s.id === imageStyleId)?.emoji}{' '}
                    {IMAGE_STYLES.find(s => s.id === imageStyleId)?.label}
                  </Text>
                  <Text style={styles.dropdownArrow}>{styleDropdownOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {/* Dropdown options */}
                {styleDropdownOpen && (
                  <View style={styles.dropdownList}>
                    {IMAGE_STYLES.map(s => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.dropdownItem, imageStyleId === s.id && styles.dropdownItemActive]}
                        onPress={() => { setImageStyleId(s.id); setStyleDropdownOpen(false); }}
                      >
                        <Text style={styles.dropdownItemText}>
                          {s.emoji}  {s.label}
                        </Text>
                        {imageStyleId === s.id && <Text style={styles.dropdownCheck}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Generate button: idle or regenerate */}
                {imageGenState !== 'loading' && (
                  <TouchableOpacity
                    style={[styles.generateBtn, imageGenState === 'done' && imageStyleId === generatedStyleId && styles.generateBtnSubtle]}
                    onPress={() => generateImage(imageStyleId)}
                  >
                    <Text style={styles.generateBtnText}>
                      {imageGenState === 'idle'
                        ? '✨ Generate AI Image'
                        : imageStyleId !== generatedStyleId
                          ? `🔄 Regenerate in ${IMAGE_STYLES.find(s => s.id === imageStyleId)?.label}`
                          : '🔄 Regenerate'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Loading shimmer */}
                {imageGenState === 'loading' && (
                  <View style={styles.imageLoadingBox}>
                    <RNAnimated.View style={[styles.imageLoadingInner, { opacity: shimmerAnim }]}>
                      <Text style={styles.imageLoadingIcon}>🌙</Text>
                      <Text style={styles.imageLoadingText}>Painting your dream...</Text>
                    </RNAnimated.View>
                  </View>
                )}

                {/* Generated image — persists across style changes */}
                {imageGenState === 'done' && generatedImageUri && (
                  <View style={styles.aiImageWrap}>
                    <Image
                      source={{ uri: generatedImageUri }}
                      style={styles.aiImage}
                      resizeMode="cover"
                    />
                    <View style={styles.aiImageMeta}>
                      <Text style={styles.aiImageLabel}>
                        {IMAGE_STYLES.find(s => s.id === generatedStyleId)?.emoji}{'  '}
                        {IMAGE_STYLES.find(s => s.id === generatedStyleId)?.label} Style
                      </Text>
                      {imageStyleId !== generatedStyleId && (
                        <Text style={styles.aiImagePending}>
                          ← tap Regenerate for {IMAGE_STYLES.find(s => s.id === imageStyleId)?.label}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Save */}
                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                  onPress={saveDream}
                  disabled={isSaving}
                >
                  <Text style={styles.saveBtnText}>💾 Save Dream</Text>
                </TouchableOpacity>
              </GlassCard>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xxl },

  header: { marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },

  modeSwitcher: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: 4, marginBottom: spacing.xl,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: spacing.sm + 2, borderRadius: borderRadius.md,
  },
  modeBtnActive: { backgroundColor: colors.deepTeal },
  modeBtnIcon: { fontSize: 18 },
  modeBtnText: { ...typography.body, color: colors.textTertiary, fontWeight: '500' },
  modeBtnTextActive: { color: colors.mintGreen, fontWeight: '700' },

  recordArea: { alignItems: 'center', marginBottom: spacing.lg },
  recordRing: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: colors.glassBg,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.mintGreen,
  },
  recordRingActive: {
    borderColor: '#e74c3c',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 10,
  },
  recordInner: {
    width: 118, height: 118, borderRadius: 59,
    backgroundColor: colors.deepTeal,
    justifyContent: 'center', alignItems: 'center',
  },
  recordInnerActive: { backgroundColor: '#3a1e1e' },
  recordIcon: { fontSize: 44 },

  timerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  redDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e74c3c' },
  timerText: { ...typography.h3, color: colors.textPrimary, fontWeight: '700', minWidth: 52 },
  retryBtn: {
    paddingHorizontal: spacing.md, paddingVertical: 4,
    backgroundColor: colors.surface, borderRadius: borderRadius.full,
  },
  retryText: { ...typography.caption, color: colors.textTertiary },

  waveContainer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    marginBottom: spacing.lg, height: 50,
  },
  waveBar: { width: 4, backgroundColor: colors.mintGreen, borderRadius: 2 },

  transcriptCard: { width: '100%', marginBottom: spacing.md },
  transcriptLabel: { ...typography.caption, color: colors.mintGreen, fontWeight: '700', marginBottom: spacing.sm, letterSpacing: 0.4 },
  transcriptInput: {
    ...typography.body, color: colors.textPrimary,
    lineHeight: 24, minHeight: 90, fontStyle: 'italic',
  },
  charCount: { ...typography.small, color: colors.textTertiary, textAlign: 'right', marginTop: 4 },

  detailsCard: { width: '100%', marginTop: spacing.sm },
  detailLabel: {
    ...typography.body, color: colors.textPrimary, fontWeight: '600',
    marginTop: spacing.md, marginBottom: spacing.sm,
  },
  titleInput: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, color: colors.textPrimary, fontSize: 15,
  },

  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  moodBtn: {
    width: 58, height: 72, borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  moodBtnActive: {
    backgroundColor: colors.softTeal,
    borderWidth: 1.5, borderColor: colors.mintGreen,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: { ...typography.small, color: colors.textTertiary, marginTop: 4 },
  moodLabelActive: { color: colors.textPrimary },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  tag: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: colors.surface, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: 'transparent',
  },
  tagActive: { backgroundColor: 'rgba(181,217,168,0.15)', borderColor: colors.mintGreen },
  tagText: { ...typography.caption, color: colors.textTertiary },
  tagTextActive: { color: colors.mintGreen, fontWeight: '600' },

  // AI Auto-fill button
  autoFillBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(181,217,168,0.12)',
    borderWidth: 1.5, borderColor: colors.mintGreen,
    borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.lg,
  },
  autoFillBtnLoading: { opacity: 0.6 },
  autoFillBtnText: { ...typography.body, color: colors.mintGreen, fontWeight: '700' },

  // Details wrapper (relative container for badge)
  detailsWrapper: { width: '100%', marginTop: spacing.sm },

  // AI Badge button — top-right corner overlay
  aiBadgeBtn: {
    position: 'absolute',
    top: -10,
    right: -6,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0d2e24',
    borderWidth: 1.5,
    borderColor: colors.mintGreen,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: colors.mintGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 6,
  },
  aiBadgeBtnLoading: { opacity: 0.65 },
  aiBadgeText: { fontSize: 13 },
  aiBadgeLabel: { fontSize: 11, color: colors.mintGreen, fontWeight: '700', letterSpacing: 0.3 },

  // Style dropdown
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    marginBottom: 2,
  },
  dropdownTriggerText: { ...typography.body, color: colors.textPrimary },
  dropdownArrow: { fontSize: 11, color: colors.textTertiary },
  dropdownList: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    overflow: 'hidden', marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.deepTeal,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.deepTeal,
  },
  dropdownItemActive: { backgroundColor: 'rgba(181,217,168,0.1)' },
  dropdownItemText: { ...typography.body, color: colors.textPrimary },
  dropdownCheck: { ...typography.body, color: colors.mintGreen, fontWeight: '700' },

  generateBtn: {
    backgroundColor: colors.deepTeal, padding: spacing.md,
    borderRadius: borderRadius.md, alignItems: 'center',
    marginBottom: spacing.md, marginTop: spacing.sm,
    borderWidth: 1, borderColor: colors.softTeal,
  },
  generateBtnSubtle: { borderColor: colors.deepTeal, opacity: 0.8 },
  generateBtnText: { ...typography.body, color: colors.mintGreen },

  // Loading shimmer box
  imageLoadingBox: {
    height: 180, borderRadius: borderRadius.md,
    backgroundColor: colors.deepTeal,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.softTeal,
  },
  imageLoadingInner: { alignItems: 'center', gap: spacing.sm },
  imageLoadingIcon: { fontSize: 44 },
  imageLoadingText: { ...typography.body, color: colors.mintGreen, fontWeight: '500' },

  aiImageWrap: { marginBottom: spacing.md },
  aiImage: { width: '100%', height: 200, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  aiImageMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiImageLabel: { ...typography.caption, color: colors.textSecondary },
  aiImagePending: { ...typography.small, color: colors.mintGreen, fontStyle: 'italic' },

  saveBtn: {
    backgroundColor: colors.mintGreen, padding: spacing.md,
    borderRadius: borderRadius.md, alignItems: 'center',
  },
  saveBtnText: { ...typography.body, color: colors.deepTeal, fontWeight: '700' },

  // Save success toast
  saveToast: {
    position: 'absolute', top: 60, left: spacing.lg, right: spacing.lg,
    zIndex: 200, backgroundColor: colors.mintGreen,
    borderRadius: borderRadius.md, padding: spacing.md,
    alignItems: 'center',
    shadowColor: colors.mintGreen, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 12,
  },
  saveToastText: { ...typography.body, color: colors.deepTeal, fontWeight: '700' },
});
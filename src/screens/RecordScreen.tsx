import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Alert,
  ActivityIndicator,
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
import Icon, { IconName } from '../components/Icon';
import Voice, {
  type SpeechErrorEvent,
  type SpeechResultsEvent,
} from '@react-native-voice/voice';
import {
  analyzeDreamAutofill,
  createDream,
  generateDreamImage,
  updateDream,
  type DreamMood,
} from '../api/dreams';
import { ScreenWrapper } from '../components/ScreenWrapper';

const ART_STYLES: { id: string; label: string; icon: IconName; uri: string; hint: string }[] = [
  { id: 'anime', label: 'Anime / Manga', icon: 'flag', uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop', hint: 'Bold framing, expressive linework, vivid dream energy.' },
  { id: 'realistic', label: 'Realistic', icon: 'image', uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop', hint: 'Natural lighting, grounded detail, cinematic realism.' },
  { id: '3d-cartoon', label: '3D Cartoon', icon: 'sparkles', uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', hint: 'Playful shapes, polished animation feel, softer mood.' },
  { id: 'watercolor', label: 'Watercolor', icon: 'palette', uri: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=600&h=400&fit=crop', hint: 'Soft edges, airy washes, poetic and gentle atmosphere.' },
  { id: 'oil-paint', label: 'Oil Painting', icon: 'brush', uri: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop', hint: 'Richer texture, dramatic lighting, gallery-style composition.' },
  { id: 'sketch', label: 'Pencil Sketch', icon: 'pencil', uri: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=600&h=400&fit=crop', hint: 'Graphite texture, monochrome mood, hand-drawn memory.' },
  { id: 'fantasy', label: 'Fantasy Art', icon: 'rainbow', uri: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop', hint: 'Mystical scale, magical glow, epic dreamworld feeling.' },
];

const QUICK_TAGS = [
  'Forest',
  'Ocean',
  'Night',
  'Flying',
  'Falling',
  'Home',
  'School',
  'Family',
  'Animal',
  'Water',
  'Chasing',
  'Mystery',
  'Adventure',
  'Fear',
  'Peaceful',
  'Lucid',
];

const WAVE_HEIGHTS = [0.3, 0.7, 1, 0.5, 0.8, 0.4, 0.9, 0.6, 0.3, 0.75, 0.5, 0.85];
export const MOOD_OPTIONS: { emoji: string; label: string; value: DreamMood }[] = [
  { emoji: '😌', label: 'Peaceful', value: 'peaceful' },
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😢', label: 'Sad', value: 'sad' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😴', label: 'Calm', value: 'calm' },
];

type InputMode = 'voice' | 'text';
type RecordState = 'idle' | 'recording' | 'paused' | 'done';

const TRANSCRIPTION_LOCALE = 'en-US';

const normalizeSpeechText = (event?: SpeechResultsEvent) =>
  event?.value?.find(item => item.trim().length > 0)?.trim() ?? '';

const mapSpeechError = (event?: SpeechErrorEvent) => {
  const message = event?.error?.message?.toLowerCase() ?? '';

  if (message.includes('not authorized') || message.includes('permission')) {
    return 'Microphone or speech recognition permission was denied. Please enable it in iOS Settings.';
  }
  if (message.includes('no speech')) {
    return 'No speech was detected. Please try again and speak a bit closer to the microphone.';
  }
  if (message.includes('recognition in progress')) {
    return 'Speech recognition is already running. Please stop the current recording first.';
  }
  if (message.includes('simulator')) {
    return 'Speech recognition is limited in the iOS Simulator. A real device will be more reliable.';
  }

  return event?.error?.message ?? 'Speech recognition failed. Please try again.';
};

const mergeUniqueTags = (...tagGroups: string[][]) => {
  const merged: string[] = [];
  const seen = new Set<string>();

  tagGroups.flat().forEach(tag => {
    const cleaned = tag.trim();
    if (!cleaned) {
      return;
    }
    const key = cleaned.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(cleaned);
  });

  return merged;
};

const joinTranscriptParts = (...parts: string[]) =>
  parts
    .map(part => part.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const resolveTranscriptSnapshot = (combinedTranscript: string, accumulatedTranscript: string, liveTranscript: string) =>
  combinedTranscript.trim() || joinTranscriptParts(accumulatedTranscript, liveTranscript);

export const RecordScreen: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
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
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(null);
  const [aiAutoFilling, setAiAutoFilling] = useState(false);
  const [imageStyleId, setImageStyleId] = useState('realistic');
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [draftDreamId, setDraftDreamId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speechAvailable, setSpeechAvailable] = useState<boolean | null>(null);
  const [speechStatusText, setSpeechStatusText] = useState('Tap to start live transcription');
  const [aiSuggestedTags, setAiSuggestedTags] = useState<string[]>([]);

  const shimmerAnim = useRef(new RNAnimated.Value(0)).current;
  const shimmerLoopRef = useRef<RNAnimated.CompositeAnimation | null>(null);
  const saveToastAnim = useRef(new RNAnimated.Value(0)).current;
  const [isSaving, setIsSaving] = useState(false);

  const scale = useSharedValue(1);
  const waveAnims = useRef(WAVE_HEIGHTS.map(() => new RNAnimated.Value(0.3))).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptValueRef = useRef('');
  const accumulatedTranscriptRef = useRef('');
  const liveTranscriptRef = useRef('');
  const pendingStopActionRef = useRef<'pause' | 'done' | null>(null);
  const recordStateRef = useRef<RecordState>('idle');
  const selectedMoodValue = useMemo(
    () => (selectedMood === null ? undefined : MOOD_OPTIONS[selectedMood]?.value),
    [selectedMood]
  );
  const selectedArtStyle = useMemo(
    () => ART_STYLES.find(style => style.id === imageStyleId) ?? ART_STYLES[0],
    [imageStyleId]
  );
  const generatedArtStyle = useMemo(
    () => ART_STYLES.find(style => style.id === generatedStyleId) ?? null,
    [generatedStyleId]
  );
  const hasTranscript = transcript.trim().length > 0;

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

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const finalizeRecording = (nextTranscript?: string) => {
    stopTimer();
    stopWave();
    scale.value = withTiming(1);
    setRecordState('done');
    recordStateRef.current = 'done';
    const finalTranscript = typeof nextTranscript === 'string'
      ? nextTranscript
      : resolveTranscriptSnapshot(
        transcriptValueRef.current,
        accumulatedTranscriptRef.current,
        liveTranscriptRef.current,
      );
    accumulatedTranscriptRef.current = finalTranscript;
    liveTranscriptRef.current = '';
    pendingStopActionRef.current = null;
    setTranscript(finalTranscript);
    transcriptValueRef.current = finalTranscript;
    setSpeechStatusText(
      finalTranscript.trim()
        ? 'Transcription complete. You can edit the text below.'
        : 'No speech captured. You can retry or type your dream manually.'
    );
    setTimeout(() => setShowDetails(true), 250);
  };

  const setRecordingActive = () => {
    setRecordState('recording');
    recordStateRef.current = 'recording';
    setShowDetails(false);
    setSpeechStatusText('Listening… Speak naturally and we will transcribe in real time.');
    pendingStopActionRef.current = null;
    scale.value = withRepeat(withSequence(
      withTiming(1.12, { duration: 900 }),
      withTiming(1.0, { duration: 900 }),
    ), -1, false);
    startWave();
    if (!timerRef.current) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
  };

  const startRecording = async (options?: { resume?: boolean }) => {
    const isResume = options?.resume === true;
    try {
      setErrorMessage(null);
      setSpeechStatusText('Checking speech recognition…');

      const available = Boolean(await Voice.isAvailable());
      setSpeechAvailable(available);

      if (!available) {
        throw new Error('Speech recognition is not available on this device.');
      }

      await Voice.destroy().catch(() => undefined);
      if (!isResume) {
        accumulatedTranscriptRef.current = '';
        liveTranscriptRef.current = '';
        setTranscript('');
        transcriptValueRef.current = '';
        setTimer(0);
        setImageGenState('idle');
        setGeneratedImageUri(null);
        setGeneratedStyleId(null);
        setImageErrorMessage(null);
      }

      setRecordingActive();
      await Voice.start(TRANSCRIPTION_LOCALE);
    } catch (error) {
      stopTimer();
      stopWave();
      scale.value = withTiming(1);
      setRecordState(isResume ? 'paused' : 'idle');
      recordStateRef.current = isResume ? 'paused' : 'idle';
      setSpeechStatusText(
        isResume
          ? 'Recording is paused. Resume to keep adding more detail.'
          : 'Tap to start live transcription'
      );
      setErrorMessage(error instanceof Error ? error.message : 'Could not start live transcription.');
    }
  };

  const pauseRecording = async () => {
    try {
      pendingStopActionRef.current = 'pause';
      stopTimer();
      stopWave();
      scale.value = withTiming(1);
      setSpeechStatusText('Pausing transcription…');
      await Voice.stop();
    } catch (error) {
      const pausedTranscript = resolveTranscriptSnapshot(
        transcriptValueRef.current,
        accumulatedTranscriptRef.current,
        liveTranscriptRef.current,
      );
      accumulatedTranscriptRef.current = pausedTranscript;
      liveTranscriptRef.current = '';
      transcriptValueRef.current = pausedTranscript;
      setTranscript(pausedTranscript);
      setRecordState('paused');
      recordStateRef.current = 'paused';
      pendingStopActionRef.current = null;
      setSpeechStatusText('Recording paused. Resume to keep adding, or end when you are ready.');
      setErrorMessage(error instanceof Error ? error.message : 'Could not stop recording cleanly.');
    }
  };

  const finishRecording = async () => {
    if (recordStateRef.current === 'paused') {
      finalizeRecording();
      return;
    }

    try {
      pendingStopActionRef.current = 'done';
      setSpeechStatusText('Finalizing transcription…');
      await Voice.stop();
    } catch (error) {
      finalizeRecording();
      setErrorMessage(error instanceof Error ? error.message : 'Could not stop recording cleanly.');
    }
  };

  const resumeRecording = async () => {
    await startRecording({ resume: true });
  };

  const resetComposer = async () => {
    stopTimer();
    stopWave();
    scale.value = withTiming(1);
    setRecordState('idle');
    recordStateRef.current = 'idle';
    setTranscript('');
    transcriptValueRef.current = '';
    accumulatedTranscriptRef.current = '';
    liveTranscriptRef.current = '';
    pendingStopActionRef.current = null;
    setShowDetails(false);
    setErrorMessage(null);
    setSpeechStatusText('Tap to start live transcription');
    try {
      await Voice.cancel();
    } catch {
      // Ignore cancellation failures while resetting local UI state.
    }
  };

  useEffect(() => {
    transcriptValueRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    recordStateRef.current = recordState;
  }, [recordState]);

  useEffect(() => {
    Voice.onSpeechStart = () => {
      setErrorMessage(null);
      setSpeechStatusText('Listening… Speak naturally and we will transcribe in real time.');
    };

    Voice.onSpeechPartialResults = event => {
      if (recordStateRef.current !== 'recording') {
        return;
      }
      const partial = normalizeSpeechText(event);
      if (!partial) {
        return;
      }
      liveTranscriptRef.current = partial;
      const combinedTranscript = joinTranscriptParts(accumulatedTranscriptRef.current, partial);
      transcriptValueRef.current = combinedTranscript;
      setTranscript(combinedTranscript);
    };

    Voice.onSpeechResults = event => {
      if (recordStateRef.current !== 'recording') {
        return;
      }
      const finalText = normalizeSpeechText(event);
      if (!finalText) {
        return;
      }
      liveTranscriptRef.current = finalText;
      const combinedTranscript = joinTranscriptParts(accumulatedTranscriptRef.current, finalText);
      transcriptValueRef.current = combinedTranscript;
      setTranscript(combinedTranscript);
    };

    Voice.onSpeechError = event => {
      const message = mapSpeechError(event);
      if (recordStateRef.current === 'recording') {
        if (pendingStopActionRef.current === 'pause') {
          const pausedTranscript = resolveTranscriptSnapshot(
            transcriptValueRef.current,
            accumulatedTranscriptRef.current,
            liveTranscriptRef.current,
          );
          accumulatedTranscriptRef.current = pausedTranscript;
          liveTranscriptRef.current = '';
          transcriptValueRef.current = pausedTranscript;
          setTranscript(pausedTranscript);
          setRecordState('paused');
          recordStateRef.current = 'paused';
          pendingStopActionRef.current = null;
        } else {
          finalizeRecording();
        }
      }
      setErrorMessage(message);
      setSpeechStatusText('Live transcription stopped.');
    };

    Voice.onSpeechEnd = () => {
      if (recordStateRef.current === 'recording') {
        const latestTranscript = resolveTranscriptSnapshot(
          transcriptValueRef.current,
          accumulatedTranscriptRef.current,
          liveTranscriptRef.current,
        );

        if (pendingStopActionRef.current === 'pause') {
          accumulatedTranscriptRef.current = latestTranscript;
          liveTranscriptRef.current = '';
          transcriptValueRef.current = latestTranscript;
          setTranscript(latestTranscript);
          setRecordState('paused');
          recordStateRef.current = 'paused';
          pendingStopActionRef.current = null;
          setSpeechStatusText('Recording paused. Resume to keep adding, or end when you are ready.');
          return;
        }

        finalizeRecording();
      }
    };

    Voice.isAvailable()
      .then(value => setSpeechAvailable(Boolean(value)))
      .catch(() => setSpeechAvailable(false));

    return () => {
      stopTimer();
      Voice.destroy().catch(() => undefined);
      Voice.removeAllListeners();
    };
  }, []);

  const switchMode = async (m: InputMode) => {
    if (mode === m) {
      return;
    }

    if (recordStateRef.current === 'recording') {
      await pauseRecording();
    }

    setErrorMessage(null);
    setMode(m);
  };

  const saveDream = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const payload = {
        sourceType: mode,
        transcript: transcript.trim(),
        title: title.trim() || undefined,
        mood: selectedMoodValue,
        tags: selectedTags,
        durationSeconds: mode === 'voice' ? timer : undefined,
        status: 'completed' as const,
      };

      const dream = draftDreamId
        ? await updateDream(draftDreamId, payload)
        : await createDream(payload);

      saveToastAnim.setValue(0);
      RNAnimated.sequence([
        RNAnimated.timing(saveToastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        RNAnimated.delay(900),
        RNAnimated.timing(saveToastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        resetAll();
        navigation.reset({
          index: 1,
          routes: [
            { name: 'MainTabs', params: { screen: 'Home' } },
            { name: 'DreamDetail', params: { dreamId: dream.id } },
          ],
        });
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save dream.');
    } finally {
      setIsSaving(false);
    }
  };

  const ensureDraftDream = async () => {
    const payload = {
      sourceType: mode,
      transcript: transcript.trim(),
      title: title.trim() || undefined,
      mood: selectedMoodValue,
      tags: selectedTags,
      durationSeconds: mode === 'voice' ? timer : undefined,
      status: 'draft' as const,
    };

    if (!payload.transcript) {
      throw new Error('Please record or type your dream first.');
    }

    if (draftDreamId) {
      const updated = await updateDream(draftDreamId, payload);
      return updated.id;
    }

    const created = await createDream(payload);
    setDraftDreamId(created.id);
    return created.id;
  };

  const handleAiAutoFill = async () => {
    try {
      setAiAutoFilling(true);
      setErrorMessage(null);
      const currentTranscript = transcript.trim();
      if (!currentTranscript) {
        throw new Error('Please enter or record your dream before using AI Auto Fill.');
      }

      const result = await analyzeDreamAutofill(currentTranscript);
      setTitle(result.suggestedTitle);
      const moodIndex = MOOD_OPTIONS.findIndex(option => option.value === result.suggestedMood);
      setSelectedMood(moodIndex >= 0 ? moodIndex : null);
      setAiSuggestedTags(result.suggestedTags);
      setSelectedTags(previous => mergeUniqueTags(previous, result.suggestedTags));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'AI auto fill failed.');
    } finally {
      setAiAutoFilling(false);
    }
  };

  const resetAll = () => {
    void Voice.cancel().catch(() => undefined);
    setRecordState('idle');
    setTranscript('');
    transcriptValueRef.current = '';
    accumulatedTranscriptRef.current = '';
    liveTranscriptRef.current = '';
    pendingStopActionRef.current = null;
    setTitle('');
    setSelectedMood(null);
    setSelectedTags([]);
    setTimer(0);
    setShowDetails(false);
    setImageGenState('idle');
    setGeneratedImageUri(null);
    setGeneratedStyleId(null);
    setImageErrorMessage(null);
    setAiAutoFilling(false);
    setImageStyleId('anime');
    setStyleDropdownOpen(false);
    setDraftDreamId(null);
    setErrorMessage(null);
    setSpeechStatusText('Tap to start live transcription');
    setAiSuggestedTags([]);
    stopTimer();
    stopWave();
    scale.value = withTiming(1);
    recordStateRef.current = 'idle';
  };

  const generateImage = async (styleId: string) => {
    try {
      setImageGenState('loading');
      setStyleDropdownOpen(false);
      setErrorMessage(null);
      setImageErrorMessage(null);
      if (shimmerLoopRef.current) {
        shimmerLoopRef.current.stop();
        shimmerLoopRef.current = null;
      }
      shimmerAnim.setValue(0);
      shimmerLoopRef.current = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(shimmerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          RNAnimated.timing(shimmerAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      );
      shimmerLoopRef.current.start();

      const currentDreamId = await ensureDraftDream();
      const result = await generateDreamImage(currentDreamId, styleId);
      setDraftDreamId(result.id);
      setGeneratedImageUri(result.aiImageUrl);
      setGeneratedStyleId(result.aiImageStyle ?? styleId);
      setImageGenState('done');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI image generation failed.';
      setImageGenState(generatedImageUri ? 'done' : 'idle');
      setErrorMessage(message);
      setImageErrorMessage(message);
    } finally {
      if (shimmerLoopRef.current) {
        shimmerLoopRef.current.stop();
        shimmerLoopRef.current = null;
      }
    }
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const pulseBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <ScreenWrapper>
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
            <Text style={styles.saveToastText}><Icon name="check" size={16} color={colors.mintGreen} />  Dream saved!</Text>
          </RNAnimated.View>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Close button (top-left) */}
            {onClose && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Mode Switcher */}
            <View style={styles.modeSwitcher}>
              {(['voice', 'text'] as InputMode[]).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={styles.modeBtnIcon}>{m === 'voice' ? <Icon name="mic" size={18} color={mode === m ? colors.mintGreen : colors.textTertiary} /> : <Icon name="pen" size={18} color={mode === m ? colors.mintGreen : colors.textTertiary} />}</Text>
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
                    style={styles.recordButtonTouch}
                    onPress={
                      recordState === 'recording'
                        ? pauseRecording
                        : recordState === 'idle'
                          ? () => startRecording()
                          : recordState === 'paused'
                            ? resumeRecording
                            : undefined
                    }
                    activeOpacity={0.85}
                    disabled={recordState === 'done'}
                    hitSlop={{ top: 18, bottom: 18, left: 18, right: 18 }}
                  >
                    <Animated.View style={[styles.recordRing, pulseBtnStyle,
                    recordState === 'recording' && styles.recordRingActive]}>
                      <View style={[styles.recordInner, recordState === 'recording' && styles.recordInnerActive, recordState === 'paused' && styles.recordInnerPaused]}>
                        <Text style={styles.recordIcon}>
                          {recordState === 'recording'
                            ? <Icon name="pause" size={44} color="#e74c3c" />
                            : recordState === 'paused'
                              ? <Icon name="play" size={44} color={colors.mintGreen} />
                              : <Icon name="mic" size={44} color={colors.mintGreen} />}
                        </Text>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>

                  {recordState !== 'idle' && (
                    <View style={styles.timerRow}>
                      {recordState === 'recording' && <View style={styles.redDot} />}
                      {recordState === 'paused' && <View style={styles.pauseDot} />}
                      <Text style={styles.timerText}>{fmt(timer)}</Text>
                      {recordState === 'done' && (
                        <TouchableOpacity
                          onPress={() => void resetComposer()}
                          style={styles.retryBtn}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={styles.retryText}>Re-record</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {recordState === 'paused' && (
                    <View style={styles.voiceActionRow}>
                      <TouchableOpacity
                        style={[styles.voiceActionBtn, styles.voiceActionSecondary]}
                        onPress={finishRecording}
                        activeOpacity={0.85}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Icon name="check" size={18} color={colors.textPrimary} />
                        <Text style={[styles.voiceActionText, styles.voiceActionSecondaryText]}>End</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.voiceActionBtn, styles.voiceActionPrimary]}
                        onPress={resumeRecording}
                        activeOpacity={0.85}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Icon name="play" size={18} color={colors.deepTeal} />
                        <Text style={[styles.voiceActionText, styles.voiceActionPrimaryText]}>Resume</Text>
                      </TouchableOpacity>
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
                {(recordState === 'recording' || recordState === 'paused' || recordState === 'done') && (
                  <GlassCard style={styles.transcriptCard}>
                    <View style={styles.transcriptHeader}>
                      <View style={styles.transcriptHeaderLeft}>
                        {recordState === 'recording'
                          ? <View style={styles.liveDot} />
                          : recordState === 'paused'
                            ? <View style={styles.pauseDotSmall} />
                            : <Icon name="pen" size={14} color={colors.mintGreen} />}
                        <Text style={styles.transcriptLabel}>
                          {recordState === 'recording'
                            ? 'Live Transcript'
                            : recordState === 'paused'
                              ? 'Paused Transcript'
                              : 'Transcript — tap to edit'}
                        </Text>
                      </View>
                      {speechAvailable === false && (
                        <TouchableOpacity
                          onPress={() => Alert.alert('Speech Unavailable', 'This simulator or device does not currently expose Apple speech recognition. Try a physical iPhone for the most reliable testing.')}
                        >
                          <Icon name="warning" size={16} color={colors.warning} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.transcriptHelperText}>{speechStatusText}</Text>
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
                <Text style={styles.transcriptLabel}><Icon name="pen" size={14} color={colors.mintGreen} />  Your dream</Text>
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
                  {errorMessage && (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  )}
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
                    {MOOD_OPTIONS.map((m, i) => (
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
                  <Text style={styles.sectionHint}>Quick Tags</Text>
                  <View style={styles.tagRow}>
                    {QUICK_TAGS.map(tag => (
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

                  {aiSuggestedTags.length > 0 && (
                    <>
                      <Text style={styles.sectionHint}>AI Suggested Tags</Text>
                      <View style={styles.tagRow}>
                        {aiSuggestedTags.map(tag => (
                          <TouchableOpacity
                            key={`ai-${tag}`}
                            style={[styles.tag, styles.aiTag, selectedTags.includes(tag) && styles.tagActive]}
                            onPress={() => toggleTag(tag)}
                          >
                            <Text style={[styles.tagText, styles.aiTagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                              {tag}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {/* AI Image — style picker + generate */}


                  {/* Style dropdown trigger */}
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setStyleDropdownOpen(v => !v)}
                    activeOpacity={0.85}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.dropdownTriggerText}>
                      <Icon name={selectedArtStyle.icon} size={16} color={colors.mintGreen} />{' '}
                      {selectedArtStyle.label}
                    </Text>
                    <Text style={styles.dropdownArrow}>{styleDropdownOpen ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {/* Dropdown options */}
                  {styleDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {ART_STYLES.map(s => (
                        <TouchableOpacity
                          key={s.id}
                          style={[styles.dropdownItem, imageStyleId === s.id && styles.dropdownItemActive]}
                          onPress={() => { setImageStyleId(s.id); setStyleDropdownOpen(false); }}
                          activeOpacity={0.85}
                        >
                          <View style={styles.dropdownItemCopy}>
                            <Text style={styles.dropdownItemText}>
                              <Icon name={s.icon} size={16} color={colors.mintGreen} />  {s.label}
                            </Text>
                            <Text style={styles.dropdownItemHint}>{s.hint}</Text>
                          </View>
                          {imageStyleId === s.id && <Text style={styles.dropdownCheck}>✓</Text>}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {!hasTranscript && (
                    <View style={styles.imageStatusCard}>
                      <Icon name="note" size={16} color={colors.textSecondary} />
                      <Text style={styles.imageStatusText}>
                        Record or type your dream first, then the AI can turn it into an image.
                      </Text>
                    </View>
                  )}

                  {imageErrorMessage && (
                    <View style={[styles.imageStatusCard, styles.imageStatusCardError]}>
                      <Icon name="warning" size={16} color={colors.error} />
                      <Text style={[styles.imageStatusText, styles.imageStatusTextError]}>
                        {imageErrorMessage}
                      </Text>
                    </View>
                  )}

                  {/* Generate button: idle or regenerate */}
                  {imageGenState !== 'loading' && (
                    <TouchableOpacity
                      style={[
                        styles.generateBtn,
                        !hasTranscript && styles.generateBtnDisabled,
                        imageGenState === 'done' && imageStyleId === generatedStyleId && styles.generateBtnSubtle,
                      ]}
                      onPress={() => generateImage(imageStyleId)}
                      disabled={!hasTranscript}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.generateBtnText}>
                        {imageErrorMessage
                          ? `Try ${selectedArtStyle.label} Again`
                          : imageGenState === 'idle'
                            ? `Generate ${selectedArtStyle.label}`
                            : imageStyleId !== generatedStyleId
                              ? `Regenerate in ${ART_STYLES.find(s => s.id === imageStyleId)?.label}`
                              : 'Regenerate'}
                      </Text>
                      <Text style={styles.generateBtnSubtext}>
                        {!hasTranscript
                          ? 'Dream text needed before image generation'
                          : imageStyleId !== generatedStyleId
                            ? 'Keep the current image or create a fresh visual take'
                            : generatedImageUri
                              ? 'Make another version with the same style'
                              : 'We use your transcript, mood, and tags to build the prompt'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Loading shimmer */}
                  {imageGenState === 'loading' && (
                    generatedImageUri ? (
                      <View style={styles.aiImageWrap}>
                        <View style={styles.imagePreviewFrame}>
                          <Image
                            source={{ uri: generatedImageUri }}
                            style={[styles.aiImage, styles.aiImageLoading]}
                            resizeMode="cover"
                          />
                          <View style={styles.imageOverlay}>
                            <RNAnimated.View style={[styles.imageLoadingInner, { opacity: shimmerAnim }]}>
                              <ActivityIndicator color={colors.mintGreen} size="small" />
                              <Text style={styles.imageLoadingText}>Painting a new {selectedArtStyle.label} version...</Text>
                            </RNAnimated.View>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.imageLoadingBox}>
                        <RNAnimated.View style={[styles.imageLoadingInner, { opacity: shimmerAnim }]}>
                          <Icon name="moon" size={44} color={colors.mintGreen} />
                          <Text style={styles.imageLoadingText}>Painting your dream...</Text>
                          <Text style={styles.imageLoadingSubtext}>Using {selectedArtStyle.label} style in a 4:3 frame</Text>
                        </RNAnimated.View>
                      </View>
                    )
                  )}

                  {/* Generated image — persists across style changes */}
                  {imageGenState === 'done' && generatedImageUri && (
                    <View style={styles.aiImageWrap}>
                      <View style={styles.imagePreviewFrame}>
                        <Image
                          source={{ uri: generatedImageUri }}
                          style={styles.aiImage}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={styles.aiImageMeta}>
                        <Text style={styles.aiImageLabel}>
                          <Icon name={generatedArtStyle?.icon ?? 'image'} size={14} color={colors.textSecondary} />{'  '}
                          {generatedArtStyle?.label ?? generatedStyleId} Style
                        </Text>
                        {imageStyleId !== generatedStyleId && (
                          <Text style={styles.aiImagePending}>
                            ← tap Regenerate for {ART_STYLES.find(s => s.id === imageStyleId)?.label}
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
                    <Text style={styles.saveBtnText}><Icon name="check" size={16} color={colors.deepTeal} /> Save Dream</Text>
                  </TouchableOpacity>
                </GlassCard>
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  closeBtn: {
    alignSelf: 'flex-start',
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  content: { padding: spacing.lg, paddingTop: spacing.xl },

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
  recordButtonTouch: {
    width: 188,
    height: 188,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  recordInnerPaused: {
    backgroundColor: 'rgba(20, 54, 48, 0.94)',
  },
  recordIcon: { fontSize: 44 },

  timerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  redDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e74c3c' },
  pauseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.warning },
  pauseDotSmall: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
  timerText: { ...typography.h3, color: colors.textPrimary, fontWeight: '700', minWidth: 52 },
  retryBtn: {
    minHeight: 40,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    backgroundColor: colors.surface, borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { ...typography.caption, color: colors.textTertiary },
  voiceActionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  voiceActionBtn: {
    minHeight: 52,
    minWidth: 138,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  voiceActionPrimary: {
    backgroundColor: colors.mintGreen,
  },
  voiceActionSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  voiceActionText: {
    ...typography.body,
    fontWeight: '700',
  },
  voiceActionPrimaryText: {
    color: colors.deepTeal,
  },
  voiceActionSecondaryText: {
    color: colors.textPrimary,
  },

  waveContainer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    marginBottom: spacing.lg, height: 50,
  },
  waveBar: { width: 4, backgroundColor: colors.mintGreen, borderRadius: 2 },

  transcriptCard: { width: '100%', marginBottom: spacing.md },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  transcriptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e74c3c' },
  transcriptLabel: { ...typography.caption, color: colors.mintGreen, fontWeight: '700', letterSpacing: 0.4 },
  transcriptHelperText: {
    ...typography.small,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  transcriptInput: {
    ...typography.body, color: colors.textPrimary,
    lineHeight: 24, minHeight: 90, fontStyle: 'italic',
  },
  charCount: { ...typography.small, color: colors.textTertiary, textAlign: 'right', marginTop: 4 },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },

  detailsCard: { width: '100%', marginTop: spacing.sm },
  detailLabel: {
    ...typography.body, color: colors.textPrimary, fontWeight: '600',
    marginTop: spacing.md, marginBottom: spacing.sm,
  },
  sectionHint: {
    ...typography.small,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
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
    backgroundColor: 'rgba(181,217,168,0.15)',
    borderWidth: 1.5, borderColor: colors.mintGreen,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: { ...typography.small, color: colors.textTertiary, marginTop: 4 },
  moodLabelActive: { color: colors.mintGreen, fontWeight: '700' as const },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  tag: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: colors.surface, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: 'transparent',
  },
  tagActive: { backgroundColor: 'rgba(181,217,168,0.15)', borderColor: colors.mintGreen },
  tagText: { ...typography.caption, color: colors.textTertiary },
  tagTextActive: { color: colors.mintGreen, fontWeight: '600' },
  aiTag: {
    borderColor: colors.softTeal,
    backgroundColor: 'rgba(110, 180, 180, 0.08)',
  },
  aiTagText: {
    color: colors.softTeal,
  },

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

  imageSectionIntro: {
    marginBottom: spacing.sm,
    gap: 8,
  },
  imageHintBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(181,217,168,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(181,217,168,0.2)',
  },
  imageHintBadgeText: {
    ...typography.caption,
    color: colors.mintGreen,
    fontWeight: '700',
  },
  imageSectionHint: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 18,
  },

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
  dropdownItemCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  dropdownItemActive: { backgroundColor: 'rgba(181,217,168,0.1)' },
  dropdownItemText: { ...typography.body, color: colors.textPrimary },
  dropdownItemHint: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 4,
    lineHeight: 17,
  },
  dropdownCheck: { ...typography.body, color: colors.mintGreen, fontWeight: '700' },

  imageStatusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  imageStatusCardError: {
    backgroundColor: 'rgba(208, 83, 83, 0.10)',
    borderColor: 'rgba(208, 83, 83, 0.2)',
  },
  imageStatusText: {
    ...typography.small,
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  imageStatusTextError: {
    color: colors.error,
  },

  generateBtn: {
    backgroundColor: colors.deepTeal, padding: spacing.md,
    borderRadius: borderRadius.md, alignItems: 'center',
    marginBottom: spacing.md, marginTop: spacing.sm,
    borderWidth: 1, borderColor: colors.softTeal,
  },
  generateBtnDisabled: {
    opacity: 0.45,
  },
  generateBtnSubtle: { borderColor: colors.deepTeal, opacity: 0.8 },
  generateBtnText: { ...typography.body, color: colors.mintGreen, fontWeight: '700' },
  generateBtnSubtext: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },

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
  imageLoadingSubtext: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  aiImageWrap: { marginBottom: spacing.md },
  imagePreviewFrame: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.sm,
  },
  aiImage: { width: '100%', height: 220, borderRadius: borderRadius.md },
  aiImageLoading: {
    opacity: 0.28,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9, 25, 23, 0.42)',
    paddingHorizontal: spacing.lg,
  },
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

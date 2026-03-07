import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';

const MOCK_TRANSCRIPT = 'I was walking through a misty forest at night. The trees were enormous, like ancient guardians. Tiny glowing fireflies danced around me, leaving trails of golden light. I could hear a gentle stream nearby and the air smelled like pine and rain...';

const SUGGESTED_TAGS = ['Forest', 'Night', 'Fireflies', 'Nature', 'Peaceful', 'Water', 'Mystery'];

export const RecordScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Forest', 'Peaceful']);
  const [showAiImage, setShowAiImage] = useState(false);
  const scale = useSharedValue(1);

  const startRecording = () => {
    setIsRecording(true);
    scale.value = withRepeat(
      withTiming(1.2, { duration: 1000 }),
      -1,
      true
    );
  };

  const stopRecording = () => {
    setIsRecording(false);
    setHasRecorded(true);
    scale.value = withTiming(1);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <FloatingParticles />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Record Your Dream</Text>
        <Text style={styles.subtitle}>
          {isRecording ? 'Listening...' : hasRecorded ? 'Edit your dream details' : 'Tap to start recording'}
        </Text>

        {/* Record Button */}
        <View style={styles.recordContainer}>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.recordButton, animatedStyle]}>
              <View style={[styles.recordInner, isRecording && styles.recordingInner]}>
                <Text style={styles.recordIcon}>
                  {isRecording ? '⏸' : '🎙️'}
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
          {isRecording && (
            <View style={styles.timerRow}>
              <View style={styles.redDot} />
              <Text style={styles.timerText}>0:12</Text>
            </View>
          )}
        </View>

        {/* Wave Animation */}
        {isRecording && (
          <View style={styles.waveContainer}>
            {[0.3, 0.6, 1, 0.7, 0.4, 0.8, 0.5, 0.9, 0.6, 0.3].map((h, i) => (
              <View key={i} style={[styles.waveBar, { height: 20 * h + 4 }]} />
            ))}
          </View>
        )}

        {/* Transcript Preview */}
        {hasRecorded && (
          <GlassCard style={styles.transcriptCard}>
            <View style={styles.transcriptHeader}>
              <Text style={{ fontSize: 16 }}>📝</Text>
              <Text style={styles.transcriptLabel}>Voice Transcript</Text>
            </View>
            <Text style={styles.transcriptText}>{MOCK_TRANSCRIPT}</Text>
          </GlassCard>
        )}

        {/* Edit Section */}
        {hasRecorded && (
          <View style={styles.editSection}>
            <GlassCard style={styles.editCard}>
              <Text style={styles.editLabel}>Dream Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Give your dream a name..."
                placeholderTextColor={colors.textTertiary}
                defaultValue="Misty Forest Walk"
              />

              <Text style={styles.editLabel}>Tags</Text>
              <View style={styles.tagContainer}>
                {SUGGESTED_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.editLabel}>How did this dream feel?</Text>
              <View style={styles.moodContainer}>
                {[
                  { emoji: '😌', label: 'Peaceful' },
                  { emoji: '😊', label: 'Happy' },
                  { emoji: '😢', label: 'Sad' },
                  { emoji: '😰', label: 'Anxious' },
                  { emoji: '😴', label: 'Calm' },
                ].map((m, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.moodButton, selectedMood === i && styles.moodSelected]}
                    onPress={() => setSelectedMood(i)}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.moodLabel, selectedMood === i && styles.moodLabelSelected]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* AI Image Generation */}
              <TouchableOpacity
                style={styles.generateButton}
                onPress={() => setShowAiImage(true)}
              >
                <Text style={styles.generateButtonText}>✨ Generate AI Image</Text>
              </TouchableOpacity>

              {showAiImage && (
                <View style={styles.aiImageContainer}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=400&h=250&fit=crop' }}
                    style={styles.aiImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.aiImageLabel}>AI Generated Dream Image</Text>
                </View>
              )}

              <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Dream</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xxl, alignItems: 'center' },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  recordContainer: { marginVertical: spacing.xl, alignItems: 'center' },
  recordButton: {
    width: 160, height: 160, borderRadius: 80, backgroundColor: colors.glassBg,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.mintGreen,
  },
  recordInner: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: colors.deepTeal,
    justifyContent: 'center', alignItems: 'center',
  },
  recordingInner: { backgroundColor: colors.softTeal },
  recordIcon: { fontSize: 48 },
  timerRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  redDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e74c3c' },
  timerText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  waveContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.lg,
  },
  waveBar: { width: 4, backgroundColor: colors.mintGreen, borderRadius: 2 },
  transcriptCard: { width: '100%', marginBottom: spacing.md },
  transcriptHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  transcriptLabel: { ...typography.caption, color: colors.mintGreen, fontWeight: '600' },
  transcriptText: { ...typography.body, color: colors.textSecondary, lineHeight: 22, fontStyle: 'italic' },
  editSection: { width: '100%', marginTop: spacing.sm },
  editCard: { width: '100%' },
  editLabel: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    color: colors.textPrimary, fontSize: typography.body.fontSize, fontWeight: typography.body.fontWeight,
  },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  tag: {
    backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tagSelected: { backgroundColor: colors.softTeal },
  tagText: { ...typography.caption, color: colors.textTertiary },
  tagTextSelected: { color: colors.textPrimary, fontWeight: '600' },
  moodContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.lg },
  moodButton: {
    width: 56, height: 70, borderRadius: 16, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  moodSelected: { backgroundColor: colors.softTeal, borderWidth: 2, borderColor: colors.mintGreen },
  moodEmoji: { fontSize: 24 },
  moodLabel: { ...typography.small, color: colors.textTertiary, marginTop: 4 },
  moodLabelSelected: { color: colors.textPrimary },
  generateButton: {
    backgroundColor: colors.deepTeal, padding: spacing.md, borderRadius: borderRadius.md,
    alignItems: 'center', marginBottom: spacing.md,
  },
  generateButtonText: { ...typography.body, color: colors.mintGreen },
  aiImageContainer: { marginBottom: spacing.md, alignItems: 'center' },
  aiImage: { width: '100%', height: 200, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  aiImageLabel: { ...typography.caption, color: colors.textTertiary },
  saveButton: { backgroundColor: colors.mintGreen, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  saveButtonText: { ...typography.body, color: colors.deepTeal, fontWeight: '600' },
});
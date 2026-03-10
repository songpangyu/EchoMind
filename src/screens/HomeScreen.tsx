import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import Icon, { IconName } from '../components/Icon';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getGreeting = (): { text: string; icon: IconName } => {
  const h = new Date().getHours();
  if (h < 5) return { text: 'Good Night', icon: 'moon' };
  if (h < 12) return { text: 'Good Morning', icon: 'sunrise' };
  if (h < 18) return { text: 'Good Afternoon', icon: 'sun' };
  return { text: 'Good Evening', icon: 'sunset' };
};

const formatDate = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

// ─── Mock data ─────────────────────────────────────────────────────────────────
const LAST_DREAM = {
  id: 'last',
  title: 'Morning Sun in the Crystal Forest',
  snippet: 'Walking through a bright forest where morning sunlight dances through fresh green leaves. The air felt incredibly crisp and uplifting...',
  time: '2h ago',
  mood: '😊',
  moodLabel: 'Refreshing',
  tags: ['Forest', 'Sunlight', 'Fresh'],
  image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=300&fit=crop',
};

const MOOD_TREND: { day: string; icon: string; color: string; label: string }[] = [
  { day: '7', icon: '😌', color: '#7ec8a0', label: 'Peaceful' },
  { day: '5', icon: '😊', color: '#6dbf9e', label: 'Happy' },
  { day: '4', icon: '😰', color: '#e07777', label: 'Anxious' },
  { day: '2', icon: '😌', color: '#7ec8a0', label: 'Peaceful' },
  { day: '1', icon: '😢', color: '#7da8c8', label: 'Sad' },
  { day: '28', icon: '😊', color: '#6dbf9e', label: 'Happy' },
  { day: '26', icon: '😴', color: '#9b7ec8', label: 'Calm' },
];

const DAILY_REFLECTION = [
  "What stayed with you when you woke up?",
  "Was there a moment in your dream that felt too real?",
  "What emotion from your dream is still sitting in your chest?",
  "If you could re-enter last night's dream, what would you change?",
  "What would you say to your dream-self if you could?",
  "What does your dream say about what you want right now?",
  "Who showed up in your dream that surprised you?",
];

const SUGGESTIONS: { icon: IconName; label: string; text: string }[] = [
  { icon: 'meditate', label: 'Wind Down', text: 'Try 5 min of deep breathing before bed for more vivid dreams.' },
  { icon: 'book', label: 'Read', text: 'Reading fiction before sleep tends to produce more narrative-rich dreams.' },
  { icon: 'leaf', label: 'Scent', text: 'Lavender on your pillow can improve REM depth and dream recall.' },
  { icon: 'music', label: 'Sounds', text: 'Ambient sounds during sleep may weave themselves into your dreamscape.' },
];

const DREAM_STATS = {
  thisMonth: 14,
  topMoodIcon: '😌',
  topMoodLabel: 'Peaceful',
  topTagIcon: 'leaf' as IconName,
  topTagLabel: 'Nature',
  avgPerWeek: 3.5,
};

// ─── Component ────────────────────────────────────────────────────────────────
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const greeting = useMemo(getGreeting, []);
  const dateStr = useMemo(formatDate, []);
  const reflection = useMemo(() => DAILY_REFLECTION[new Date().getDate() % DAILY_REFLECTION.length], []);

  return (
    <View style={styles.container}>
      <FloatingParticles />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.greeting}><Icon name={greeting.icon} size={20} color={colors.mintGreen} />  {greeting.text}</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        {/* ── Last Dream (tappable) ── */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('DreamDetail', { dreamId: LAST_DREAM.id })}>
          <GlassCard style={styles.dreamCard}>
            <View style={styles.dreamImageWrap}>
              <Image source={{ uri: LAST_DREAM.image }} style={styles.dreamImage} resizeMode="cover" />
            </View>
            <View style={styles.dreamBody}>
              <Text style={styles.dreamTitle}>{LAST_DREAM.title}</Text>
              <Text style={styles.dreamSnippet} numberOfLines={2}>{LAST_DREAM.snippet}</Text>
              <View style={styles.dreamMeta}>
                <Text style={styles.dreamTime}><Icon name="clock" size={12} color={colors.textTertiary} /> {LAST_DREAM.time}</Text>
                <View style={styles.moodBadge}>
                  <Text style={{ fontSize: 14 }}>{LAST_DREAM.mood}</Text>
                  <Text style={styles.moodText}> {LAST_DREAM.moodLabel}</Text>
                </View>
              </View>
              <View style={styles.tagRow}>
                {LAST_DREAM.tags.map(t => (
                  <View key={t} style={styles.miniTag}><Text style={styles.miniTagText}>{t}</Text></View>
                ))}
                <Text style={styles.tapHint}>Tap to view →</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
        {/* ── Dream Stats — 2×2 grid ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dream Stats</Text>
          <GlassCard style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statBigValue}>{DREAM_STATS.thisMonth}</Text>
                <Text style={styles.statLabel}>Dreams this month</Text>
              </View>
              <View style={styles.statDividerV} />
              <View style={styles.statItem}>
                <Text style={styles.statBigValue}>{DREAM_STATS.avgPerWeek}</Text>
                <Text style={styles.statLabel}>Avg per week</Text>
              </View>
            </View>
            <View style={styles.statDividerH} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={{ fontSize: 24 }}>{DREAM_STATS.topMoodIcon}</Text>
                <Text style={styles.statMoodValue}>{DREAM_STATS.topMoodLabel}</Text>
                <Text style={styles.statLabel}>Top mood</Text>
              </View>
              <View style={styles.statDividerV} />
              <View style={styles.statItem}>
                <Icon name={DREAM_STATS.topTagIcon} size={24} color={colors.mintGreen} />
                <Text style={styles.statMoodValue}>{DREAM_STATS.topTagLabel}</Text>
                <Text style={styles.statLabel}>Most common theme</Text>
              </View>
            </View>
          </GlassCard>
        </View>
        {/* ── AI Insight (based on all dreams) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Insight for Today</Text>
          <GlassCard>
            <Text style={styles.aiLabel}>EchoMind AI · Based on all your dreams</Text>
            <Text style={styles.insightText}>
              Across your recorded dreams, nature and open spaces appear frequently — suggesting a recurring need for freedom and mental space. Lately, peaceful moods dominate, but the occasional anxious dream hints at unresolved pressure. Today, lean into the calm and give yourself permission to slow down.
            </Text>
            <View style={styles.symbolRow}>
              {[
                { icon: 'tree' as IconName, text: 'Nature = Freedom' },
                { icon: 'sparkle' as IconName, text: 'Light = Clarity' },
                { icon: 'wave' as IconName, text: 'Water = Emotion' },
              ].map((s, i) => (
                <View key={i} style={styles.symbolChip}>
                  <Icon name={s.icon} size={14} color={colors.mintGreen} />
                  <Text style={styles.symbolText}> {s.text}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* ── Daily Reflection ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Reflection</Text>
          <GlassCard>
            <Text style={styles.reflectionText}>"{reflection}"</Text>
            <Text style={styles.reflectionHint}>Take a moment to sit with this.</Text>
          </GlassCard>
        </View>

        {/* ── Mood Trend ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Dream Moods</Text>
          <GlassCard>
            <Text style={styles.trendSubtitle}>Last 7 recorded dreams</Text>
            <View style={styles.trendRow}>
              {MOOD_TREND.map((m, i) => (
                <View key={i} style={styles.trendItem}>
                  <Text style={{ fontSize: 18 }}>{m.icon}</Text>
                  <View style={[styles.trendBar, { backgroundColor: m.color }]} />
                  <Text style={styles.trendDay}>{m.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.trendLegend}>
              {[...new Map(MOOD_TREND.map(m => [m.label, m])).values()].map((m, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                  <Text style={styles.legendText}>{m.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* ── Dream Wellbeing Tips ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dream Wellbeing Tips</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow}>
            {SUGGESTIONS.map((s, i) => (
              <GlassCard key={i} style={styles.suggestionCard}>
                <Icon name={s.icon} size={24} color={colors.mintGreen} />
                <Text style={styles.suggestionLabel}>{s.label}</Text>
                <Text style={styles.suggestionText}>{s.text}</Text>
              </GlassCard>
            ))}
          </ScrollView>
        </View>



        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  greeting: { ...typography.h1, color: colors.textPrimary, marginBottom: 4 },
  date: { ...typography.caption, color: colors.textSecondary },

  dreamCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: 0, overflow: 'hidden' },
  dreamImageWrap: { position: 'relative' },
  dreamImage: { width: '100%', height: 190, borderRadius: 0 },
  dreamBody: { padding: spacing.md },
  dreamTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  dreamSnippet: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.sm },
  dreamMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  dreamTime: { ...typography.caption, color: colors.textTertiary },
  moodBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(181,217,168,0.15)', borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.mintGreen, paddingHorizontal: spacing.md, paddingVertical: 3,
  },
  moodText: { ...typography.caption, color: colors.mintGreen, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  miniTag: { backgroundColor: colors.deepTeal, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  miniTagText: { ...typography.small, color: colors.mintGreen },
  tapHint: { ...typography.small, color: colors.textTertiary, marginLeft: 'auto' },

  section: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },

  reflectionText: { ...typography.body, color: colors.textPrimary, fontStyle: 'italic', lineHeight: 26, marginBottom: spacing.sm },
  reflectionHint: { ...typography.caption, color: colors.mintGreen },

  trendSubtitle: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.md },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md },
  trendItem: { flex: 1, alignItems: 'center', gap: 4 },
  trendEmoji: { fontSize: 16 },
  trendBar: { width: 8, height: 36, borderRadius: 4 },
  trendDay: { ...typography.small, color: colors.textTertiary, fontSize: 10 },
  trendLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.small, color: colors.textTertiary },

  aiLabel: { ...typography.caption, color: colors.mintGreen, fontWeight: '700', marginBottom: spacing.sm },
  insightText: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.md },
  symbolRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  symbolChip: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  symbolText: { ...typography.small, color: colors.textSecondary },

  suggestionsRow: { gap: spacing.md },
  suggestionCard: { width: 175, flexShrink: 0 },
  suggestionIcon: { fontSize: 28, marginBottom: spacing.xs },
  suggestionLabel: { ...typography.caption, color: colors.mintGreen, fontWeight: '700', marginBottom: 4 },
  suggestionText: { ...typography.small, color: colors.textSecondary, lineHeight: 18 },

  statsCard: { padding: 0, overflow: 'hidden' },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.sm },
  statBigValue: { ...typography.h1, color: colors.mintGreen, marginBottom: 4 },
  statEmoji: { fontSize: 28, marginBottom: 4 },
  statMoodValue: { ...typography.h3, color: colors.mintGreen, fontWeight: '700', marginBottom: 2 },
  statLabel: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
  statDividerV: { width: 1, backgroundColor: colors.deepTeal, marginVertical: spacing.md },
  statDividerH: { height: 1, backgroundColor: colors.deepTeal },
});

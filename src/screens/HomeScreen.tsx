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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import Icon, { IconName } from '../components/Icon';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getHomeStats, getAiInsight, HomeStats, AiInsightResponse } from '../api/dreams';
import { MOOD_OPTIONS } from './RecordScreen';
import { ActivityIndicator } from 'react-native';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getGreeting = (): { text: string; icon: IconName } => {
  const h = new Date().getHours();
  if (h < 5) return { text: 'Good Night', icon: 'moon' };
  if (h < 12) return { text: 'Good Morning', icon: 'sun' };
  if (h < 18) return { text: 'Good Afternoon', icon: 'sun' };
  return { text: 'Good Evening', icon: 'moon' };
};

const formatDate = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MOOD_COLORS: Record<string, string> = {
  peaceful: '#7ec8a0',
  happy: '#6dbf9e',
  sad: '#7da8c8',
  anxious: '#e07777',
  angry: '#e07777',
  scared: '#9b7ec8',
  neutral: colors.textSecondary,
};

const getMoodDetails = (moodKey: string | null) => {
  const defaultMood = { emoji: '☁️', label: 'Neutral', color: MOOD_COLORS.neutral };
  if (!moodKey) return defaultMood;
  const match = MOOD_OPTIONS.find((m: any) => m.id === moodKey || m.value === moodKey) || MOOD_OPTIONS.find((m: any) => m.label.toLowerCase() === moodKey.toLowerCase());
  if (!match) return defaultMood;
  return { ...match, color: MOOD_COLORS[match.value] || MOOD_COLORS.neutral };
};

// ─── Mock data ─────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const greeting = useMemo(getGreeting, []);
  const dateStr = useMemo(formatDate, []);
  const reflection = useMemo(() => DAILY_REFLECTION[new Date().getDate() % DAILY_REFLECTION.length], []);

  const [stats, setStats] = React.useState<HomeStats | null>(null);
  const [insight, setInsight] = React.useState<AiInsightResponse | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [loadingInsight, setLoadingInsight] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const fetchAll = async () => {
        try {
          const statsRes = await getHomeStats();
          if (active) setStats(statsRes);
        } catch (e) {
          console.error(e);
        } finally {
          if (active) setLoadingStats(false);
        }

        try {
          const insightRes = await getAiInsight();
          if (active) setInsight(insightRes);
        } catch (e) {
          console.error(e);
        } finally {
          if (active) setLoadingInsight(false);
        }
      };
      
      fetchAll();
      return () => { active = false; };
    }, [])
  );

  return (
    <ScreenWrapper>
    <View style={styles.container}>
      <FloatingParticles />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.greetingRow}>
            <Icon name={greeting.icon} size={20} color={colors.mintGreen} />
            <Text style={styles.greeting}> {greeting.text}</Text>
          </View>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        {/* ── Last Dream (tappable) ── */}
        {!loadingStats && stats?.lastDream && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('DreamDetail', { dreamId: stats.lastDream!.id })}>
            <GlassCard style={styles.dreamCard}>
              {stats.lastDream.aiImageUrl && (
                <View style={styles.dreamImageWrap}>
                  <Image source={{ uri: stats.lastDream.aiImageUrl }} style={styles.dreamImage} resizeMode="cover" />
                </View>
              )}
              <View style={styles.dreamBody}>
                <Text style={styles.dreamTitle}>{stats.lastDream.title || 'Untitled Dream'}</Text>
                <Text style={styles.dreamSnippet} numberOfLines={2}>{stats.lastDream.transcript}</Text>
                <View style={styles.dreamMeta}>
                  <Text style={styles.dreamTime}>
                    <Icon name="clock" size={12} color={colors.textTertiary} /> {new Date(stats.lastDream.createdAt).toLocaleDateString()}
                  </Text>
                  {stats.lastDream.mood && (
                    <View style={styles.moodBadge}>
                      <Text style={{ fontSize: 14 }}>{getMoodDetails(stats.lastDream.mood).emoji}</Text>
                      <Text style={styles.moodText}> {getMoodDetails(stats.lastDream.mood).label}</Text>
                    </View>
                  )}
                </View>
                {stats.lastDream.tags && stats.lastDream.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {stats.lastDream.tags.slice(0, 3).map(t => (
                      <View key={t} style={styles.miniTag}><Text style={styles.miniTagText}>{t}</Text></View>
                    ))}
                    <Text style={styles.tapHint}>Tap to view →</Text>
                  </View>
                )}
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* ── Dream Stats — 2×2 grid ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dream Stats</Text>
          <GlassCard style={styles.statsCard}>
            {loadingStats ? (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator color={colors.mintGreen} />
              </View>
            ) : stats ? (
              <>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statBigValue}>{stats.thisMonthDreams}</Text>
                    <Text style={styles.statLabel}>Dreams this month</Text>
                  </View>
                  <View style={styles.statDividerV} />
                  <View style={styles.statItem}>
                    <Text style={styles.statBigValue}>{stats.weeklyAverage}</Text>
                    <Text style={styles.statLabel}>Avg per week</Text>
                  </View>
                </View>
                <View style={styles.statDividerH} />
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={{ fontSize: 24 }}>{getMoodDetails(stats.topMood).emoji}</Text>
                    <Text style={styles.statMoodValue}>{getMoodDetails(stats.topMood).label}</Text>
                    <Text style={styles.statLabel}>Top mood</Text>
                  </View>
                  <View style={styles.statDividerV} />
                  <View style={styles.statItem}>
                    {stats.topTag ? (
                      <>
                        <Icon name="leaf" size={24} color={colors.mintGreen} />
                        <Text style={styles.statMoodValue}>{stats.topTag}</Text>
                        <Text style={styles.statLabel}>Most common theme</Text>
                      </>
                    ) : (
                      <>
                        <Icon name="note" size={24} color={colors.textTertiary} />
                        <Text style={styles.statMoodValue}>None</Text>
                        <Text style={styles.statLabel}>Not enough data</Text>
                      </>
                    )}
                  </View>
                </View>
              </>
            ) : null}
          </GlassCard>
        </View>
        {/* ── AI Insight (based on all dreams) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Insight for Today</Text>
          <GlassCard>
            {loadingInsight ? (
              <View style={{ padding: spacing.lg, alignItems: 'center', gap: spacing.md }}>
                <ActivityIndicator color={colors.mintGreen} />
                <Text style={{ color: colors.textSecondary }}>Checking your recent dreams...</Text>
              </View>
            ) : insight ? (
              <>
                <Text style={styles.aiLabel}>EchoMind AI · Based on your recent dreams</Text>
                <Text style={styles.insightText}>{insight.insightText}</Text>
                {insight.symbols && insight.symbols.length > 0 && (
                  <View style={styles.symbolRow}>
                    {insight.symbols.map((s, i) => (
                      <View key={i} style={styles.symbolChip}>
                        <Text style={{ fontSize: 14 }}>{s.icon}</Text>
                        <Text style={styles.symbolText}> {s.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <Text style={{ color: colors.textSecondary }}>No insight available at the moment.</Text>
            )}
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
            {loadingStats ? (
              <ActivityIndicator color={colors.mintGreen} />
            ) : stats?.recentMoodTrend && stats.recentMoodTrend.length > 0 ? (
              <>
                <View style={styles.trendRow}>
                  {stats.recentMoodTrend.map((m, i) => {
                    const dt = new Date(m.date);
                    const details = getMoodDetails(m.mood);
                    return (
                      <View key={i} style={styles.trendItem}>
                        <Text style={{ fontSize: 18 }}>{details.emoji}</Text>
                        <View style={[styles.trendBar, { backgroundColor: details.color }]} />
                        <Text style={styles.trendDay}>{dt.getDate()}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.trendLegend}>
                  {[...new Map(stats.recentMoodTrend.map(m => {
                    const details = getMoodDetails(m.mood);
                    return [details.label, details];
                  })).values()].map((m, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                      <Text style={styles.legendText}>{m.label}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={{ color: colors.textSecondary }}>Record more dreams to see your mood trend!</Text>
            )}
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
    </ScreenWrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md,alignItems: 'center' },
  greetingRow: {
  flexDirection: 'row',
  alignItems: 'center',     // ⭐ key：vertically center the icon and text
  justifyContent: 'center',
},
  greeting: { ...typography.h1, fontSize: 22, fontWeight: '600',letterSpacing: 0.3,
    color: colors.textPrimary, marginBottom: 4,textAlign: 'center' },
  date: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },

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
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md },//aligning items to the bottom of the row（space-between）
  trendItem: { flex: 1, alignItems: 'center', gap: 4 },
  trendEmoji: { fontSize: 16 },
  trendBar: { width: 8, height: 36, borderRadius: 4 },
  trendDay: { ...typography.small, color: colors.textTertiary, fontSize: 10 },
  trendLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.small, color: colors.textTertiary },

  aiLabel: { ...typography.caption, color: colors.mintGreen, fontWeight: '700', marginBottom: spacing.sm },
  insightText: { ...typography.body, color: colors.textSecondary, lineHeight: 18,  marginBottom: spacing.md },
  symbolRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  symbolChip: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  symbolText: { ...typography.small, color: colors.mintGreen, fontWeight: '600' },

  suggestionsRow: { gap: spacing.md },
  suggestionCard: { width: 175, flexShrink: 0 },
  suggestionIcon: { fontSize: 28, marginBottom: spacing.xs },
  suggestionLabel: { ...typography.caption, color: colors.mintGreen, fontWeight: '700', marginBottom: 4 },
  suggestionText: { ...typography.small, color: colors.textSecondary, lineHeight: 18 },

  statsCard: { padding: 0, overflow: 'hidden' },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.lg, paddingHorizontal: spacing.sm },
  statBigValue: { ...typography.h1, color: colors.mintGreen, marginBottom: 4 },
  statEmoji: { fontSize: 28, marginBottom: 4 },
  statMoodValue: { ...typography.h3, color: colors.mintGreen, fontWeight: '700', marginBottom: 2 },
  statLabel: { ...typography.caption, color: colors.textTertiary, textAlign: 'center',fontWeight: '500', },
  statDividerV: { width: 1, backgroundColor: colors.deepTeal, marginVertical: spacing.md },
  statDividerH: { height: 1, backgroundColor: colors.deepTeal },
});

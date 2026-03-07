import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

const DREAM_IMG = 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=600&h=300&fit=crop';

export const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <FloatingParticles />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Evening</Text>
          <Text style={styles.date}>Monday, Feb 10</Text>
        </View>

        {/* Last Night's Dream */}
        <GlassCard style={styles.dreamCard}>
          <Image source={{ uri: DREAM_IMG }} style={styles.dreamImage} resizeMode="cover" />
          <View style={styles.aiTag}><Text style={styles.aiTagText}>AI Generated</Text></View>
          <Text style={styles.dreamTitle}>Last Night's Dream</Text>
          <Text style={styles.dreamSnippet}>
            Walking through a misty forest with glowing fireflies. The trees whispered ancient melodies as moonlight filtered through the canopy...
          </Text>
          <View style={styles.dreamMeta}>
            <Text style={styles.dreamTime}>3h 24m ago</Text>
            <View style={styles.moodBadge}><Text style={styles.moodText}>Peaceful</Text></View>
          </View>
          <View style={styles.tagRow}>
            {['Forest', 'Nature', 'Fireflies'].map((t, i) => (
              <View key={i} style={styles.miniTag}><Text style={styles.miniTagText}>{t}</Text></View>
            ))}
          </View>
        </GlassCard>

        {/* AI Dream Interpretation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Dream Interpretation</Text>
          <GlassCard style={styles.insightCard}>
            <View style={styles.aiHeader}>
              <Text style={{ fontSize: 20 }}>🔮</Text>
              <Text style={styles.aiLabel}>EchoMind AI</Text>
            </View>
            <Text style={styles.insightText}>
              Your forest dream reflects a deep desire for inner peace and reconnection with nature. The fireflies symbolize small moments of clarity guiding you through uncertainty.
            </Text>
            <Text style={styles.symbolTitle}>Key Symbols</Text>
            <View style={styles.symbolRow}>
              <View style={styles.symbolChip}><Text style={styles.symbolText}>🌲 Forest = Inner Journey</Text></View>
              <View style={styles.symbolChip}><Text style={styles.symbolText}>✨ Fireflies = Hope</Text></View>
            </View>
            <View style={styles.symbolRow}>
              <View style={styles.symbolChip}><Text style={styles.symbolText}>🌙 Moon = Intuition</Text></View>
            </View>
          </GlassCard>
        </View>

        {/* Today's Suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Suggestions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { icon: '💚', label: 'Mood', value: 'Calm & Reflective', detail: 'Based on your dream' },
              { icon: '👕', label: 'Style', value: 'Soft Greens', detail: 'Match dream energy' },
              { icon: '🧘', label: 'Wellness', value: 'Forest Walk', detail: '15 min meditation' },
              { icon: '🍵', label: 'Health', value: 'Chamomile Tea', detail: 'Better sleep tonight' },
            ].map((s, i) => (
              <GlassCard key={i} style={styles.suggestionCard}>
                <Text style={styles.suggestionIcon}>{s.icon}</Text>
                <Text style={styles.suggestionLabel}>{s.label}</Text>
                <Text style={styles.suggestionValue}>{s.value}</Text>
                <Text style={styles.suggestionDetail}>{s.detail}</Text>
              </GlassCard>
            ))}
          </ScrollView>
        </View>

        {/* Sleep Quality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep Quality</Text>
          <GlassCard style={styles.sleepCard}>
            <View style={styles.sleepScoreRow}>
              <View style={styles.sleepScoreCircle}>
                <Text style={styles.sleepScoreValue}>85</Text>
                <Text style={styles.sleepScoreUnit}>%</Text>
              </View>
              <View style={{ marginLeft: spacing.md }}>
                <Text style={styles.sleepScoreLabel}>Sleep Score</Text>
                <Text style={styles.sleepScoreDesc}>Great quality!</Text>
              </View>
            </View>
            <View style={styles.sleepDivider} />
            <View style={styles.sleepRow}>
              {[
                { label: 'Duration', value: '7h 32m' },
                { label: 'Deep Sleep', value: '2h 15m' },
                { label: 'REM', value: '1h 48m' },
              ].map((s, i) => (
                <View key={i} style={styles.sleepStat}>
                  <Text style={styles.sleepLabel}>{s.label}</Text>
                  <Text style={styles.sleepValue}>{s.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.sleepBar}>
              <View style={[styles.sleepSeg, { flex: 0.15, backgroundColor: colors.softTeal }]} />
              <View style={[styles.sleepSeg, { flex: 0.30, backgroundColor: colors.deepTeal }]} />
              <View style={[styles.sleepSeg, { flex: 0.25, backgroundColor: colors.mintGreen }]} />
              <View style={[styles.sleepSeg, { flex: 0.20, backgroundColor: colors.deepTeal }]} />
              <View style={[styles.sleepSeg, { flex: 0.10, backgroundColor: colors.softTeal }]} />
            </View>
            <View style={styles.sleepLegend}>
              {[
                { color: colors.softTeal, label: 'Awake' },
                { color: colors.deepTeal, label: 'Light' },
                { color: colors.mintGreen, label: 'Deep' },
              ].map((l, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                  <Text style={styles.legendText}>{l.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* Recent Dreams */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Dreams</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { title: 'Ocean Voyage', mood: '😊', time: 'Yesterday', bg: '#1a3545' },
              { title: 'Mountain Peak', mood: '😌', time: '2 days ago', bg: '#2a3a2a' },
              { title: 'Starry Night', mood: '😴', time: '3 days ago', bg: '#1a1a3a' },
            ].map((d, i) => (
              <TouchableOpacity key={i}>
                <GlassCard style={[styles.recentCard, { backgroundColor: d.bg }]}>
                  <Text style={{ fontSize: 28 }}>{d.mood}</Text>
                  <Text style={styles.recentTitle}>{d.title}</Text>
                  <Text style={styles.recentTime}>{d.time}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: spacing.xxl },
  greeting: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  date: { ...typography.caption, color: colors.textSecondary },
  dreamCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  dreamImage: { width: '100%', height: 200, borderRadius: borderRadius.md, marginBottom: spacing.md },
  aiTag: {
    position: 'absolute', top: spacing.md + 8, right: spacing.md + 8,
    backgroundColor: 'rgba(139,180,171,0.7)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.sm,
  },
  aiTagText: { ...typography.small, color: colors.textPrimary },
  dreamTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  dreamSnippet: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  dreamMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  dreamTime: { ...typography.caption, color: colors.textTertiary },
  moodBadge: { backgroundColor: colors.softTeal, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  moodText: { ...typography.caption, color: colors.textPrimary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  miniTag: { backgroundColor: colors.deepTeal, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  miniTagText: { ...typography.small, color: colors.mintGreen },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  insightCard: { marginHorizontal: spacing.lg },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  aiLabel: { ...typography.caption, color: colors.mintGreen, fontWeight: '600' },
  insightText: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.md },
  symbolTitle: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
  symbolRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  symbolChip: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  symbolText: { ...typography.small, color: colors.textSecondary },
  suggestionCard: { width: 140, marginLeft: spacing.lg, alignItems: 'center' },
  suggestionIcon: { fontSize: 32, marginBottom: spacing.sm },
  suggestionLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.xs },
  suggestionValue: { ...typography.body, color: colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  suggestionDetail: { ...typography.small, color: colors.textTertiary, textAlign: 'center' },
  sleepCard: { marginHorizontal: spacing.lg },
  sleepScoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sleepScoreCircle: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: colors.mintGreen,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row',
  },
  sleepScoreValue: { ...typography.h2, color: colors.mintGreen },
  sleepScoreUnit: { ...typography.small, color: colors.mintGreen, marginTop: 4 },
  sleepScoreLabel: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  sleepScoreDesc: { ...typography.caption, color: colors.textSecondary },
  sleepDivider: { height: 1, backgroundColor: colors.deepTeal, marginBottom: spacing.md },
  sleepRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  sleepStat: { alignItems: 'center' },
  sleepLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.xs },
  sleepValue: { ...typography.h3, color: colors.mintGreen },
  sleepBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.sm },
  sleepSeg: { height: 8 },
  sleepLegend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.small, color: colors.textTertiary },
  recentCard: { width: 130, marginLeft: spacing.lg, alignItems: 'center', paddingVertical: spacing.lg },
  recentTitle: { ...typography.caption, color: colors.textPrimary, marginTop: spacing.sm, fontWeight: '600' },
  recentTime: { ...typography.small, color: colors.textTertiary, marginTop: 4 },
});

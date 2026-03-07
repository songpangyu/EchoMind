import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';

const DREAMS = [
  { id: '1', title: 'Misty Forest Walk', date: 'Feb 10', day: 10, mood: '😌', emotion: 'Peaceful', tags: ['Nature', 'Forest'], snippet: 'Walking through a misty forest with glowing fireflies...' },
  { id: '2', title: 'Ocean Voyage', date: 'Feb 9', day: 9, mood: '😊', emotion: 'Joyful', tags: ['Water', 'Adventure'], snippet: 'Sailing across a crystal-clear ocean under a golden sunset...' },
  { id: '3', title: 'Mountain Peak', date: 'Feb 8', day: 8, mood: '😴', emotion: 'Calm', tags: ['Adventure', 'Heights'], snippet: 'Standing on a snow-capped mountain, clouds below my feet...' },
  { id: '4', title: 'Starry Library', date: 'Feb 7', day: 7, mood: '🤔', emotion: 'Curious', tags: ['Books', 'Stars'], snippet: 'An infinite library where each book opened a portal to stars...' },
  { id: '5', title: 'Underwater Garden', date: 'Feb 6', day: 6, mood: '😊', emotion: 'Joyful', tags: ['Water', 'Nature'], snippet: 'Swimming through a garden of luminous coral and singing fish...' },
  { id: '6', title: 'Flying Over City', date: 'Feb 5', day: 5, mood: '😌', emotion: 'Peaceful', tags: ['Flying', 'City'], snippet: 'Soaring above a neon-lit city with wings made of light...' },
  { id: '7', title: 'Talking Animals', date: 'Feb 4', day: 4, mood: '😊', emotion: 'Joyful', tags: ['Animals', 'Fantasy'], snippet: 'A fox invited me to tea in a hollow tree trunk...' },
  { id: '8', title: 'Time Travel', date: 'Feb 3', day: 3, mood: '😰', emotion: 'Anxious', tags: ['Time', 'Past'], snippet: 'Kept jumping between childhood memories and future visions...' },
  { id: '9', title: 'Crystal Cave', date: 'Feb 2', day: 2, mood: '😌', emotion: 'Calm', tags: ['Cave', 'Crystals'], snippet: 'Discovered a cave filled with glowing amethyst crystals...' },
  { id: '10', title: 'Moonlit Dance', date: 'Feb 1', day: 1, mood: '😊', emotion: 'Joyful', tags: ['Moon', 'Dance'], snippet: 'Dancing with shadows under a giant silver moon...' },
];

const FILTERS = ['All', 'Peaceful', 'Joyful', 'Calm', 'Curious', 'Anxious'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FEB_START_DAY = 6; // Feb 1, 2025 = Saturday
const FEB_DAYS = 28;

export const JournalScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const filteredDreams = DREAMS.filter((d) => {
    const matchSearch = !searchText ||
      d.title.toLowerCase().includes(searchText.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(searchText.toLowerCase()));
    const matchFilter = activeFilter === 'All' || d.emotion === activeFilter;
    const matchDay = selectedDay === null || d.day === selectedDay;
    return matchSearch && matchFilter && matchDay;
  });

  const dreamDays = new Set(DREAMS.map(d => d.day));

  const renderCalendar = () => {
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < FEB_START_DAY; i++) {
      cells.push(<View key={`e-${i}`} style={styles.calCell} />);
    }
    for (let day = 1; day <= FEB_DAYS; day++) {
      const hasDream = dreamDays.has(day);
      const isSelected = selectedDay === day;
      const isToday = day === 10;
      cells.push(
        <TouchableOpacity
          key={day}
          style={[styles.calCell, isSelected && styles.calCellSelected, isToday && !isSelected && styles.calCellToday]}
          onPress={() => setSelectedDay(selectedDay === day ? null : day)}
        >
          <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected]}>{day}</Text>
          {hasDream && <View style={[styles.calDot, isSelected && styles.calDotSelected]} />}
        </TouchableOpacity>
      );
    }
    return cells;
  };

  return (
    <View style={styles.container}>
      <FloatingParticles />
      <View style={styles.header}>
        <Text style={styles.title}>Dream Journal</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]}
            onPress={() => { setViewMode('list'); setSelectedDay(null); }}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Text style={[styles.toggleText, viewMode === 'calendar' && styles.toggleTextActive]}>Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search dreams..."
            placeholderTextColor={colors.textTertiary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {viewMode === 'calendar' && (
          <GlassCard style={styles.calendarCard}>
            <Text style={styles.calMonth}>February 2025</Text>
            <View style={styles.calWeekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.calWeekday}>{w}</Text>
              ))}
            </View>
            <View style={styles.calGrid}>{renderCalendar()}</View>
            {selectedDay !== null && (
              <Text style={styles.calHint}>Tap again to clear filter</Text>
            )}
          </GlassCard>
        )}

        <View style={styles.listContainer}>
          {filteredDreams.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>🌙</Text>
              <Text style={styles.emptyText}>No dreams found</Text>
            </View>
          ) : (
            filteredDreams.map((dream) => (
              <GlassCard key={dream.id} style={styles.dreamItem}>
                <View style={styles.dreamHeader}>
                  <Text style={{ fontSize: 28 }}>{dream.mood}</Text>
                  <Text style={styles.dreamDate}>{dream.date}</Text>
                </View>
                <Text style={styles.dreamTitle}>{dream.title}</Text>
                <Text style={styles.dreamSnippet}>{dream.snippet}</Text>
                <View style={styles.dreamFooter}>
                  <View style={styles.emotionBadge}>
                    <Text style={styles.emotionText}>{dream.emotion}</Text>
                  </View>
                  <View style={styles.tagRow}>
                    {dream.tags.map((tag, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>
            ))
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingTop: spacing.xxl },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  viewToggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
  toggleActive: { backgroundColor: colors.softTeal },
  toggleText: { ...typography.body, color: colors.textTertiary },
  toggleTextActive: { color: colors.textPrimary, fontWeight: '600' },
  searchRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, color: colors.textPrimary, fontSize: 16 },
  filterScroll: { paddingLeft: spacing.lg, marginBottom: spacing.md, maxHeight: 40 },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full,
    backgroundColor: colors.surface, marginRight: spacing.sm,
  },
  filterChipActive: { backgroundColor: colors.softTeal },
  filterText: { ...typography.caption, color: colors.textTertiary },
  filterTextActive: { color: colors.textPrimary, fontWeight: '600' },
  scrollView: { flex: 1 },
  calendarCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  calMonth: { ...typography.h3, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md },
  calWeekRow: { flexDirection: 'row', marginBottom: spacing.sm },
  calWeekday: { flex: 1, textAlign: 'center', ...typography.small, color: colors.textTertiary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%' as any, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  calCellSelected: { backgroundColor: colors.softTeal, borderRadius: 20 },
  calCellToday: { borderWidth: 1, borderColor: colors.mintGreen, borderRadius: 20 },
  calDayText: { ...typography.caption, color: colors.textSecondary },
  calDayTextSelected: { color: colors.textPrimary, fontWeight: '600' },
  calDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.mintGreen, marginTop: 2 },
  calDotSelected: { backgroundColor: colors.textPrimary },
  calHint: { ...typography.small, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
  listContainer: { padding: spacing.lg },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
  dreamItem: { marginBottom: spacing.md },
  dreamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  dreamDate: { ...typography.caption, color: colors.textTertiary },
  dreamTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  dreamSnippet: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  dreamFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emotionBadge: { backgroundColor: colors.softTeal, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  emotionText: { ...typography.small, color: colors.textPrimary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { backgroundColor: colors.deepTeal, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  tagText: { ...typography.small, color: colors.mintGreen },
});

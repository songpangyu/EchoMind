import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import Icon, { IconName } from '../components/Icon';
import { listDreams, deleteDream, batchDeleteDreams, type Dream, type DreamMood } from '../api/dreams';
import { ScreenWrapper } from '../components/ScreenWrapper';

// ─── Types ──────────────────────────────────────────────────────────────────
type DreamEntry = {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  day: number;
  month: number;
  year: number;
  recordedTime: string;
  snippet: string;
  tags: { label: string }[];
  mood: MoodKey;
  isStarred: boolean;
  icon: IconName;
};

type MoodKey = DreamMood;

// ─── Constants ───────────────────────────────────────────────────────────────
const PHASE_COLORS = {
  asleep: '#6b8484', light: '#7da8c8', deep: '#5b7fc8',
  rem: '#b07ec8', wake: '#c8b87e', dream: '#7ec8a0',
};

const MOOD_META: Record<MoodKey, { color: string; label: string }> = {
  peaceful: { color: '#7ec8a0', label: 'Peaceful' },
  happy: { color: '#c8b87e', label: 'Happy' },
  anxious: { color: '#c87e7e', label: 'Anxious' },
  sad: { color: '#7da8c8', label: 'Sad' },
  calm: { color: '#b07ec8', label: 'Calm' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const NIGHT_TIMELINE = [
  { time: '23:10', label: 'Fell asleep', detail: 'Detected by sleep tracker', phaseColor: PHASE_COLORS.asleep },
  { time: '01:20', label: 'Deep Sleep phase', detail: 'Duration ~1h 40min', phaseColor: PHASE_COLORS.deep },
  {
    time: '03:10', label: 'REM Sleep phase', detail: 'Dream likely occurred here', phaseColor: PHASE_COLORS.rem,
    embedded: { type: 'window', text: 'System estimated dream window: 03:10–04:30' }
  },
  { time: '07:05', label: 'Woke up naturally', detail: 'Total sleep 7h 55min', phaseColor: PHASE_COLORS.wake },
  {
    time: '07:15', label: '🌲 Dream recorded', detail: '', phaseColor: PHASE_COLORS.dream,
    embedded: { type: 'record', text: 'Forest Lake Under Moonlight · 8 min voice note' }
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getMonthLabel = (year: number, month: number) =>
  new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const getIconForDream = (dream: Dream): IconName => {
  const tags = dream.tags.map(tag => tag.toLowerCase());
  if (tags.some(tag => tag.includes('forest') || tag.includes('nature'))) return 'tree';
  if (tags.some(tag => tag.includes('water') || tag.includes('lake') || tag.includes('ocean'))) return 'wave';
  if (tags.some(tag => tag.includes('star') || tag.includes('space'))) return 'galaxy';
  if (tags.some(tag => tag.includes('flower') || tag.includes('garden'))) return 'flower';
  if (tags.some(tag => tag.includes('city'))) return 'city';
  if (tags.some(tag => tag.includes('mountain'))) return 'mountain';
  return 'sparkle';
};

const toDreamEntry = (dream: Dream): DreamEntry => {
  const createdAt = new Date(dream.createdAt);
  return {
    id: dream.id,
    title: dream.title || 'Untitled Dream',
    date: createdAt.toISOString().slice(0, 10),
    day: createdAt.getDate(),
    month: createdAt.getMonth() + 1,
    year: createdAt.getFullYear(),
    recordedTime: createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    snippet: dream.transcript,
    tags: dream.tags.map(label => ({ label })),
    mood: dream.mood || 'calm',
    isStarred: dream.isFavorited,
    icon: getIconForDream(dream),
  };
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const JournalScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchText, setSearchText] = useState('');

  // Month navigation
  const today = new Date();
  const [monthYear, setMonthYear] = useState({ month: today.getMonth() + 1, year: today.getFullYear() });
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Calendar selection
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set(['2026-02-10']));

  // Multi-select
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Stars
  const [fetchedDreams, setFetchedDreams] = useState<DreamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  const monthLabel = getMonthLabel(monthYear.year, monthYear.month);
  const startDay = new Date(monthYear.year, monthYear.month - 1, 1).getDay();
  const daysInMonth = new Date(monthYear.year, monthYear.month, 0).getDate();
  const fullMoonDays: number[] = [];

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const response = await listDreams({
          month: monthYear.month,
          year: monthYear.year,
          q: searchText.trim() || undefined,
          pageSize: 100,
        });
        if (!active) {
          return;
        }
        const mapped = response.items.map(toDreamEntry);
        setFetchedDreams(mapped);
        setStarredIds(new Set(mapped.filter(dream => dream.isStarred).map(dream => dream.id)));
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Could not load dreams.');
          setFetchedDreams([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [monthYear.month, monthYear.year, searchText, reloadKey]);

  // ── Derived data ──
  const dreamsThisMonth = useMemo(() =>
    fetchedDreams.filter(d => d.month === monthYear.month && d.year === monthYear.year),
    [fetchedDreams, monthYear]);

  const dreamsByDay = useMemo(() => {
    const m: Record<number, DreamEntry[]> = {};
    dreamsThisMonth.forEach(d => { (m[d.day] = m[d.day] || []).push(d); });
    return m;
  }, [dreamsThisMonth]);

  const unrecordedDays = useMemo(() => {
    const currentDate = new Date();
    const limit = (monthYear.year === currentDate.getFullYear() && monthYear.month === currentDate.getMonth() + 1)
      ? currentDate.getDate() : daysInMonth;
    const result: number[] = [];
    for (let d = 1; d <= limit; d++) {
      if (!dreamsByDay[d]) result.push(d);
    }
    return result;
  }, [dreamsByDay, monthYear, daysInMonth]);

  const bestStreak = useMemo(() => {
    let best = 0, cur = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (dreamsByDay[d]) { cur++; best = Math.max(best, cur); } else cur = 0;
    }
    return best;
  }, [dreamsByDay, daysInMonth]);

  const starredCount = useMemo(
    () => dreamsThisMonth.filter(d => starredIds.has(d.id)).length,
    [dreamsThisMonth, starredIds]
  );

  // ── Search / filter ──
  const filteredDreams = useMemo(() => {
    return dreamsThisMonth;
  }, [dreamsThisMonth]);

  // Group filtered dreams by day in desc order
  const groupedByDay = useMemo(() => {
    const groups: { day: number; dreams: DreamEntry[] }[] = [];
    const days = [...new Set(filteredDreams.map(d => d.day))].sort((a, b) => b - a);
    days.forEach(day => {
      groups.push({ day, dreams: filteredDreams.filter(d => d.day === day) });
    });
    return groups;
  }, [filteredDreams]);

  // Last year on this day
  const lastYearDream = useMemo<DreamEntry | null>(() => null, []);

  // ── Toast ──
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info'>('success');
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'info' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    setToastType(type);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400);
  }, [toastAnim]);

  // ── Actions ──
  const toggleExpand = (dateStr: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr);
      return next;
    });
  };

  const toggleStar = (id: string) => {
    const willStar = !starredIds.has(id);
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    showToast(willStar ? '⭐ Added to favorites' : '✓ Removed from favorites');
  };

  const enterMultiSelect = (id: string) => {
    setMultiSelectMode(true);
    setSelectedIds(new Set([id]));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitMultiSelect = () => {
    setMultiSelectMode(false);
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    const count = selectedIds.size;
    Alert.alert(
      `Delete ${count} Dream${count > 1 ? 's' : ''}`,
      `Permanently delete ${count} dream record${count > 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await batchDeleteDreams(Array.from(selectedIds));
              exitMultiSelect();
              showToast(`🗑 ${count} dream${count > 1 ? 's' : ''} deleted`);
              setReloadKey(k => k + 1);
            } catch (error) {
              showToast('Failed to delete dreams');
            }
          },
        },
      ]
    );
  };

  const handleMore = (dream: DreamEntry) => {
    Alert.alert(dream.title, 'What would you like to do?', [
      {
        text: '🗑 Delete Dream',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Dream',
            `Permanently delete "${dream.title}"? This cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteDream(dream.id);
                    showToast('🗑 Dream deleted');
                    setReloadKey(k => k + 1);
                  } catch (error) {
                    showToast('Failed to delete dream');
                  }
                },
              },
            ]
          );
        },
      },
      {
        text: '🌍 Share to Community',
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Community', params: { shared: true } } } as any],
          });
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const prevMonth = () => {
    setMonthYear(prev => prev.month === 1
      ? { month: 12, year: prev.year - 1 }
      : { month: prev.month - 1, year: prev.year });
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setMonthYear(prev => prev.month === 12
      ? { month: 1, year: prev.year + 1 }
      : { month: prev.month + 1, year: prev.year });
    setSelectedDay(null);
  };

  // ── Highlight search match ──
  const highlight = (text: string, query: string) => {
    if (!query.trim()) return <Text style={styles.dreamSnippet}>{text}</Text>;
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return <Text style={styles.dreamSnippet}>{text}</Text>;
    return (
      <Text style={styles.dreamSnippet}>
        {text.slice(0, idx)}
        <Text style={styles.highlight}>{text.slice(idx, idx + q.length)}</Text>
        {text.slice(idx + q.length)}
      </Text>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ── Sub-renders ──
  // ─────────────────────────────────────────────────────────────────────────

  const renderDreamCard = (dream: DreamEntry, key: string) => {
    const isSelected = selectedIds.has(dream.id);
    const isStarred = starredIds.has(dream.id);
    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.85}
        onPress={() => {
          if (multiSelectMode) { toggleSelect(dream.id); return; }
          navigation.navigate('DreamDetail', { dreamId: dream.id });
        }}
        onLongPress={() => enterMultiSelect(dream.id)}
        delayLongPress={400}
      >
        <GlassCard style={[styles.dreamCard, isSelected ? styles.dreamCardSelected : {}]}>
          {/* Multi-select checkbox */}
          {multiSelectMode && (
            <View style={[styles.checkbox, isSelected ? styles.checkboxChecked : {}]}>
              {isSelected && <Text style={{ color: colors.background, fontSize: 12, fontWeight: '700' }}>✓</Text>}
            </View>
          )}

          {/* Top: icon + content */}
          <View style={styles.cardTop}>
            <View style={styles.cardThumb}>
              <Icon name={dream.icon} size={28} color={colors.mintGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.dreamTitle} numberOfLines={1}>{dream.title}</Text>
                {(() => {
                  const MOOD_EMOJI: Record<MoodKey, string> = {
                    peaceful: '😌', happy: '😊', anxious: '😰',
                    sad: '😢', calm: '😴',
                  };
                  return (
                    <View style={styles.moodPill}>
                      <Text style={{ fontSize: 12 }}>{MOOD_EMOJI[dream.mood]}</Text>
                      <Text style={[styles.moodPillText, { fontSize: 10, marginLeft: 4 }]}>
                        {MOOD_META[dream.mood]?.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>
              <Text style={styles.dreamMeta}>
                {dream.recordedTime}
              </Text>
              {highlight(dream.snippet, searchText)}
            </View>
          </View>

          {/* Bottom: tags and more button */}
          <View style={styles.cardBottom}>
            {!multiSelectMode && (
              <>
                <View style={styles.tagsRow}>
                  {dream.tags.slice(0, 3).map((tag, idx) => (
                    <View key={idx} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag.label}</Text>
                    </View>
                  ))}
                  {dream.tags.length > 3 && (
                    <Text style={{ color: colors.textTertiary, fontSize: 12, marginLeft: 2, alignSelf: 'center' }}>+{dream.tags.length - 3}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.moreBtn} onPress={() => handleMore(dream)}>
                  <Text style={styles.moreBtnText}>···</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  // Mood-tinted background for calendar cell
  const getMoodBg = (mood: MoodKey): string => {
    const baseColors: Record<MoodKey, string> = {
      peaceful: '#2a3d2a',
      happy: '#3d3220',
      anxious: '#3d2a2a',
      sad: '#202a3d',
      calm: '#2e2040',
    };
    return baseColors[mood] ?? '#1e2e2e';
  };

  const renderCalendarGrid = () => {
    const cells: React.ReactNode[] = [];
    // Empty leading cells
    for (let i = 0; i < startDay; i++) {
      cells.push(<View key={`e-${i}`} style={styles.calCell} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDreams = dreamsByDay[day] || [];
      const hasDreams = dayDreams.length > 0;
      const isSelected = selectedDay === day;
      const isFullMoon = fullMoonDays.includes(day);
      const topMood = dayDreams[0]?.mood;
      const moodBg = topMood ? getMoodBg(topMood) : null;
      const moodBorder = topMood ? MOOD_META[topMood].color + '50' : null;

      if (!hasDreams) {
        // Empty day: just a number, no card
        cells.push(
          <View key={day} style={styles.calCell}>
            <Text style={styles.calEmptyNum}>{day}</Text>
          </View>
        );
      } else {
        // Dream day: card with mood tint
        cells.push(
          <TouchableOpacity
            key={day}
            style={styles.calCell}
            onPress={() => setSelectedDay(isSelected ? null : day)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.calDreamCard,
              { backgroundColor: isSelected ? '#b5d9a8' : (moodBg ?? '#1e2e2e') },
              moodBorder && !isSelected ? { borderColor: moodBorder, borderWidth: 1 } : {},
            ]}>
              {/* Mood color dot top-right (last dream's mood) */}
              {(() => {
                const lastMood = dayDreams[dayDreams.length - 1]?.mood;
                const dotColor = lastMood ? MOOD_META[lastMood].color : null;
                return dotColor ? (
                  <View style={[styles.calMoodDot, { backgroundColor: dotColor }]} />
                ) : null;
              })()}
              {/* Day number */}
              <Text style={[
                styles.calDayNum,
                isSelected && { color: '#1a2f2f' },
              ]}>{day}</Text>
              {/* Dream emoji removed — keep minimal */}
              {/* Multiple dreams badge */}
              {dayDreams.length > 1 && (
                <View style={styles.calMultiBadge}>
                  <Text style={styles.calMultiText}>+{dayDreams.length - 1}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      }
    }
    return cells;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ── Main render ──
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper>
    <View style={styles.container}>
      <FloatingParticles />

      {/* ── Multi-select top bar ── */}
      {multiSelectMode && (
        <View style={[styles.multiSelectBar, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={exitMultiSelect} style={styles.multiBtn}>
            <Text style={styles.multiBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.multiCount}>{selectedIds.size} selected</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <TouchableOpacity onPress={() => setSelectedIds(new Set(filteredDreams.map(d => d.id)))}>
              <Text style={styles.multiBtnText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMultiSelectMode(false); deleteSelected(); }}>
              <Text style={[styles.multiBtnText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 8 }}>
        {/* ── Header removed ── */}



        {/* ── Search ── */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dreams, tags..."
              placeholderTextColor={colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Icon name="close" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* ── Stats bar ── */}
        <GlassCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            {[
              { value: dreamsThisMonth.length, label: 'This Month' },
              { value: bestStreak, label: 'Streak Days' },
              { value: dreamsThisMonth.length > 0 ? `${Math.round((dreamsThisMonth.length / daysInMonth) * 100)}%` : '0%', label: 'Record Rate' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </GlassCard>

        {(loading || errorMessage) && (
          <GlassCard style={styles.statusCard}>
            {loading ? (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={colors.mintGreen} />
                <Text style={styles.statusText}>Loading dreams...</Text>
              </View>
            ) : (
              <Text style={styles.statusErrorText}>{errorMessage}</Text>
            )}
          </GlassCard>
        )}

        {/* ── List / Calendar toggle ── */}
        <View style={styles.toggleWrap}>
          {(['list', 'calendar'] as const).map(mode => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.toggleBtn,
                viewMode === mode && styles.toggleBtnActive,
                { flexDirection: 'row', justifyContent: 'center', gap: 6 }
              ]}
              onPress={() => { setViewMode(mode); setSelectedDay(null); }}
              activeOpacity={0.7}
            >
              <Icon
                name={mode === 'list' ? 'list' : 'calendar'}
                size={16}
                color={viewMode === mode ? colors.deepTeal : colors.textTertiary}
                strokeWidth={2}
              />
              <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>
                {mode === 'list' ? 'List' : 'Calendar'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─────── CALENDAR VIEW ─────── */}
        {viewMode === 'calendar' && (
          <>
            {/* Month navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
                <Text style={styles.monthArrowText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity onLongPress={() => setShowYearPicker(true)} activeOpacity={0.7}>
                <Text style={styles.monthLabel}>{monthLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
                <Text style={styles.monthArrowText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Mood legend — one row */}
            <View style={styles.moodLegendRow}>
              <Text style={styles.moodLegendLabel}>Mood:</Text>
              {(Object.entries(MOOD_META) as [MoodKey, { color: string; label: string }][]).filter(([k]) => k !== 'calm').map(([key, { color, label }]) => (
                <View key={key} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{label}</Text>
                </View>
              ))}
              <View style={{ flex: 1 }} />
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f5c842' }]} />
                <Text style={[styles.legendText, { fontWeight: '600' }]}>Full Moon</Text>
              </View>
            </View>

            {/* Calendar grid — no outer card */}
            <View style={styles.calendarWrap}>
              {/* Week headers */}
              <View style={styles.calWeekRow}>
                {WEEKDAYS.map(w => (
                  <Text key={w} style={styles.calWeekday}>{w}</Text>
                ))}
              </View>
              {/* Cells */}
              <View style={styles.calGrid}>
                {renderCalendarGrid()}
              </View>
            </View>

            {/* ── Inline dream cards for selected day ── */}
            {selectedDay !== null && (
              <View style={styles.calSelectedSection}>
                {(dreamsByDay[selectedDay] || []).length === 0 ? (
                  <View style={styles.calEmptyDay}>
                    <Text style={styles.calEmptyDayText}>🌙 No dreams recorded on this day</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.calSelectedDayLabel}>
                      {monthLabel.split(' ')[0]} {selectedDay} · {(dreamsByDay[selectedDay] || []).length} dream{(dreamsByDay[selectedDay] || []).length > 1 ? 's' : ''}
                    </Text>
                    {(dreamsByDay[selectedDay] || []).map(d => renderDreamCard(d, `cal-${d.id}`))}
                  </>
                )}
              </View>
            )}

            {/* Journal stats dashboard */}

            <GlassCard style={styles.journalStatsCard}>
              <View style={styles.journalStatsHeader}>
                <Text style={styles.journalStatsTitle}>Journal Stats</Text>
              </View>
              <View style={styles.journalStatsGrid}>
                <View style={styles.journalStatBox}>
                  <Text style={styles.journalStatBig}>{bestStreak} days</Text>
                  <Text style={styles.journalStatSub}>Best Streak</Text>
                  <Text style={styles.journalStatNote}>Feb 1 – Feb {bestStreak}</Text>
                </View>
                <View style={styles.journalStatBox}>
                  <Text style={styles.journalStatBig}>{starredCount} dreams</Text>
                  <Text style={styles.journalStatSub}>Starred Dreams</Text>
                  <Text style={styles.journalStatNote}>Your favorites</Text>
                </View>
                <View style={styles.journalStatBox}>
                  <Text style={styles.journalStatBig}>{dreamsThisMonth.length}/{daysInMonth}</Text>
                  <Text style={styles.journalStatSub}>Days Recorded</Text>
                  <Text style={styles.journalStatNote}>{Math.round((dreamsThisMonth.length / daysInMonth) * 100)}% this month</Text>
                </View>
                <View style={styles.journalStatBox}>
                  <Text style={styles.journalStatBig}>{unrecordedDays.length} days</Text>
                  <Text style={styles.journalStatSub}>Unrecorded Days</Text>
                  <Text style={styles.journalStatNote}>See gaps below</Text>
                </View>
              </View>
            </GlassCard>

            {/* Unrecorded nights */}
            {unrecordedDays.length > 0 && (
              <GlassCard style={styles.unrecordedCard}>
                <View style={styles.unrecordedHeader}>
                  <Text style={styles.unrecordedTitle}>Unrecorded Nights</Text>
                </View>
                <View style={styles.unrecordedChips}>
                  {unrecordedDays.slice(0, 8).map(d => (
                    <View key={d} style={styles.unrecordedChip}>
                      <Text style={styles.unrecordedChipText}>
                        {monthLabel.split(' ')[0].slice(0, 3)} {d}
                      </Text>
                    </View>
                  ))}
                  {unrecordedDays.length > 8 && (
                    <View style={styles.unrecordedChip}>
                      <Text style={styles.unrecordedChipText}>+{unrecordedDays.length - 8} more</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            )}
          </>
        )}

        {/* ─────── LIST VIEW ─────── */}
        {viewMode === 'list' && (
          <View style={styles.listSection}>
            {/* ON THIS DAY LAST YEAR */}
            {lastYearDream && !searchText && (
              <View style={styles.lastYearSection}>
                <Text style={styles.lastYearHeader}>🕰  ON THIS DAY LAST YEAR</Text>
                {renderDreamCard(lastYearDream, `ly-${lastYearDream.id}`)}
              </View>
            )}

            {searchText.trim() !== '' && filteredDreams.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Icon name="search" size={36} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No dreams found for "{searchText}"</Text>
              </GlassCard>
            ) : (
              <>
                {/* Month header */}
                {!searchText && (
                  <View style={styles.listMonthHeader}>
                    <Text style={styles.listMonthText}>{monthLabel}</Text>
                    <Text style={styles.listMonthCount}>{dreamsThisMonth.length} dreams</Text>
                  </View>
                )}
                {groupedByDay.map(({ day, dreams }) => {
                  const dateKey = `${monthYear.year}-${String(monthYear.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasMultiple = dreams.length > 1;
                  const isExpanded = expandedDates.has(dateKey);
                  const displayDreams = hasMultiple && !isExpanded ? dreams.slice(0, 1) : dreams;

                  return (
                    <View key={dateKey}>
                      {/* Date group header */}
                      <TouchableOpacity
                        style={styles.dateGroupHeader}
                        onPress={() => hasMultiple && toggleExpand(dateKey)}
                        activeOpacity={hasMultiple ? 0.7 : 1}
                      >
                        <View style={styles.dateHeaderDot} />
                        <Text style={styles.dateHeaderText}>Dreams on {monthLabel.split(' ')[0].slice(0, 3)} {day}</Text>
                        {hasMultiple && (
                          <View style={styles.dateCountBadge}>
                            <Text style={styles.dateCountText}>{dreams.length}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      {displayDreams.map(d => renderDreamCard(d, d.id))}
                      {hasMultiple && (
                        <TouchableOpacity
                          onPress={() => toggleExpand(dateKey)}
                          style={styles.expandBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.expandBtnText}>
                            {isExpanded
                              ? '▲  Collapse'
                              : `▼  Show ${dreams.length - 1} more dream${dreams.length - 1 > 1 ? 's' : ''} tonight`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </>
            )}

            {/* NIGHT TIMELINE (below today's dreams) */}
            <GlassCard style={styles.timelineCard}>
              <View style={styles.timelineHeader}>
                <Icon name="moon" size={18} color={colors.mintGreen} />
                <Text style={styles.timelineTitle}>NIGHT TIMELINE · FEB 10</Text>
              </View>
              {NIGHT_TIMELINE.map((item, i) => (
                <View key={i} style={styles.timelineItem}>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                  <View style={styles.dotCol}>
                    <View style={[styles.dot, { backgroundColor: item.phaseColor }]} />
                    {i < NIGHT_TIMELINE.length - 1 && (
                      <View style={[styles.connector, { backgroundColor: item.phaseColor + '40' }]} />
                    )}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.timelineLabel}>{item.label}</Text>
                    {item.detail ? <Text style={styles.timelineDetail}>{item.detail}</Text> : null}
                    {item.embedded && (
                      <View style={[
                        styles.embeddedCard,
                        item.embedded.type === 'window' ? styles.embeddedWindow : styles.embeddedRecord,
                      ]}>
                        <Text style={[
                          styles.embeddedText,
                          { color: item.embedded.type === 'window' ? PHASE_COLORS.rem : PHASE_COLORS.dream }
                        ]}>{item.embedded.text}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
              <View style={styles.wearableNote}>
                <Text style={styles.wearableText}>⌚ Sleep data via Apple Health · Apple Watch</Text>
              </View>
            </GlassCard>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Year picker modal ── */}
      <Modal visible={showYearPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowYearPicker(false)}>
          <View style={styles.yearPickerBox}>
            <Text style={styles.yearPickerTitle}>Select Year</Text>
            <ScrollView>
              {[2023, 2024, 2025, 2026, 2027].map(y => (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearItem, y === monthYear.year && styles.yearItemActive]}
                  onPress={() => { setMonthYear(p => ({ ...p, year: y })); setShowYearPicker(false); }}
                >
                  <Text style={[styles.yearItemText, y === monthYear.year && { color: colors.mintGreen, fontWeight: '700' }]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Toast ── */}
      {toastMsg !== '' && (
        <Animated.View
          style={[
            styles.toast,
            toastType === 'info' && styles.toastInfo,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
    </View>
    </ScreenWrapper>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Multi-select bar
  multiSelectBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.deepTeal,
    paddingTop: 0,
  },
  multiBtn: {},
  multiBtnText: { ...typography.body, color: colors.mintGreen, fontWeight: '600' },
  multiCount: { ...typography.body, color: colors.textPrimary },

  // Header
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  pageTitle: { ...typography.h1, color: colors.textPrimary },

  // Search
  searchWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(181,217,168,0.1)',
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary },
  highlight: { backgroundColor: 'rgba(181,217,168,0.2)', color: colors.mintGreen, fontWeight: '700' },

  // Stats
  statsCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: 0, overflow: 'hidden' },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statValue: { ...typography.h2, color: colors.mintGreen, fontWeight: '700' },
  statLabel: { ...typography.small, color: colors.textTertiary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.deepTeal, marginVertical: spacing.sm },
  statusCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusText: { ...typography.body, color: colors.textSecondary },
  statusErrorText: { ...typography.body, color: colors.error },

  // Toggle
  toggleWrap: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
  toggleBtnActive: { backgroundColor: colors.mintGreen },
  toggleText: { ...typography.caption, color: colors.textTertiary },
  toggleTextActive: { color: colors.deepTeal, fontWeight: '700' as const },

  // Progress banner
  progressCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  progressText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  progressBarBg: { height: 6, backgroundColor: colors.deepTeal, borderRadius: 3, marginBottom: spacing.xs },
  progressBarFill: { height: 6, backgroundColor: colors.mintGreen, borderRadius: 3 },
  progressSub: { ...typography.small, color: colors.textTertiary },

  // Month nav
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  monthArrow: { padding: spacing.sm },
  monthArrowText: { fontSize: 28, color: colors.textSecondary },
  monthLabel: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  monthHint: { ...typography.small, color: colors.textTertiary, textAlign: 'center', fontSize: 10 },

  // Mood legend
  moodLegend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.small, color: colors.textTertiary },

  // Calendar
  calendarCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  calWeekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  calWeekday: { flex: 1, textAlign: 'center', ...typography.small, color: colors.textTertiary, fontWeight: '600' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: '14.28%' as any, aspectRatio: 0.9,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4, position: 'relative',
  },
  calCellSelected: { backgroundColor: colors.softTeal + '60', borderRadius: 10 },
  calDayNum: { ...typography.small, color: colors.textSecondary, marginBottom: 2 },
  calDayNumSelected: { color: colors.textPrimary, fontWeight: '700' },
  countBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 3,
    borderWidth: 1, borderColor: colors.deepTeal,
  },
  countText: { fontSize: 9, color: colors.textTertiary, fontWeight: '700' },

  // Journal stats dashboard
  journalStatsCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  journalStatsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  journalStatsTitle: { ...typography.small, color: colors.textTertiary, fontWeight: '700', letterSpacing: 1.2,fontSize: 14 },
  journalStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  journalStatBox: {
    width: '47%' as any, backgroundColor: colors.surface,
    borderRadius: borderRadius.md, padding: spacing.md,
    borderWidth: 1, borderColor: 'rgba(181,217,168,0.08)',
  },
  journalStatBig: { ...typography.caption, color: colors.mintGreen, fontWeight: '700', marginBottom: 2 },
  journalStatSub: { ...typography.small, color: colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  journalStatNote: { ...typography.small, color: colors.textTertiary },

  // Unrecorded
  unrecordedCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  unrecordedHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  unrecordedTitle: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  unrecordedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  unrecordedChip: {
    backgroundColor: 'rgba(198,126,126,0.12)', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(240, 126, 126, 0.25)',
  },
  unrecordedChipText: { ...typography.small, color: colors.error },

  // List view
  listSection: { paddingHorizontal: spacing.lg },
  lastYearSection: { marginBottom: spacing.md },
  lastYearHeader: { ...typography.small, color: colors.textTertiary, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm },

  // Date group
  dateGroupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, marginBottom: spacing.xs,
  },
  dateHeaderDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.mintGreen },
  dateHeaderText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600', flex: 1 },
  dateHeaderChevron: { ...typography.small, color: colors.textTertiary },

  // Month label in list view
  listMonthHeader: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.mintGreen + '30',
  },
  listMonthText: { ...typography.h3, color: colors.textPrimary },
  listMonthCount: { ...typography.caption, color: colors.textTertiary },

  // Date count badge (next to date header when multiple dreams)
  dateCountBadge: {
    backgroundColor: colors.mintGreen + '25',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1, borderColor: colors.mintGreen + '50',
  },
  dateCountText: { ...typography.small, color: colors.mintGreen, fontWeight: '700' as const },

  // Expand / collapse button
  expandBtn: {
    alignSelf: 'center' as const,
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.softTeal + '60',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  expandBtnText: { ...typography.caption, color: colors.softTeal, fontWeight: '600' as const },

  showMoreBtn: { alignItems: 'center' as const, paddingVertical: spacing.sm, marginBottom: spacing.md },
  showMoreText: { ...typography.small, color: colors.softTeal, fontWeight: '600' as const },

  // Dream card
  dreamCard: { marginBottom: spacing.md },
  dreamCardSelected: { borderColor: colors.mintGreen, borderWidth: 1.5 },
  checkbox: {
    position: 'absolute', top: spacing.md, left: spacing.md,
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: colors.textTertiary,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  checkboxChecked: { backgroundColor: colors.mintGreen, borderColor: colors.mintGreen },

  cardTop: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  cardThumb: {
    width: 64, height: 64, borderRadius: borderRadius.md,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(181,217,168,0.1)',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2, flexWrap: 'wrap' },
  dreamTitle: { ...typography.caption, color: colors.textPrimary, fontWeight: '700', fontSize: 15, flex: 1 },
  lucidBadge: {
    backgroundColor: 'rgba(198,184,126,0.15)', borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.warning,
  },
  lucidText: { ...typography.small, color: colors.warning, fontWeight: '800', letterSpacing: 0.8 },
  dreamMeta: { ...typography.small, color: colors.textTertiary, marginBottom: spacing.xs },
  dreamSnippet: { ...typography.small, color: colors.textSecondary, lineHeight: 18 },

  cardBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(181,217,168,0.06)',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 },
  tagChip: { backgroundColor: colors.deepTeal, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  tagText: { ...typography.small, color: colors.mintGreen },
  voiceBadge: {
    backgroundColor: 'rgba(126,200,160,0.1)', paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: borderRadius.sm, borderWidth: 1, borderColor: 'rgba(126,200,160,0.2)',
  },
  voiceText: { ...typography.small, color: colors.glowGreen, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginLeft: spacing.sm },
  moreBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center' as const, justifyContent: 'center' as const },
  moreBtnText: { fontSize: 16, color: colors.textSecondary, fontWeight: '700' as const, letterSpacing: 2 },

  // Mood pill (matches HomeScreen moodBadge)
  moodPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(181,217,168,0.15)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.mintGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  moodPillText: { ...typography.small, color: colors.mintGreen, fontWeight: '600' as const },

  // Empty
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { ...typography.body, color: colors.textSecondary },

  // Night Timeline
  timelineCard: { marginBottom: spacing.md },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  timelineTitle: { ...typography.small, color: colors.textTertiary, fontWeight: '700', letterSpacing: 1.5 },
  timelineItem: { flexDirection: 'row', minHeight: 52 },
  timelineTime: { width: 44, ...typography.small, color: colors.textTertiary, textAlign: 'right', paddingTop: 2 },
  dotCol: { width: 28, alignItems: 'center', paddingTop: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  connector: { width: 2, flex: 1, marginTop: 2 },
  timelineRight: { flex: 1, paddingBottom: spacing.md },
  timelineLabel: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  timelineDetail: { ...typography.small, color: colors.textTertiary, marginTop: 2 },
  embeddedCard: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1 },
  embeddedWindow: { backgroundColor: 'rgba(176,126,200,0.08)', borderColor: 'rgba(176,126,200,0.25)' },
  embeddedRecord: { backgroundColor: 'rgba(126,200,160,0.08)', borderColor: 'rgba(126,200,160,0.25)' },
  embeddedText: { ...typography.small, fontWeight: '600' },
  wearableNote: { paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(181,217,168,0.06)', marginTop: spacing.xs },
  wearableText: { ...typography.small, color: colors.textTertiary, fontStyle: 'italic' },

  // Year picker
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  yearPickerBox: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, width: 200, maxHeight: 300,
    borderWidth: 1, borderColor: 'rgba(181,217,168,0.15)',
  },
  yearPickerTitle: { ...typography.caption, color: colors.textTertiary, fontWeight: '700', textAlign: 'center', marginBottom: spacing.md },
  yearItem: { paddingVertical: spacing.md, alignItems: 'center', borderRadius: borderRadius.sm },
  yearItemActive: { backgroundColor: 'rgba(181,217,168,0.1)' },
  yearItemText: { ...typography.body, color: colors.textSecondary },

  // Calendar selected day section
  calSelectedSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  calSelectedDayLabel: {
    ...typography.caption, color: colors.mintGreen, fontWeight: '700',
    marginBottom: spacing.sm, letterSpacing: 0.5,
  },
  calEmptyDay: { paddingVertical: spacing.md, alignItems: 'center' as const },
  calEmptyDayText: { ...typography.caption, color: colors.textTertiary },

  // New calendar cell styles (screenshot-matching)
  calendarWrap: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  moodLegendRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm,
  },
  moodLegendLabel: { ...typography.small, color: colors.textTertiary },
  calEmptyNum: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' as const },
  calDreamCard: {
    width: '88%' as any, aspectRatio: 1,
    borderRadius: 12, padding: spacing.xs,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    position: 'relative' as const, overflow: 'visible' as const,
  },
  calFullMoonDot: {
    position: 'absolute' as const, top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#f5c842',
  },
  calFullMoonDotEmpty: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#f5c842', marginTop: 2,
  },
  calDreamEmoji: { fontSize: 26, marginTop: 2 },
  calMultiBadge: {
    position: 'absolute' as const, bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  calMultiText: { fontSize: 9, color: '#e8f4f4', fontWeight: '700' as const },
  calMoodDot: {
    position: 'absolute' as const, top: 5, right: 5,
    width: 8, height: 8, borderRadius: 4,
  },

  // Toast
  toast: {
    position: 'absolute' as const,
    bottom: 110,
    alignSelf: 'center' as const,
    backgroundColor: 'rgba(26,47,47,0.95)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.mintGreen + '60',
    shadowColor: colors.mintGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  toastInfo: {
    borderColor: colors.softTeal + '60',
    shadowColor: colors.softTeal,
  },
  toastText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
});

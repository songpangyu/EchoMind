import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

const WEEKLY_DATA = [
    { day: 'Mon', dreams: 2, sleep: 7.5 },
    { day: 'Tue', dreams: 1, sleep: 6.8 },
    { day: 'Wed', dreams: 3, sleep: 8.1 },
    { day: 'Thu', dreams: 1, sleep: 7.2 },
    { day: 'Fri', dreams: 2, sleep: 7.8 },
    { day: 'Sat', dreams: 4, sleep: 8.5 },
    { day: 'Sun', dreams: 2, sleep: 7.0 },
];

const THEMES = [
    { name: 'Nature', count: 12, pct: 0.8 },
    { name: 'Water', count: 8, pct: 0.6 },
    { name: 'Flying', count: 5, pct: 0.4 },
    { name: 'Animals', count: 4, pct: 0.3 },
    { name: 'Stars', count: 3, pct: 0.2 },
];

const MOODS = [
    { emoji: '😌', label: 'Peaceful', pct: 35, color: colors.mintGreen },
    { emoji: '😊', label: 'Joyful', pct: 25, color: colors.softTeal },
    { emoji: '😴', label: 'Calm', pct: 15, color: colors.glowGreen },
    { emoji: '🤔', label: 'Curious', pct: 15, color: colors.fogWhite },
    { emoji: '😰', label: 'Anxious', pct: 10, color: colors.warning },
];

const MONTHLY_DREAMS = [3, 5, 2, 4, 6, 3, 7, 4, 5, 8, 6, 3];
const MONTH_LABELS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

const MENU_ITEMS = [
    { icon: '🔔', label: 'Notifications', route: 'Notifications' as keyof RootStackParamList },
    { icon: '⭐', label: 'Saved Dreams', route: 'SavedDreams' as keyof RootStackParamList },
    { icon: '✏️', label: 'Edit Profile', route: 'EditProfile' as keyof RootStackParamList },
    { icon: '🔒', label: 'Privacy', route: 'Privacy' as keyof RootStackParamList },
    { icon: '❓', label: 'Help & Support', route: 'HelpSupport' as keyof RootStackParamList },
];

export const MeScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [tab, setTab] = useState<'profile' | 'insights'>('profile');
    const [period, setPeriod] = useState<'week' | 'month'>('week');
    const maxDreams = Math.max(...WEEKLY_DATA.map(d => d.dreams));
    const maxMonthly = Math.max(...MONTHLY_DREAMS);

    return (
        <View style={styles.container}>
            <FloatingParticles />
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                        <View style={styles.avatarWrapper}>
                            <Text style={styles.avatarEmoji}>🌙</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                        <Text style={styles.username}>Dreamer</Text>
                    </TouchableOpacity>
                    <Text style={styles.userSub}>Exploring the dreamscape since 2024</Text>
                    <View style={styles.statsRow}>
                        {[
                            { value: '24', label: 'Dreams' },
                            { value: '12', label: 'Streak' },
                            { value: '7', label: 'Shared' },
                        ].map((s, i) => (
                            <View key={i} style={styles.profileStat}>
                                <Text style={styles.profileStatValue}>{s.value}</Text>
                                <Text style={styles.profileStatLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Tab Switch */}
                <View style={styles.tabSwitch}>
                    {(['profile', 'insights'] as const).map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                            onPress={() => setTab(t)}
                        >
                            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                                {t === 'profile' ? '👤 Profile' : '📊 Insights'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {tab === 'profile' ? (
                    /* Profile Settings */
                    <View style={styles.menuSection}>
                        {MENU_ITEMS.map((item, i) => (
                            <TouchableOpacity key={i} onPress={() => navigation.navigate(item.route as any)}>
                                <GlassCard style={styles.menuItem}>
                                    <Text style={styles.menuIcon}>{item.icon}</Text>
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                    <Text style={styles.menuArrow}>›</Text>
                                </GlassCard>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.logoutBtn}>
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Insights Section */
                    <View style={{ paddingBottom: 20 }}>
                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            {[
                                { value: '24', label: 'Dreams', icon: '🌙' },
                                { value: '7.5h', label: 'Avg Sleep', icon: '😴' },
                                { value: '85%', label: 'Recall Rate', icon: '🧠' },
                                { value: '12', label: 'Day Streak', icon: '🔥' },
                            ].map((s, i) => (
                                <GlassCard key={i} style={styles.statCard}>
                                    <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                                    <Text style={styles.statValue}>{s.value}</Text>
                                    <Text style={styles.statLabel}>{s.label}</Text>
                                </GlassCard>
                            ))}
                        </View>

                        {/* Period Toggle */}
                        <View style={styles.periodToggle}>
                            {(['week', 'month'] as const).map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                                    onPress={() => setPeriod(p)}
                                >
                                    <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                                        {p === 'week' ? 'This Week' : 'This Year'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Dream Frequency Chart */}
                        <GlassCard style={styles.chartCard}>
                            <Text style={styles.chartTitle}>Dream Frequency</Text>
                            {period === 'week' ? (
                                <View style={styles.barChart}>
                                    {WEEKLY_DATA.map((d, i) => (
                                        <View key={i} style={styles.barCol}>
                                            <View style={styles.barWrapper}>
                                                <View style={[styles.bar, { height: `${(d.dreams / maxDreams) * 100}%` }]} />
                                            </View>
                                            <Text style={styles.barLabel}>{d.day}</Text>
                                            <Text style={styles.barValue}>{d.dreams}</Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.barChart}>
                                    {MONTHLY_DREAMS.map((d, i) => (
                                        <View key={i} style={styles.barColSmall}>
                                            <View style={styles.barWrapper}>
                                                <View style={[styles.bar, { height: `${(d / maxMonthly) * 100}%` }]} />
                                            </View>
                                            <Text style={styles.barLabelSmall}>{MONTH_LABELS[i]}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </GlassCard>

                        {/* Sleep Trend */}
                        <GlassCard style={styles.chartCard}>
                            <Text style={styles.chartTitle}>Sleep Duration Trend</Text>
                            <View style={styles.lineChart}>
                                {WEEKLY_DATA.map((d, i) => {
                                    const h = ((d.sleep - 6) / 3) * 100;
                                    return (
                                        <View key={i} style={styles.lineCol}>
                                            <View style={styles.lineBarWrapper}>
                                                <View style={[styles.lineBar, { height: `${Math.max(h, 10)}%` }]} />
                                            </View>
                                            <Text style={styles.barLabel}>{d.day}</Text>
                                            <Text style={styles.lineValue}>{d.sleep}h</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </GlassCard>

                        {/* Most Common Themes */}
                        <GlassCard style={styles.chartCard}>
                            <Text style={styles.chartTitle}>Most Common Themes</Text>
                            {THEMES.map((t, i) => (
                                <View key={i} style={styles.themeItem}>
                                    <Text style={styles.themeName}>{t.name}</Text>
                                    <View style={styles.themeBarBg}>
                                        <View style={[styles.themeBarFill, { width: `${t.pct * 100}%` }]} />
                                    </View>
                                    <Text style={styles.themeCount}>{t.count}</Text>
                                </View>
                            ))}
                        </GlassCard>

                        {/* Mood Distribution */}
                        <GlassCard style={styles.chartCard}>
                            <Text style={styles.chartTitle}>Mood Distribution</Text>
                            <View style={styles.moodGrid}>
                                {MOODS.map((m, i) => (
                                    <View key={i} style={styles.moodItem}>
                                        <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
                                        <Text style={styles.moodLabel}>{m.label}</Text>
                                        <View style={styles.moodBarBg}>
                                            <View style={[styles.moodBarFill, { height: `${m.pct}%`, backgroundColor: m.color }]} />
                                        </View>
                                        <Text style={[styles.moodPct, { color: m.color }]}>{m.pct}%</Text>
                                    </View>
                                ))}
                            </View>
                        </GlassCard>

                        {/* Personalized Discoveries */}
                        <GlassCard style={styles.chartCard}>
                            <Text style={styles.chartTitle}>Personalized Discoveries</Text>
                            {[
                                { icon: '🌊', title: 'Water dreams increasing', desc: 'You\'ve had 3x more water-related dreams this month. This may reflect emotional processing.' },
                                { icon: '🌙', title: 'Peak dream time: 3-5 AM', desc: 'Most of your vivid dreams occur during late REM cycles. Try sleeping by 11 PM.' },
                                { icon: '🦋', title: 'Recurring symbol: Butterflies', desc: 'Butterflies appeared in 4 dreams this month, often symbolizing transformation.' },
                            ].map((d, i) => (
                                <View key={i} style={styles.discoveryItem}>
                                    <Text style={{ fontSize: 24 }}>{d.icon}</Text>
                                    <View style={styles.discoveryContent}>
                                        <Text style={styles.discoveryTitle}>{d.title}</Text>
                                        <Text style={styles.discoveryDesc}>{d.desc}</Text>
                                    </View>
                                </View>
                            ))}
                        </GlassCard>

                        {/* Generate Report Button */}
                        <TouchableOpacity style={styles.reportBtn}>
                            <Text style={styles.reportBtnText}>Generate Monthly Report</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },

    // Profile Header
    profileHeader: {
        alignItems: 'center',
        paddingTop: spacing.xxl,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    avatarWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.mintGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    avatarEmoji: { fontSize: 36 },
    username: { ...typography.h2, color: colors.textPrimary, marginBottom: 4 },
    userSub: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.xl,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
    },
    profileStat: { alignItems: 'center' },
    profileStatValue: { ...typography.h2, color: colors.mintGreen },
    profileStatLabel: { ...typography.caption, color: colors.textSecondary },

    // Tab Switch
    tabSwitch: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: 4,
    },
    tabBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
    tabBtnActive: { backgroundColor: colors.softTeal },
    tabText: { ...typography.caption, color: colors.textTertiary },
    tabTextActive: { color: colors.textPrimary, fontWeight: '600' },

    // Menu
    menuSection: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginBottom: 0,
    },
    menuIcon: { fontSize: 20, marginRight: spacing.md },
    menuLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
    menuArrow: { fontSize: 22, color: colors.textTertiary },
    logoutBtn: {
        marginTop: spacing.md,
        backgroundColor: 'rgba(255,80,80,0.15)',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,80,80,0.3)',
    },
    logoutText: { ...typography.body, color: '#FF5050', fontWeight: '600' },

    // Insights
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg, gap: spacing.sm,
    },
    statCard: { width: (width - spacing.lg * 2 - spacing.sm) / 2 - 1, alignItems: 'center', paddingVertical: spacing.md },
    statValue: { ...typography.h2, color: colors.mintGreen, marginVertical: 4 },
    statLabel: { ...typography.caption, color: colors.textSecondary },
    periodToggle: {
        flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.lg,
        backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 4,
    },
    periodBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
    periodBtnActive: { backgroundColor: colors.softTeal },
    periodText: { ...typography.caption, color: colors.textTertiary },
    periodTextActive: { color: colors.textPrimary, fontWeight: '600' },
    chartCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
    chartTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140 },
    barCol: { flex: 1, alignItems: 'center' },
    barColSmall: { flex: 1, alignItems: 'center' },
    barWrapper: { width: 20, height: 100, justifyContent: 'flex-end', marginBottom: 4 },
    bar: { width: '100%', backgroundColor: colors.mintGreen, borderRadius: 4, minHeight: 4 },
    barLabel: { ...typography.small, color: colors.textTertiary, marginTop: 4 },
    barLabelSmall: { ...typography.small, color: colors.textTertiary, marginTop: 4, fontSize: 9 },
    barValue: { ...typography.small, color: colors.mintGreen },
    lineChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140 },
    lineCol: { flex: 1, alignItems: 'center' },
    lineBarWrapper: { width: 20, height: 100, justifyContent: 'flex-end', marginBottom: 4 },
    lineBar: { width: '100%', backgroundColor: colors.softTeal, borderRadius: 4, minHeight: 4 },
    lineValue: { ...typography.small, color: colors.softTeal },
    themeItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    themeName: { ...typography.body, color: colors.textPrimary, width: 70 },
    themeBarBg: { flex: 1, height: 10, backgroundColor: colors.surface, borderRadius: 5, overflow: 'hidden' },
    themeBarFill: { height: '100%', backgroundColor: colors.softTeal, borderRadius: 5 },
    themeCount: { ...typography.caption, color: colors.textSecondary, width: 30, textAlign: 'right' },
    moodGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    moodItem: { alignItems: 'center', width: 56 },
    moodLabel: { ...typography.small, color: colors.textTertiary, marginTop: 4, marginBottom: spacing.sm },
    moodBarBg: { width: 24, height: 60, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', justifyContent: 'flex-end' },
    moodBarFill: { width: '100%', borderRadius: 12 },
    moodPct: { ...typography.caption, marginTop: 4, fontWeight: '600' },
    discoveryItem: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm },
    discoveryContent: { flex: 1 },
    discoveryTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600', marginBottom: 2 },
    discoveryDesc: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },
    reportBtn: {
        marginHorizontal: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.mintGreen,
        padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center',
    },
    reportBtnText: { ...typography.body, color: colors.deepTeal, fontWeight: '600' },
});

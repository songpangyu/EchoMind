import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import Icon, { IconName } from '../components/Icon';

// ─── Mock dream data (in real app these come from route params / store) ────────
const DREAM = {
    title: 'Fireflies in the Misty Forest',
    date: 'March 7, 2026 · 6:42 AM',
    duration: '0:38',
    mood: { emoji: '😌', label: 'Peaceful' },
    tags: ['Forest', 'Night', 'Fireflies', 'Nature', 'Peaceful'],
    imageUri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=500&fit=crop',
    imageStyle: '📷 Realistic',
    transcript: 'I was walking through a misty forest at night. The trees were enormous, like ancient guardians. Tiny glowing fireflies danced around me, leaving trails of golden light. I could hear a gentle stream nearby and the air smelled like pine and rain...',
};

// ─── AI interpretation per perspective ────────────────────────────────────────
type Perspective = 'life' | 'work' | 'relationship' | 'emotion' | 'spiritual';

const PERSPECTIVES: { key: Perspective; label: string; icon: IconName }[] = [
    { key: 'life', label: 'Life', icon: 'sprout' },
    { key: 'work', label: 'Work', icon: 'briefcase' },
    { key: 'relationship', label: 'Relationship', icon: 'heart-duo' },
    { key: 'emotion', label: 'Emotion', icon: 'thought' },
    { key: 'spiritual', label: 'Spiritual', icon: 'sparkles' },
];

const AI_ANALYSIS: Record<Perspective, { summary: string; insights: string[]; suggestion: string }> = {
    life: {
        summary: 'This dream reflects a desire to slow down and reconnect with nature and your inner self. The misty forest symbolises a transitional period — you\'re moving through uncertainty but guided by small lights.',
        insights: [
            'The "ancient guardian" trees suggest you feel supported by your long-term foundations (family, values).',
            'Fireflies leaving trails of golden light represent small positives in your daily life worth noticing.',
            'The stream sound may indicate a craving for simple, sensory pleasures — time in nature could be restorative.',
        ],
        suggestion: 'Try scheduling one screen-free evening walk this week. Let routine dissolve for an hour.',
    },
    work: {
        summary: 'The forest path with no clear destination may mirror feelings of ambiguity in your career direction. However the calm mood suggests you\'re not anxious — more exploratory.',
        insights: [
            'Walking without a definite goal = you may be in a brainstorming or discovery phase at work.',
            'Fireflies = sparks of creativity or new ideas surfacing that deserve attention.',
            'The enormous trees could represent senior colleagues or organisational structures — steady but not constraining.',
        ],
        suggestion: 'Jot down 3 ideas or projects that excite you this week, even if they seem unrealistic.',
    },
    relationship: {
        summary: 'The solitary but peaceful walk suggests contentment in your own company, yet the fireflies (plural, social) hint at warmth in connections around you.',
        insights: [
            'Being alone but not lonely in the dream reflects emotional independence — a healthy sign.',
            'The golden trails left by fireflies may represent the lasting impact of meaningful conversations or moments with loved ones.',
            'The gentle stream sound = quiet, steady support from someone close, perhaps unspoken.',
        ],
        suggestion: 'Reach out to someone you haven\'t spoken to in a while. A simple message can reignite warmth.',
    },
    emotion: {
        summary: 'The dominant emotional tone is peaceful wonder — a state of awe without anxiety. This may reflect that you\'re processing recent events more smoothly than you realise.',
        insights: [
            'Mist typically appears in dreams during emotional transitions — you\'re between two emotional states.',
            'The smell of pine and rain signals heightened sensory awareness, often linked to nostalgia or longing.',
            'Fireflies symbolise hope and fleeting moments — your psyche may be reminding you to appreciate the transient.',
        ],
        suggestion: 'Practise 5 minutes of sensory grounding: name 5 things you see, 4 you hear, 3 you feel.',
    },
    spiritual: {
        summary: 'Forests in spiritual traditions represent the subconscious, the liminal, and the sacred. Your dream has a strong mythic quality — you were a wanderer in a living, breathing world.',
        insights: [
            'Ancient guardian trees = archetypal protective forces or ancestors watching over you.',
            'Fireflies as light in the dark = inner wisdom guiding you through an uncertain phase.',
            'The stream you could hear but not see = intuitive knowledge flowing beneath conscious awareness.',
        ],
        suggestion: 'Consider journalling or meditating on what "guidance" means to you right now — what light are you following?',
    },
};

type NavProp = StackNavigationProp<RootStackParamList>;

export const DreamDetailScreen: React.FC = () => {
    const navigation = useNavigation<NavProp>();
    const [perspective, setPerspective] = useState<Perspective>('life');
    const [isStarred, setIsStarred] = useState(false);
    const analysis = AI_ANALYSIS[perspective];

    // Toast
    const [toastMsg, setToastMsg] = useState('');
    const toastAnim = useRef(new Animated.Value(0)).current;
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((msg: string) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToastMsg(msg);
        Animated.sequence([
            Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.delay(1800),
            Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
        toastTimer.current = setTimeout(() => setToastMsg(''), 2400);
    }, [toastAnim]);

    const toggleStar = () => {
        const next = !isStarred;
        setIsStarred(next);
        showToast(next ? '⭐ Added to favorites' : '✓ Removed from favorites');
    };

    const goHome = () => {
        navigation.goBack();
    };

    const shareToCommunity = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Community', params: { shared: true } } }],
        });
    };

    return (
        <View style={styles.container}>
            <FloatingParticles />
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ── Hero image ── */}
                <View style={styles.heroWrapper}>
                    <Image source={{ uri: DREAM.imageUri }} style={styles.heroImage} resizeMode="cover" />
                    {/* Back button */}
                    <TouchableOpacity style={styles.backBtn} onPress={goHome}>
                        <Text style={styles.backBtnText}>‹</Text>
                    </TouchableOpacity>
                    {/* Star button */}
                    <TouchableOpacity style={styles.starBtn} onPress={toggleStar} activeOpacity={0.8}>
                        <Icon name={isStarred ? 'star-fill' : 'star'} size={22} color={isStarred ? colors.mintGreen : colors.textPrimary} strokeWidth={2} />
                    </TouchableOpacity>
                    {/* Image style badge */}
                    <View style={styles.imageStyleBadge}>
                        <Text style={styles.imageStyleText}>{DREAM.imageStyle}</Text>
                    </View>
                </View>

                <View style={styles.body}>
                    {/* ── Title & meta ── */}
                    <Text style={styles.dreamTitle}>{DREAM.title}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaItem}>📅 {DREAM.date}</Text>
                        <Text style={styles.metaItem}>🎙️ {DREAM.duration}</Text>
                        <Text style={styles.metaItem}>{DREAM.mood.emoji} {DREAM.mood.label}</Text>
                    </View>

                    {/* ── Tags ── */}
                    <View style={styles.tagRow}>
                        {DREAM.tags.map(t => (
                            <View key={t} style={styles.tag}>
                                <Text style={styles.tagText}>{t}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── Transcript ── */}
                    <GlassCard style={styles.card}>
                        <View style={styles.sectionHeaderRow}>
                            <Icon name="note" size={20} color={colors.textPrimary} style={{ marginRight: 6 }} />
                            <Text style={styles.cardLabel}>Dream Transcript</Text>
                        </View>
                        <Text style={styles.transcriptText}>{DREAM.transcript}</Text>
                    </GlassCard>

                    {/* ── Apple Health Sleep Data ── */}
                    <GlassCard style={styles.card}>
                        <View style={styles.healthHeader}>
                            <View style={styles.healthTitleRow}>
                                <Text style={styles.cardLabel}>Sleep Data</Text>
                                <View style={styles.healthAppleBadge}>
                                    <Text style={styles.healthAppleBadgeText}>♥ Apple Health</Text>
                                </View>
                            </View>
                            <Text style={styles.healthSubtitle}>Recorded by Apple Watch · Last night</Text>
                        </View>

                        {/* Score + Duration row */}
                        <View style={styles.healthScoreRow}>
                            <View style={styles.healthScoreCircle}>
                                <Text style={styles.healthScoreVal}>85</Text>
                                <Text style={styles.healthScoreUnit}>pts</Text>
                            </View>
                            <View style={styles.healthStatsCol}>
                                {[
                                    { label: 'Total Sleep', value: '7h 32m' },
                                    { label: 'Bedtime', value: '11:04 PM' },
                                    { label: 'Wake Time', value: '6:36 AM' },
                                ].map((s, i) => (
                                    <View key={i} style={styles.healthStatRow}>
                                        <Text style={styles.healthStatLabel}>{s.label}</Text>
                                        <Text style={styles.healthStatValue}>{s.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Sleep stage bar */}
                        <View style={styles.sleepBarWrap}>
                            <View style={[styles.sleepSeg, { flex: 0.12, backgroundColor: '#8b9cba' }]} />
                            <View style={[styles.sleepSeg, { flex: 0.30, backgroundColor: '#4a6fa5' }]} />
                            <View style={[styles.sleepSeg, { flex: 0.26, backgroundColor: '#7ec8a0' }]} />
                            <View style={[styles.sleepSeg, { flex: 0.22, backgroundColor: '#4a6fa5' }]} />
                            <View style={[styles.sleepSeg, { flex: 0.10, backgroundColor: '#8b9cba' }]} />
                        </View>
                        <View style={styles.sleepLegend}>
                            <View style={styles.legendLeft}>
                                {[
                                    { color: '#8b9cba', label: 'Awake' },
                                    { color: '#4a6fa5', label: 'Light' },
                                    { color: '#7ec8a0', label: 'Deep' },
                                ].map((l, i) => (
                                    <View key={i} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                                        <Text style={styles.legendText}>{l.label}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                                <Text style={styles.remBadge}>REM 1h 48m</Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* ── AI Analysis section ── */}
                    <View style={styles.analysisHeader}>
                        <View style={styles.sectionHeaderRow}>
                            <Icon name="robot" size={24} color={colors.textPrimary} style={{ marginRight: 8 }} />
                            <Text style={styles.analysisTitle}>AI Dream Analysis</Text>
                        </View>
                        <Text style={styles.analysisSubtitle}>Choose a perspective</Text>
                    </View>

                    {/* Perspective tab switcher */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.perspectiveRow}
                    >
                        {PERSPECTIVES.map(p => (
                            <TouchableOpacity
                                key={p.key}
                                style={[styles.perspectiveBtn, perspective === p.key && styles.perspectiveBtnActive]}
                                onPress={() => setPerspective(p.key)}
                            >
                                <Icon name={p.icon} size={28} color={perspective === p.key ? colors.mintGreen : colors.textTertiary} />
                                <Text style={[styles.perspectiveLabel, perspective === p.key && styles.perspectiveLabelActive]}>
                                    {p.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Analysis content */}
                    <GlassCard style={styles.analysisCard}>
                        {/* Summary */}
                        <Text style={styles.analysisSummary}>{analysis.summary}</Text>

                        {/* Insights */}
                        <Text style={styles.insightsTitle}>Key Insights</Text>
                        {analysis.insights.map((insight, i) => (
                            <View key={i} style={styles.insightRow}>
                                <View style={styles.insightBullet} />
                                <Text style={styles.insightText}>{insight}</Text>
                            </View>
                        ))}

                        {/* Suggestion */}
                        <View style={styles.suggestionBox}>
                            <Text style={styles.suggestionLabel}>💡 Suggestion</Text>
                            <Text style={styles.suggestionText}>{analysis.suggestion}</Text>
                        </View>
                    </GlassCard>

                    {/* ── Share to community ── */}
                    <TouchableOpacity style={styles.shareBtn} onPress={shareToCommunity}>
                        <Text style={styles.shareBtnText}>🌍 Share to Community</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Toast */}
            {toastMsg !== '' && (
                <Animated.View
                    style={[
                        styles.toast,
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
        </View >
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Hero
    heroWrapper: { position: 'relative', height: 260 },
    heroImage: { width: '100%', height: '100%' },
    backBtn: {
        position: 'absolute', top: 48, left: 16,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(15,31,31,0.7)',
        alignItems: 'center', justifyContent: 'center',
    },
    backBtnText: { color: colors.textPrimary, fontSize: 28, lineHeight: 34 },
    imageStyleBadge: {
        position: 'absolute', bottom: 12, right: 12,
        backgroundColor: 'rgba(15,31,31,0.75)',
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.md, paddingVertical: 4,
        borderWidth: 1, borderColor: colors.deepTeal,
    },
    imageStyleText: { ...typography.small, color: colors.textSecondary },

    // Body
    body: { padding: spacing.lg },
    dreamTitle: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
    metaItem: { ...typography.caption, color: colors.textTertiary },

    // Tags
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    tag: {
        backgroundColor: 'rgba(181,217,168,0.12)',
        borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.mintGreen,
        paddingHorizontal: spacing.md, paddingVertical: 4,
    },
    tagText: { ...typography.caption, color: colors.mintGreen, fontWeight: '600' },

    // Transcript card
    card: { marginBottom: spacing.lg },
    cardLabel: { ...typography.caption, color: colors.mintGreen, fontWeight: '700', marginBottom: spacing.sm, letterSpacing: 0.4 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    transcriptText: { ...typography.body, color: colors.textSecondary, lineHeight: 24, fontStyle: 'italic' },

    // Analysis header
    analysisHeader: { marginBottom: spacing.md },
    analysisTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: 4 },
    analysisSubtitle: { ...typography.caption, color: colors.textTertiary },

    // Perspective switcher
    perspectiveRow: { gap: spacing.sm, paddingBottom: spacing.md },
    perspectiveBtn: {
        alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        backgroundColor: colors.surface, borderRadius: borderRadius.md,
        borderWidth: 1.5, borderColor: 'transparent', minWidth: 72,
    },
    perspectiveBtnActive: { backgroundColor: 'rgba(181,217,168,0.12)', borderColor: colors.mintGreen },
    perspectiveEmoji: { fontSize: 22 },
    perspectiveLabel: { ...typography.small, color: colors.textTertiary, marginTop: 4 },
    perspectiveLabelActive: { color: colors.mintGreen, fontWeight: '700' },

    // Analysis card
    analysisCard: { marginBottom: spacing.lg },
    analysisSummary: {
        ...typography.body, color: colors.textPrimary,
        lineHeight: 26, marginBottom: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.deepTeal,
    },
    insightsTitle: { ...typography.body, color: colors.mintGreen, fontWeight: '700', marginBottom: spacing.md },
    insightRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, alignItems: 'flex-start' },
    insightBullet: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: colors.mintGreen, marginTop: 7, flexShrink: 0,
    },
    insightText: { ...typography.body, color: colors.textSecondary, lineHeight: 22, flex: 1 },

    // Suggestion
    suggestionBox: {
        backgroundColor: 'rgba(181,217,168,0.08)',
        borderRadius: borderRadius.md, padding: spacing.md,
        borderLeftWidth: 3, borderLeftColor: colors.mintGreen,
        marginTop: spacing.sm,
    },
    suggestionLabel: { ...typography.caption, color: colors.mintGreen, fontWeight: '700', marginBottom: 6 },
    suggestionText: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },

    // Share button
    shareBtn: {
        backgroundColor: colors.deepTeal, padding: spacing.md,
        borderRadius: borderRadius.md, alignItems: 'center',
        borderWidth: 1, borderColor: colors.softTeal,
    },
    shareBtnText: { ...typography.body, color: colors.mintGreen, fontWeight: '600' },

    // Star button overlay
    starBtn: {
        position: 'absolute', top: 48, right: 16,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(15,31,31,0.7)',
        alignItems: 'center', justifyContent: 'center',
    },
    starBtnText: { fontSize: 24, color: colors.background, fontWeight: '700' },

    // Toast
    toast: {
        position: 'absolute',
        bottom: 110,
        alignSelf: 'center',
        backgroundColor: 'rgba(26,47,47,0.96)',
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
    toastText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600', textAlign: 'center' },
    healthHeader: { marginBottom: spacing.md },
    healthTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
    healthAppleBadge: {
        backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm, paddingVertical: 2,
        borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)',
        marginTop: 2,
    },
    healthAppleBadgeText: { ...typography.small, color: '#ff8a8a', fontWeight: '600' },
    healthSubtitle: { ...typography.small, color: colors.textTertiary },
    healthScoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
    healthScoreCircle: {
        width: 72, height: 72, borderRadius: 36,
        borderWidth: 2.5, borderColor: colors.mintGreen,
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    healthScoreVal: { ...typography.h2, color: colors.mintGreen, lineHeight: 32 },
    healthScoreUnit: { ...typography.small, color: colors.mintGreen },
    healthStatsCol: { flex: 1, gap: 6 },
    healthStatRow: { flexDirection: 'row', justifyContent: 'space-between' },
    healthStatLabel: { ...typography.caption, color: colors.textTertiary },
    healthStatValue: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
    sleepBarWrap: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: spacing.sm },
    sleepSeg: { height: 10 },
    sleepLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    legendLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { ...typography.small, color: colors.textTertiary },
    remBadge: {
        marginLeft: 'auto', ...typography.small, color: colors.mintGreen,
        fontWeight: '600', backgroundColor: 'rgba(181,217,168,0.1)',
        borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2,
    },
});

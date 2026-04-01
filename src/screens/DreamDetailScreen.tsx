import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import Icon, { IconName } from '../components/Icon';
import { getDream, updateDream, analyzeDream, type Dream, type DreamMood } from '../api/dreams';
import { sharePost } from '../api/community';
import { ScreenWrapper } from '../components/ScreenWrapper';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

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

type NavProp = StackNavigationProp<RootStackParamList>;
type DreamDetailRoute = RouteProp<RootStackParamList, 'DreamDetail'>;

const MOOD_META: Record<DreamMood, { emoji: string; label: string }> = {
    peaceful: { emoji: '😌', label: 'Peaceful' },
    happy: { emoji: '😊', label: 'Happy' },
    sad: { emoji: '😢', label: 'Sad' },
    anxious: { emoji: '😰', label: 'Anxious' },
    calm: { emoji: '😴', label: 'Calm' },
};

const IMAGE_STYLE_LABELS: Record<string, string> = {
    '3d-cartoon': '3D Cartoon',
    realistic: 'Realistic',
    anime: 'Anime / Manga',
    watercolor: 'Watercolor',
    'oil-paint': 'Oil Painting',
    sketch: 'Pencil Sketch',
    fantasy: 'Fantasy Art',
};

const formatDreamDate = (date: string) =>
    new Date(date).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

const formatDuration = (seconds: number | null) => {
    if (!seconds) {
        return 'Manual entry';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
};

// ─── AI Analysis Skeleton Loader ─────────────────────────────────────────────
const AnalysisLoadingSkeleton = () => {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, [pulseAnim]);

    return (
        <View style={styles.skeletonContainer}>
            {/* AI thinking indicator */}
            <View style={styles.skeletonHeader}>
                <Animated.View style={[styles.skeletonIcon, { opacity: pulseAnim }]} />
                <Animated.Text style={[styles.skeletonLabel, { opacity: pulseAnim }]}>AI is decoding your dream...</Animated.Text>
            </View>

            {/* Skeleton paragraph lines */}
            <View style={styles.skeletonBlock}>
                <Animated.View style={[styles.skeletonLine, { width: '100%', opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonLine, { width: '90%', opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonLine, { width: '95%', opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonLine, { width: '70%', opacity: pulseAnim }]} />
            </View>

            {/* Skeleton bullet points */}
            <View style={styles.skeletonBlock}>
                <View style={styles.skeletonBulletRow}>
                    <Animated.View style={[styles.skeletonBullet, { opacity: pulseAnim }]} />
                    <Animated.View style={[styles.skeletonLine, { width: '85%', opacity: pulseAnim }]} />
                </View>
                <View style={styles.skeletonBulletRow}>
                    <Animated.View style={[styles.skeletonBullet, { opacity: pulseAnim }]} />
                    <Animated.View style={[styles.skeletonLine, { width: '90%', opacity: pulseAnim }]} />
                </View>
                <View style={styles.skeletonBulletRow}>
                    <Animated.View style={[styles.skeletonBullet, { opacity: pulseAnim }]} />
                    <Animated.View style={[styles.skeletonLine, { width: '60%', opacity: pulseAnim }]} />
                </View>
            </View>
        </View>
    );
};

export const DreamDetailScreen: React.FC = () => {
    const navigation = useNavigation<NavProp>();
    const route = useRoute<DreamDetailRoute>();
    const [perspective, setPerspective] = useState<Perspective>('life');
    const [dream, setDream] = useState<Dream | null>(null);
    const [loading, setLoading] = useState(true);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updatingFavorite, setUpdatingFavorite] = useState(false);
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

    useEffect(() => {
        let active = true;
        const loadDream = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await getDream(route.params.dreamId);
                if (active) {
                    setDream(result);
                    if (!result.analysis || Object.keys(result.analysis).length === 0) {
                        setAnalysisLoading(true);
                        analyzeDream(result.id)
                            .then(updated => {
                                if (active) setDream(updated);
                            })
                            .catch(err => console.log('Analysis error', err))
                            .finally(() => {
                                if (active) setAnalysisLoading(false);
                            });
                    }
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError instanceof Error ? loadError.message : 'Could not load dream.');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadDream();
        return () => {
            active = false;
        };
    }, [route.params.dreamId]);

    const toggleStar = async () => {
        if (!dream || updatingFavorite) {
            return;
        }
        try {
            setUpdatingFavorite(true);
            const updated = await updateDream(dream.id, { isFavorited: !dream.isFavorited });
            setDream(updated);
            showToast(updated.isFavorited ? '⭐ Added to favorites' : '✓ Removed from favorites');
        } catch (updateError) {
            showToast(updateError instanceof Error ? updateError.message : 'Could not update favorite.');
        } finally {
            setUpdatingFavorite(false);
        }
    };

    const goHome = () => {
        navigation.goBack();
    };

    const shareToCommunity = async () => {
        if (!dream) return;
        ReactNativeHapticFeedback.trigger('impactMedium');
        try {
            showToast('Sharing...');
            await sharePost(dream.id);
            ReactNativeHapticFeedback.trigger('notificationSuccess');
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'Community', params: { shared: true } } }],
            });
        } catch (e: any) {
            const msg = e?.message || '';
            if (msg.includes('already')) {
                showToast('Already shared!');
            } else {
                showToast('Share failed: ' + (msg || 'Unknown error'));
            }
        }
    };

    if (loading) {
        return (
            <View style={styles.centerState}>
                <FloatingParticles />
                <ActivityIndicator color={colors.mintGreen} size="large" />
                <Text style={styles.centerStateText}>Loading dream...</Text>
            </View>
        );
    }

    if (!dream || error) {
        return (
            <View style={styles.centerState}>
                <FloatingParticles />
                <Text style={styles.centerStateTitle}>Dream unavailable</Text>
                <Text style={styles.centerStateText}>{error ?? 'We could not load this dream.'}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={goHome}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const moodMeta = dream.mood ? MOOD_META[dream.mood] : null;
    const imageStyleText = dream.aiImageStyle
        ? `📷 ${IMAGE_STYLE_LABELS[dream.aiImageStyle] ?? dream.aiImageStyle}`
        : 'No AI image yet';

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <FloatingParticles />
                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* ── Hero image ── */}
                    <View style={styles.heroWrapper}>
                        {dream.aiImageUrl ? (
                            <Image source={{ uri: dream.aiImageUrl }} style={styles.heroImage} resizeMode="cover" />
                        ) : (
                            <View style={[styles.heroImage, styles.heroPlaceholder]}>
                                <Icon name="image" size={42} color={colors.textTertiary} />
                                <Text style={styles.heroPlaceholderText}>No generated image yet</Text>
                            </View>
                        )}
                        {/* Back button */}
                        <TouchableOpacity style={styles.backBtn} onPress={goHome}>
                            <Text style={styles.backBtnText}>‹</Text>
                        </TouchableOpacity>
                        {/* Star button */}
                        <TouchableOpacity style={styles.starBtn} onPress={toggleStar} activeOpacity={0.8}>
                            <Icon
                                name={dream.isFavorited ? 'star-fill' : 'star'}
                                size={22}
                                color={dream.isFavorited ? colors.mintGreen : colors.textPrimary}
                                strokeWidth={2}
                            />
                        </TouchableOpacity>
                        {/* Image style badge */}
                        <View style={styles.imageStyleBadge}>
                            <Text style={styles.imageStyleText}>{imageStyleText}</Text>
                        </View>
                    </View>

                    <View style={styles.body}>
                        {/* ── Title & meta ── */}
                        <Text style={styles.dreamTitle}>{dream.title || 'Untitled Dream'}</Text>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaItem}>📅 {formatDreamDate(dream.createdAt)}</Text>
                            <Text style={styles.metaItem}>🎙️ {formatDuration(dream.durationSeconds)}</Text>
                            <Text style={styles.metaItem}>
                                {moodMeta ? `${moodMeta.emoji} ${moodMeta.label}` : 'Mood pending'}
                            </Text>
                        </View>

                        {/* ── Tags ── */}
                        <View style={styles.tagRow}>
                            {dream.tags.map(t => (
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
                            <Text style={styles.transcriptText}>{dream.transcript}</Text>
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
                                    onPress={() => {
                                        ReactNativeHapticFeedback.trigger('impactLight');
                                        setPerspective(p.key);
                                    }}
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
                            {analysisLoading ? (
                                <AnalysisLoadingSkeleton />
                            ) : dream.analysis && Object.keys(dream.analysis).length > 0 ? (
                                <>
                                    <Text style={styles.analysisSummary}>{dream.analysis[perspective]?.summary}</Text>
                                    <Text style={styles.insightsTitle}>Key Insights</Text>
                                    {dream.analysis[perspective]?.insights?.map((insight, i) => (
                                        <View key={i} style={styles.insightRow}>
                                            <View style={styles.insightBullet} />
                                            <Text style={styles.insightText}>{insight}</Text>
                                        </View>
                                    ))}
                                    <View style={styles.suggestionBox}>
                                        <Text style={styles.suggestionLabel}>💡 Suggestion</Text>
                                        <Text style={styles.suggestionText}>{dream.analysis[perspective]?.suggestion}</Text>
                                    </View>
                                </>
                            ) : (
                                <Text style={{ color: colors.textTertiary, textAlign: 'center', ...typography.body }}>No analysis available.</Text>
                            )}
                        </GlassCard>

                        {/* ── Share to community ── */}
                        <TouchableOpacity style={styles.shareBtn} onPress={shareToCommunity}>
                            <Text style={styles.shareBtnText}>Share to Community</Text>
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
        </ScreenWrapper>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerState: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    centerStateTitle: {
        ...typography.h2,
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    centerStateText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.mintGreen,
    },
    retryButtonText: {
        ...typography.body,
        color: colors.mintGreen,
        fontWeight: '600',
    },

    // Hero
    heroWrapper: { position: 'relative', height: 260 },
    heroImage: { width: '100%', height: '100%' },
    heroPlaceholder: {
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    heroPlaceholderText: {
        ...typography.body,
        color: colors.textTertiary,
    },
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

    // Skeleton loader
    skeletonContainer: { paddingVertical: spacing.sm },
    skeletonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
    skeletonIcon: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.mintGreen },
    skeletonLabel: { ...typography.body, color: colors.mintGreen, fontWeight: '600' },
    skeletonBlock: { marginBottom: spacing.xl, gap: 10 },
    skeletonLine: { height: 14, borderRadius: 7, backgroundColor: 'rgba(126, 200, 160, 0.2)' },
    skeletonBulletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    skeletonBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(126, 200, 160, 0.4)' },

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

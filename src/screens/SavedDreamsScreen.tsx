import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../theme';
import Icon from '../components/Icon';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { listDreams, Dream, updateDream } from '../api/dreams';

const MOOD_EMOJI: Record<string, string> = {
    happy: '😊',
    peaceful: '😌',
    anxious: '😰',
    sad: '😢',
    calm: '😴',
};

const MOOD_ICONS: Record<string, string> = {
    happy: 'heart',
    peaceful: 'tree',
    anxious: 'fire',
    sad: 'rain',
    calm: 'moon',
};

const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

export const SavedDreamsScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchSavedDreams = useCallback(async (pageNum: number = 1, isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else if (pageNum === 1) setLoading(true);

            const response = await listDreams({
                page: pageNum,
                pageSize: 20,
                isFavorited: true,
            });
            if (pageNum === 1) {
                setDreams(response.items);
            } else {
                setDreams(prev => [...prev, ...response.items]);
            }
            setTotal(response.total);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch saved dreams:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchSavedDreams(1);
        }, [fetchSavedDreams])
    );

    const onRefresh = () => fetchSavedDreams(1, true);

    const handleUnfavorite = async (dreamId: string) => {
        try {
            await updateDream(dreamId, { isFavorited: false });
            setDreams(prev => prev.filter(d => d.id !== dreamId));
            setTotal(prev => prev - 1);
        } catch (error) {
            console.error('Failed to unfavorite dream:', error);
        }
    };

    const handleDreamPress = (dreamId: string) => {
        navigation.navigate('DreamDetail', { dreamId });
    };

    return (
        <ScreenWrapper>
        <View style={styles.container}>
            <FloatingParticles />
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Starred Dreams</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{total}</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.mintGreen} />
                    <Text style={styles.loadingText}>Loading saved dreams...</Text>
                </View>
            ) : dreams.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="heart" size={48} color={colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No Starred Dreams</Text>
                    <Text style={styles.emptyText}>
                        Tap the star icon on any dream to save it here for easy access.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.mintGreen}
                        />
                    }
                >
                    {dreams.map(dream => (
                        <TouchableOpacity
                            key={dream.id}
                            activeOpacity={0.8}
                            onPress={() => handleDreamPress(dream.id)}
                        >
                            <GlassCard style={styles.postCard}>
                                <View style={styles.cardMainRow}>
                                    <View style={styles.iconBox}>
                                        <Icon
                                            name={(MOOD_ICONS[dream.mood || ''] || 'moon') as any}
                                            size={32}
                                            color={colors.mintGreen}
                                        />
                                    </View>

                                    <View style={styles.rightContent}>
                                        <View style={styles.titleRow}>
                                            <Text style={styles.postTitle} numberOfLines={1}>
                                                {dream.title || 'Untitled Dream'}
                                            </Text>
                                            {dream.mood && (
                                                <View style={styles.moodPill}>
                                                    <Text style={styles.moodEmoji}>
                                                        {MOOD_EMOJI[dream.mood] || '😴'}
                                                    </Text>
                                                    <Text style={styles.moodLabel}>
                                                        {dream.mood.charAt(0).toUpperCase() + dream.mood.slice(1)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        <Text style={styles.postTime}>{formatTime(dream.createdAt)}</Text>

                                        <Text style={styles.dreamText} numberOfLines={3}>
                                            {dream.transcript}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.cardFooter}>
                                    <View style={styles.tagRow}>
                                        {(dream.tags || []).slice(0, 3).map((tag, i) => (
                                            <View key={i} style={styles.tag}>
                                                <Text style={styles.tagText}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <TouchableOpacity
                                        style={styles.unfavoriteBtn}
                                        onPress={() => handleUnfavorite(dream.id)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Icon name="heart" size={18} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 0,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backBtnText: {
        color: colors.textPrimary,
        fontSize: 28,
        lineHeight: 30,
        marginLeft: -2,
        marginTop: -2,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    countBadge: {
        width: 44,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(181,217,168,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countText: {
        color: colors.mintGreen,
        fontSize: 14,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: colors.textTertiary,
        ...typography.body,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        gap: 12,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginTop: 8,
    },
    emptyText: {
        ...typography.body,
        color: colors.textTertiary,
        textAlign: 'center',
        lineHeight: 22,
    },
    postCard: {
        padding: spacing.md,
        paddingBottom: spacing.sm,
        marginBottom: spacing.md,
    },
    cardMainRow: {
        flexDirection: 'row',
    },
    iconBox: {
        width: 68,
        height: 68,
        borderRadius: 16,
        backgroundColor: 'rgba(181,217,168,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(181,217,168,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    rightContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    postTitle: {
        color: colors.textPrimary,
        ...typography.h3,
        flex: 1,
        marginRight: spacing.sm,
    },
    moodPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        backgroundColor: 'rgba(181,217,168,0.15)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(181,217,168,0.5)',
    },
    moodEmoji: {
        fontSize: 14,
    },
    moodLabel: {
        ...typography.small,
        color: colors.textPrimary,
    },
    postTime: {
        color: colors.textTertiary,
        ...typography.small,
        marginBottom: spacing.sm,
    },
    dreamText: {
        color: colors.textSecondary,
        ...typography.body,
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    tag: {
        backgroundColor: 'rgba(181,217,168,0.1)',
        paddingHorizontal: spacing.sm + 4,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        color: colors.mintGreen,
        ...typography.caption,
    },
    unfavoriteBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

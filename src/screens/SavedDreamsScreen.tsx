import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../theme';
import Icon from '../components/Icon';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';

const SAVED_POSTS = [
    {
        id: '1', time: '07:15 AM',
        title: 'Forest Lake Under',
        dream: 'Walking into a forest bathed in moonlight, with towering trees. After passing through the woods, I found a calm lake reflecting stars...',
        mood: 'peaceful', tags: ['Forest', 'Lake'],
    },
    {
        id: '2', time: 'Yesterday',
        title: 'City in the Clouds',
        dream: 'I stepped out of my window onto a solid cloud. There was a whole bustling city up there, made of crystallized air and light.',
        mood: 'peaceful', tags: ['Flying', 'City'],
    }
];

export const SavedDreamsScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <FloatingParticles />
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Stared Dreams</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {SAVED_POSTS.map(post => (
                    <GlassCard key={post.id} style={styles.postCard}>
                        <View style={styles.cardMainRow}>
                            {/* Left Icon box */}
                            <View style={styles.iconBox}>
                                <Icon name="tree" size={32} color={colors.mintGreen} />
                            </View>

                            {/* Right Content */}
                            <View style={styles.rightContent}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.postTitle} numberOfLines={1}>{post.title}</Text>
                                    <View style={styles.moodPill}>
                                        <Text style={styles.moodEmoji}>
                                            {post.mood === 'happy' ? '😊' : post.mood === 'peaceful' ? '😌' : post.mood === 'anxious' ? '😰' : post.mood === 'sad' ? '😢' : '😴'}
                                        </Text>
                                        <Text style={styles.moodLabel}>
                                            {post.mood.charAt(0).toUpperCase() + post.mood.slice(1)}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.postTime}>{post.time}</Text>

                                <Text style={styles.dreamText} numberOfLines={3}>{post.dream}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.cardFooter}>
                            <View style={styles.tagRow}>
                                {post.tags.map((tag, i) => (
                                    <View key={i} style={styles.tag}>
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity style={styles.moreBtn}>
                                <Icon name="more" size={20} color={colors.mintGreen} />
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                ))}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
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
    scrollView: {
        flex: 1,
        paddingHorizontal: spacing.lg,
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
    moreBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

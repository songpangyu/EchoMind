import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';

const SAVED_POSTS = [
    {
        id: '1', user: 'River', avatar: 'R', time: '5h ago',
        title: 'Underwater Garden',
        dream: 'Swimming through a bioluminescent coral garden where fish sang melodies. Each coral pulsed with a different color...',
        image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=250&fit=crop',
        mood: '😊', tags: ['Water', 'Nature'], likes: 18, comments: 3,
    },
    {
        id: 's1', user: 'Nova', avatar: 'N', time: '1d ago',
        title: 'City in the Clouds',
        dream: 'I stepped out of my window onto a solid cloud. There was a whole bustling city up there, made of crystallized air and light.',
        image: null,
        mood: '😌', tags: ['Flying', 'City'], likes: 56, comments: 12,
    }
];

export const SavedDreamsScreen: React.FC = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <FloatingParticles />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Dreams</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {SAVED_POSTS.map(post => (
                    <GlassCard key={post.id} style={styles.postCard}>
                        {/* Header */}
                        <View style={styles.postHeader}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{post.avatar}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.username}>{post.user}</Text>
                                <Text style={styles.postTime}>{post.time}</Text>
                            </View>
                            <View style={styles.moodPill}>
                                <Text style={styles.moodEmoji}>{post.mood}</Text>
                            </View>
                        </View>

                        <Text style={styles.postTitle}>{post.title}</Text>

                        {post.image && (
                            <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
                        )}

                        <Text style={styles.dreamText}>{post.dream}</Text>

                        <View style={styles.tagRow}>
                            {post.tags.map((tag, i) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.postFooter}>
                            <Text style={styles.actionText}>💚 {post.likes}</Text>
                            <Text style={styles.actionText}>💬 {post.comments}</Text>
                            <View style={{ flex: 1 }} />
                            <Text style={[styles.actionText, { color: colors.mintGreen }]}>⭐ Saved</Text>
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
        paddingTop: 60,
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
        marginBottom: spacing.md,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    avatarText: {
        fontSize: 18,
        color: '#fff',
    },
    username: {
        color: colors.textPrimary,
        ...typography.body,
        fontWeight: '600',
    },
    postTime: {
        color: colors.textTertiary,
        ...typography.small,
    },
    moodPill: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    moodEmoji: {
        fontSize: 16,
    },
    postTitle: {
        color: colors.textPrimary,
        ...typography.h3,
        marginBottom: spacing.sm,
    },
    postImage: {
        width: '100%',
        height: 180,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    dreamText: {
        color: colors.textSecondary,
        ...typography.body,
        lineHeight: 22,
        marginBottom: spacing.md,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    tag: {
        backgroundColor: 'rgba(100,255,218,0.1)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: 'rgba(100,255,218,0.2)',
    },
    tagText: {
        color: colors.mintGreen,
        ...typography.small,
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    actionText: {
        color: colors.textTertiary,
        ...typography.body,
    },
});

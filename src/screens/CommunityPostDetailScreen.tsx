import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import Icon from '../components/Icon';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';

export const CommunityPostDetailScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const route = useRoute<RouteProp<RootStackParamList, 'CommunityPostDetail'>>();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const post = route.params.post;

    const [isLiked, setIsLiked] = useState(post.liked);
    const [likes, setLikes] = useState(post.likes);
    const [commentsList, setCommentsList] = useState([
        { id: 'c1', user: 'SkyWalker', text: 'Wow, this dream feels so vivid! I had something similar last week.', time: '2h ago' },
        { id: 'c2', user: 'Luna_Love', text: 'The bioluminescent part gave me chills.', time: '45m ago' },
    ]);
    const [newComment, setNewComment] = useState('');

    const toggleLike = () => {
        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);
    };

    const handleSendComment = () => {
        if (!newComment.trim()) return;
        setCommentsList([
            ...commentsList,
            {
                id: Date.now().toString(),
                user: 'You',
                text: newComment.trim(),
                time: 'Just now',
            },
        ]);
        setNewComment('');
    };

    return (
        <View style={styles.container}>
            <FloatingParticles />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dream Details</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Post Content */}
                    <GlassCard style={styles.postCard}>
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
                                <Text style={styles.moodLabel}>{post.mood === '😌' ? 'Peaceful' : post.mood === '😊' ? 'Happy' : post.mood === '😰' ? 'Anxious' : post.mood === '😢' ? 'Sad' : post.mood === '😴' ? 'Calm' : post.mood === '😁' ? 'Joyful' : 'Dreamy'}</Text>
                            </View>
                        </View>

                        <Text style={styles.postTitle}>{post.title}</Text>

                        {post.image && (
                            <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
                        )}

                        <Text style={styles.dreamText}>{post.dream}</Text>

                        <View style={styles.tagRow}>
                            {post.tags.map((tag: string, i: number) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.postFooter}>
                            <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
                                <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                                    <Icon name={isLiked ? 'heart-fill' : 'heart'} size={16} color={isLiked ? '#e05252' : colors.textSecondary} /> {likes}
                                </Text>
                            </TouchableOpacity>
                            <View style={styles.actionBtn}>
                                <Text style={styles.actionText}>💬 {commentsList.length}</Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Comments Section */}
                    <View style={styles.commentsSection}>
                        <Text style={styles.commentsTitle}>Comments</Text>
                        {commentsList.map(c => (
                            <View key={c.id} style={styles.commentItem}>
                                <View style={[styles.avatar, styles.smallAvatar]}>
                                    <Text style={styles.smallAvatarText}>{c.user.charAt(0)}</Text>
                                </View>
                                <View style={styles.commentContent}>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.commentUser}>{c.user}</Text>
                                        <Text style={styles.commentTime}>{c.time}</Text>
                                    </View>
                                    <Text style={styles.commentText}>{c.text}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Comment Input */}
                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.input}
                        placeholder="Write a comment..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={newComment}
                        onChangeText={setNewComment}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !newComment.trim() && styles.sendBtnDisabled]}
                        disabled={!newComment.trim()}
                        onPress={handleSendComment}
                    >
                        <Text style={styles.sendBtnText}>Post</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        padding: spacing.lg,
        marginBottom: spacing.xl,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
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
    },
    username: {
        color: colors.textPrimary,
        ...typography.body,
        fontWeight: '600',
    },
    postTime: {
        color: colors.textTertiary,
        ...typography.small,
        marginTop: 2,
    },
    moodPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(181,217,168,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(181,217,168,0.3)',
    },
    moodEmoji: {
        fontSize: 12,
    },
    moodLabel: {
        ...typography.small,
        color: colors.mintGreen,
        fontWeight: '600' as const,
    },
    postTitle: {
        color: colors.textPrimary,
        ...typography.h3,
        marginBottom: spacing.sm,
    },
    dreamText: {
        color: colors.textSecondary,
        ...typography.body,
        lineHeight: 24,
        marginBottom: spacing.md,
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: spacing.lg,
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    tagText: {
        color: colors.textSecondary,
        ...typography.small,
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: spacing.md,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    actionText: {
        color: colors.textTertiary,
        ...typography.caption,
    },
    actionTextActive: {
        color: colors.mintGreen,
        fontWeight: '700',
    },
    commentsSection: {
        marginTop: spacing.md,
    },
    commentsTitle: {
        color: colors.textPrimary,
        ...typography.h3,
        marginBottom: spacing.md,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
    },
    smallAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.sm,
    },
    smallAvatarText: {
        fontSize: 14,
        color: '#fff',
    },
    commentContent: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    commentUser: {
        color: colors.textPrimary,
        ...typography.body,
        fontWeight: '600',
    },
    commentTime: {
        color: colors.textTertiary,
        ...typography.small,
    },
    commentText: {
        color: colors.textSecondary,
        ...typography.body,
        lineHeight: 20,
    },
    inputArea: {
        flexDirection: 'row',
        padding: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
        backgroundColor: 'rgba(10, 25, 47, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        color: colors.textPrimary,
        ...typography.body,
        marginRight: spacing.sm,
    },
    sendBtn: {
        backgroundColor: colors.mintGreen,
        paddingHorizontal: spacing.lg,
        paddingVertical: 10,
        borderRadius: 20,
    },
    sendBtnDisabled: {
        backgroundColor: 'rgba(181, 217, 168, 0.5)',
    },
    sendBtnText: {
        color: colors.deepTeal,
        ...typography.body,
        fontWeight: '700',
    },
});

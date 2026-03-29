import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated as RNAnimated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';
import Icon from '../components/Icon';
import { TabParamList, RootStackParamList } from '../navigation/types';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useAuth } from '../contexts/AuthContext';
import {
  listPosts,
  likePost,
  unlikePost,
  listComments,
  createComment,
  followUser,
  unfollowUser,
  CommunityPost,
  PostComment,
  PostTab,
} from '../api/community';

const MOOD_LABEL: Record<string, string> = {
  peaceful: 'Peaceful', happy: 'Happy', anxious: 'Anxious',
  sad: 'Sad', calm: 'Calm',
};

const TABS: { key: PostTab; label: string }[] = [
  { key: 'following', label: 'Following' },
  { key: 'trending', label: 'Trending' },
  { key: 'recent', label: 'Recent' },
];

const MOOD_EMOJI: Record<string, string> = {
  peaceful: '😌', happy: '😊', anxious: '😰', sad: '😢', calm: '😴',
};

export const CommunityScreen: React.FC = () => {
  const route = useRoute<RouteProp<TabParamList, 'Community'>>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<PostTab>('trending');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  // Interactions
  const [likedState, setLikedState] = useState<Record<string, boolean>>({});
  const [likeCountDelta, setLikeCountDelta] = useState<Record<string, number>>({});
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  // Comments Modal
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentSending, setCommentSending] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const toastAnim = useRef(new RNAnimated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    RNAnimated.sequence([
      RNAnimated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      RNAnimated.delay(1800),
      RNAnimated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400);
  }, [toastAnim]);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadPosts = useCallback(async (tab: PostTab, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await listPosts(tab);
      setPosts(data);
      // Sync like state from server
      const liked: Record<string, boolean> = {};
      data.forEach(p => { liked[p.id] = p.is_liked; });
      setLikedState(liked);
      setLikeCountDelta({});
    } catch (e) {
      triggerToast('Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    loadPosts(activeTab);
  }, [activeTab]);

  // Refresh when navigated to with "shared" param
  useFocusEffect(
    useCallback(() => {
      const justShared = (route.params as any)?.shared === true;
      if (justShared) {
        loadPosts('recent');
        setActiveTab('recent');
        triggerToast('🎉 Dream shared to community!');
      }
    }, [route.params])
  );

  // ── Actions ─────────────────────────────────────────────────────────────────

  const toggleLike = async (postId: string) => {
    const isLiked = likedState[postId] ?? false;
    const newLiked = !isLiked;

    // Optimistic update
    setLikedState(prev => ({ ...prev, [postId]: newLiked }));
    setLikeCountDelta(prev => ({
      ...prev,
      [postId]: (prev[postId] ?? 0) + (newLiked ? 1 : -1),
    }));

    try {
      if (newLiked) {
        await likePost(postId);
        triggerToast('❤️ Liked!');
      } else {
        await unlikePost(postId);
      }
    } catch {
      // Revert
      setLikedState(prev => ({ ...prev, [postId]: isLiked }));
      setLikeCountDelta(prev => ({
        ...prev,
        [postId]: (prev[postId] ?? 0) + (newLiked ? -1 : 1),
      }));
      triggerToast('Failed to update like');
    }
  };

  const toggleFollow = async (userId: string, username: string) => {
    const isFollowing = followedUsers.has(userId);
    setFollowedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        triggerToast(`Unfollowed ${username}`);
      } else {
        await followUser(userId);
        triggerToast(`✓ Following ${username}`);
      }
    } catch {
      // Revert
      setFollowedUsers(prev => {
        const next = new Set(prev);
        if (isFollowing) next.add(userId); else next.delete(userId);
        return next;
      });
    }
  };

  const openComments = async (postId: string) => {
    setSelectedPostId(postId);
    setComments([]);
    setCommentsLoading(true);
    try {
      const data = await listComments(postId);
      setComments(data);
    } catch {
      triggerToast('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedPostId) return;
    setCommentSending(true);
    try {
      const comment = await createComment(selectedPostId, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
      // Update comment count in posts list
      setPosts(prev => prev.map(p =>
        p.id === selectedPostId
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    } catch {
      triggerToast('Failed to post comment');
    } finally {
      setCommentSending(false);
    }
  };

  const navigateToProfile = (userId: string) => {
    navigation.navigate('CommunityProfile', { username: userId });
  };

  const toggleExpand = (id: string) => {
    setExpandedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Render Post ─────────────────────────────────────────────────────────────

  const renderPost = (post: CommunityPost) => {
    const isLiked = likedState[post.id] ?? post.is_liked;
    const delta = likeCountDelta[post.id] ?? 0;
    const displayLikes = post.likes_count + delta;
    const isFollowing = followedUsers.has(post.author.id);
    const isMyPost = post.author.id === user?.id;
    const isExpanded = expandedPosts[post.id];
    const TRUNCATE = 120;

    return (
      <GlassCard key={post.id} style={[styles.postCard, ...(isMyPost ? [styles.myPostCard] : [])]}>
        {isMyPost && (
          <View style={styles.myPostBadge}>
            <Text style={styles.myPostBadgeText}>✨ Your Dream</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={() => navigateToProfile(post.author.id)}>
            <View style={[styles.avatar, isMyPost && styles.myAvatar]}>
              {post.author.avatar_url ? (
                <Image source={{ uri: post.author.avatar_url }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>
                  {post.author.display_name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity onPress={() => navigateToProfile(post.author.id)}>
                <Text style={styles.username}>{post.author.display_name}</Text>
              </TouchableOpacity>
              {!isMyPost && (
                <TouchableOpacity onPress={() => toggleFollow(post.author.id, post.author.display_name)}>
                  <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.postTime}>
              {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>

          {post.mood && (
            <View style={styles.moodPill}>
              <Text style={styles.moodEmoji}>{MOOD_EMOJI[post.mood] ?? '😶'}</Text>
              <Text style={styles.moodLabel}>
                {MOOD_LABEL[post.mood] ?? post.mood}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.postTitle}>{post.title}</Text>

        {post.image_url && (
          <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
        )}

        <Text style={styles.dreamText}>
          {post.body.length > TRUNCATE && !isExpanded
            ? post.body.substring(0, TRUNCATE) + '...'
            : post.body}
        </Text>
        {post.body.length > TRUNCATE && (
          <TouchableOpacity onPress={() => toggleExpand(post.id)}>
            <Text style={styles.seeMore}>
              {isExpanded ? 'See Less' : 'See More'}
            </Text>
          </TouchableOpacity>
        )}

        {post.tags.length > 0 && (
          <View style={styles.tagRow}>
            {post.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.postFooter}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post.id)}>
            <Icon name={isLiked ? 'heart-fill' : 'heart'} size={16} color={isLiked ? '#e05252' : colors.textSecondary} />
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              {displayLikes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(post.id)}>
            <Icon name="comment" size={16} color={colors.textSecondary} />
            <Text style={styles.actionText}>{post.comments_count}</Text>
          </TouchableOpacity>

          {isMyPost && (
            <TouchableOpacity
              style={[styles.actionBtn, { marginLeft: 'auto' }]}
              onPress={() => Alert.alert('Delete Post', 'Remove from community?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => {
                  setPosts(prev => prev.filter(p => p.id !== post.id));
                  triggerToast('🗑 Post removed');
                }},
              ])}
            >
              <Icon name="close" size={14} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>
    );
  };

  // ── Main Render ─────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <FloatingParticles />

        {/* Toast */}
        {toastMsg !== '' && (
          <RNAnimated.View
            style={[
              styles.toast,
              {
                opacity: toastAnim,
                transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.toastText}>{toastMsg}</Text>
          </RNAnimated.View>
        )}

        <View style={{ height: insets.top + 8 }} />

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts List */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPosts(activeTab, true)}
              tintColor={colors.mintGreen}
            />
          }
        >
          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={colors.mintGreen} size="large" />
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={{ fontSize: 40 }}>🌙</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'following'
                  ? 'Follow dreamers to see their posts here'
                  : 'No dreams shared yet'}
              </Text>
            </View>
          ) : (
            posts.map(renderPost)
          )}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Comments Modal */}
        <Modal
          visible={selectedPostId !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedPostId(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalGrabber} />
                <View style={styles.modalTitleRow}>
                  <Text style={styles.modalTitle}>Comments</Text>
                  <TouchableOpacity onPress={() => setSelectedPostId(null)} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.commentsList}>
                {commentsLoading ? (
                  <ActivityIndicator color={colors.mintGreen} style={{ marginTop: 24 }} />
                ) : comments.length === 0 ? (
                  <Text style={[styles.emptyText, { textAlign: 'center', marginTop: 32 }]}>
                    No comments yet. Be the first! 💬
                  </Text>
                ) : (
                  comments.map(c => (
                    <View key={c.id} style={styles.commentRow}>
                      <View style={styles.avatarSmall}>
                        {c.author.avatar_url ? (
                          <Image source={{ uri: c.author.avatar_url }} style={styles.avatarImgSmall} />
                        ) : (
                          <Text style={styles.avatarTextSmall}>
                            {c.author.display_name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentUser}>{c.author.display_name}</Text>
                          <Text style={styles.commentTime}>
                            {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{c.body}</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.commentInputRow}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarTextSmall}>
                    {user?.display_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.textTertiary}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleSendComment}
                  style={[styles.sendBtn, (!newComment.trim() || commentSending) && { opacity: 0.5 }]}
                  disabled={!newComment.trim() || commentSending}
                >
                  {commentSending ? (
                    <ActivityIndicator color={colors.mintGreen} size="small" />
                  ) : (
                    <Text style={styles.sendBtnText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  toast: {
    position: 'absolute', top: 56, alignSelf: 'center',
    zIndex: 100, backgroundColor: 'rgba(26,47,47,0.95)',
    borderRadius: borderRadius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.mintGreen + '60',
  },
  toastText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },

  tabRow: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: 'rgba(26,47,47,0.6)', borderRadius: borderRadius.md, padding: 4,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
  tabActive: { backgroundColor: colors.mintGreen },
  tabText: { ...typography.caption, color: colors.textTertiary },
  tabTextActive: { color: colors.deepTeal, fontWeight: '700' as const },

  scrollView: { flex: 1 },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textTertiary, textAlign: 'center', paddingHorizontal: 32 },

  postCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md },
  myPostCard: { borderWidth: 1.5, borderColor: colors.mintGreen + '40' },
  myPostBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(181,217,168,0.15)',
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.mintGreen + '40',
    paddingHorizontal: spacing.sm, paddingVertical: 2, marginBottom: spacing.sm,
  },
  myPostBadgeText: { ...typography.small, color: colors.mintGreen, fontWeight: '700' },

  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
    borderWidth: 1, borderColor: colors.softTeal, overflow: 'hidden',
  },
  myAvatar: { backgroundColor: 'rgba(181,217,168,0.1)', borderColor: colors.mintGreen },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },

  username: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  followBtnText: { ...typography.small, color: colors.mintGreen, fontWeight: '600' },
  followingBtnText: { color: colors.textTertiary, fontWeight: '400' },
  postTime: { ...typography.small, color: colors.textTertiary },

  moodPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: 'rgba(181,217,168,0.15)',
    borderWidth: 1, borderColor: 'rgba(181,217,168,0.3)',
  },
  moodEmoji: { fontSize: 12 },
  moodLabel: { ...typography.small, color: colors.mintGreen, fontWeight: '600' as const },

  postTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  postImage: { width: '100%', height: 180, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  dreamText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, lineHeight: 22 },
  seeMore: { ...typography.small, color: colors.mintGreen, fontWeight: '700', marginBottom: spacing.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  tag: { backgroundColor: 'rgba(26,47,47,0.7)', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  tagText: { ...typography.small, color: colors.textSecondary },

  postFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs },
  actionText: { ...typography.caption, color: colors.textTertiary, fontWeight: '500' },
  actionTextActive: { color: '#e05252' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, height: '75%' },
  modalHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface },
  modalGrabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.softTeal, alignSelf: 'center', marginBottom: spacing.md },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  closeBtn: { padding: spacing.xs },
  closeBtnText: { ...typography.body, color: colors.mintGreen, fontWeight: '600' },

  commentsList: { flex: 1, padding: spacing.lg },
  commentRow: { flexDirection: 'row', marginBottom: spacing.lg },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm, overflow: 'hidden' },
  avatarTextSmall: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  avatarImgSmall: { width: '100%', height: '100%' },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  commentUser: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  commentTime: { ...typography.caption, color: colors.textTertiary, fontSize: 11 },
  commentText: { ...typography.body, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.surface, backgroundColor: colors.background },
  commentInput: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, color: colors.textPrimary, ...typography.body, minHeight: 36, maxHeight: 100, paddingHorizontal: spacing.md, paddingVertical: 8, marginRight: spacing.sm },
  sendBtn: { justifyContent: 'center', paddingBottom: 8 },
  sendBtnText: { ...typography.body, color: colors.mintGreen, fontWeight: '600' },
});
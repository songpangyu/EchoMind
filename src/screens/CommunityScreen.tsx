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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';
import { TabParamList, RootStackParamList } from '../navigation/types';

// ─── My new shared post ────────────────────────────────────────────────────────
const MY_POST = {
  id: 'my-post',
  user: 'You',
  avatar: '✨',
  isMe: true,
  time: 'Just now',
  title: 'Fireflies in the Misty Forest',
  dream: 'I was walking through a misty forest at night. Tiny glowing fireflies danced around me, leaving trails of golden light...',
  image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=250&fit=crop',
  mood: '😌',
  tags: ['Forest', 'Night', 'Fireflies'],
  likes: 0,
  comments: 0,
  liked: false,
};

const BASE_POSTS = [
  {
    id: '1', user: 'Luna', avatar: 'L', time: '2h ago',
    title: 'Flying Over Mountains',
    dream: 'I was soaring above snow-capped peaks with golden wings. The air was crisp and I could see entire cities below like tiny models...',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=250&fit=crop',
    mood: '😌', tags: ['Flying', 'Mountains'], likes: 24, comments: 5, liked: false, saved: false,
  },
  {
    id: '2', user: 'River', avatar: 'R', time: '5h ago',
    title: 'Underwater Garden',
    dream: 'Swimming through a bioluminescent coral garden where fish sang melodies. Each coral pulsed with a different color...',
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=250&fit=crop',
    mood: '😊', tags: ['Water', 'Nature'], likes: 18, comments: 3, liked: true, saved: true,
  },
  {
    id: '3', user: 'Sky', avatar: 'S', time: '8h ago',
    title: 'Talking Animals Tea Party',
    dream: 'A wise fox invited me to a tea party inside a giant hollow oak tree. All the forest animals were there discussing philosophy...',
    image: null,
    mood: '😊', tags: ['Animals', 'Fantasy'], likes: 32, comments: 8, liked: false, saved: false,
  },
  {
    id: '4', user: 'Willow', avatar: 'W', time: '12h ago',
    title: 'Starlit Library',
    dream: 'Found an infinite library floating in space. Each book I opened transported me to a different galaxy...',
    image: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&h=250&fit=crop',
    mood: '🤔', tags: ['Stars', 'Books'], likes: 45, comments: 12, liked: true, saved: false,
  },
];

const DUMMY_COMMENTS = [
  { id: 'c1', user: 'Nova', avatar: 'N', text: 'This sounds incredibly peaceful 🌙', time: '1h ago' },
  { id: 'c2', user: 'Ash', avatar: 'A', text: 'I had a very similar dream last week! Did the colors change when you touched them?', time: '30m ago' },
];

const TABS = ['Following', 'Trending', 'Recent'];

export const CommunityScreen: React.FC = () => {
  const route = useRoute<RouteProp<TabParamList, 'Community'>>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const justShared = (route.params as any)?.shared === true;

  const [activeTab, setActiveTab] = useState('Trending');

  // Generic Toast State
  const [toastMsg, setToastMsg] = useState('');
  const toastAnim = useRef(new RNAnimated.Value(0)).current;
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [posts] = useState(() => justShared ? [MY_POST, ...BASE_POSTS] : BASE_POSTS);

  // Interactions State
  const [likedState, setLikedState] = useState<Record<string, boolean>>({});
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set(['River'])); // Example initial

  // Comments Modal State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState(DUMMY_COMMENTS);
  const [newComment, setNewComment] = useState('');

  // Animations
  const newPostAnim = useRef(new RNAnimated.Value(0)).current;

  // -- Helpers --
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

  useEffect(() => {
    if (justShared) {
      RNAnimated.spring(newPostAnim, {
        toValue: 1, useNativeDriver: true,
        tension: 60, friction: 8,
      }).start();
      setTimeout(() => triggerToast('🎉 Dream shared to community!'), 400);
    }
  }, []);

  const toggleFollow = (user: string) => {
    setFollowedUsers(prev => {
      const next = new Set(prev);
      if (next.has(user)) {
        next.delete(user);
        triggerToast(`Unfollowed ${user}`);
      } else {
        next.add(user);
        triggerToast(`✓ Following ${user}`);
      }
      return next;
    });
  };

  const toggleLike = (id: string, liked: boolean) => {
    setLikedState(prev => ({ ...prev, [id]: !liked }));
    if (!liked) triggerToast('❤️ Liked dream');
  };

  const navigateToProfile = (username: string) => {
    // We will navigate to a new CommunityProfile screen
    navigation.navigate('CommunityProfile', { username });
  };

  const toggleExpand = (id: string) => {
    setExpandedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now().toString(),
      user: 'You',
      avatar: '✨',
      text: newComment.trim(),
      time: 'Just now',
    };
    setComments([...comments, comment]);
    setNewComment('');
  };

  const renderPost = (post: typeof BASE_POSTS[0] | typeof MY_POST, index: number) => {
    const isMyPost = (post as any).isMe;
    const isLiked = likedState[post.id] ?? post.liked;
    const isFollowing = followedUsers.has(post.user);

    const card = (
      <GlassCard
        key={post.id}
        style={[styles.postCard, isMyPost && styles.myPostCard]}
      >
        {isMyPost && (
          <View style={styles.myPostBadge}>
            <Text style={styles.myPostBadgeText}>✨ Your Dream</Text>
          </View>
        )}
        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={() => navigateToProfile(post.user)}>
            <View style={[styles.avatar, isMyPost && styles.myAvatar]}>
              <Text style={styles.avatarText}>{post.avatar}</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity onPress={() => navigateToProfile(post.user)}>
                <Text style={styles.username}>{post.user}</Text>
              </TouchableOpacity>
              {!isMyPost && (
                <TouchableOpacity onPress={() => toggleFollow(post.user)}>
                  <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.postTime}>{post.time}</Text>
          </View>
          <View style={styles.moodPill}>
            <Text style={styles.moodEmoji}>{post.mood}</Text>
          </View>
        </View>

        <Text style={styles.postTitle}>{post.title}</Text>

        {(post as any).image && (
          <Image source={{ uri: (post as any).image }} style={styles.postImage} resizeMode="cover" />
        )}

        <Text style={styles.dreamText}>
          {post.dream.length > 80 && !expandedPosts[post.id]
            ? post.dream.substring(0, 80) + '...'
            : post.dream}
        </Text>
        {post.dream.length > 80 && (
          <TouchableOpacity onPress={() => toggleExpand(post.id)}>
            <Text style={{ ...typography.small, color: colors.mintGreen, fontWeight: '700', marginBottom: spacing.md, marginTop: -spacing.sm }}>
              {expandedPosts[post.id] ? 'See Less' : 'See More'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.tagRow}>
          {post.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.postFooter}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post.id, isLiked)}>
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              {isLiked ? '❤️' : '🤍'} {post.likes + (isLiked && !post.liked ? 1 : (!isLiked && post.liked ? -1 : 0))}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedPostId(post.id)}>
            <Text style={styles.actionText}>💬 {post.comments}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
      </GlassCard>
    );

    if (isMyPost) {
      return (
        <RNAnimated.View
          key={post.id}
          style={{
            opacity: newPostAnim,
            transform: [{ translateY: newPostAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
          }}
        >
          {card}
        </RNAnimated.View>
      );
    }
    return card;
  };

  return (
    <View style={styles.container}>
      <FloatingParticles />

      {/* ── Toast Overlay ── */}
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

      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Explore shared dreams</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'Following' ? (
          posts.filter(p => followedUsers.has(p.user)).map(renderPost)
        ) : (
          posts.map(renderPost)
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Comments Modal (Bottom Sheet) ── */}
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
            {/* Grabber & Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalGrabber} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>Comments</Text>
                <TouchableOpacity onPress={() => setSelectedPostId(null)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments List */}
            <ScrollView style={styles.commentsList}>
              {comments.map(c => (
                <View key={c.id} style={styles.commentRow}>
                  <View style={styles.avatarSmall}>
                    <Text style={styles.avatarTextSmall}>{c.avatar}</Text>
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
            </ScrollView>

            {/* Input field */}
            <View style={styles.commentInputRow}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarTextSmall}>✨</Text>
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
                style={[styles.sendBtn, !newComment.trim() && { opacity: 0.5 }]}
                disabled={!newComment.trim()}
              >
                <Text style={styles.sendBtnText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingTop: spacing.xxl },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },

  // Toast
  toast: {
    position: 'absolute', top: 56, alignSelf: 'center',
    zIndex: 100, backgroundColor: 'rgba(26,47,47,0.95)',
    borderRadius: borderRadius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.mintGreen + '60',
    shadowColor: colors.mintGreen, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  toastText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },

  tabRow: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: 'rgba(26,47,47,0.6)', borderRadius: borderRadius.md, padding: 4,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
  tabActive: { backgroundColor: colors.surface },
  tabText: { ...typography.caption, color: colors.textTertiary },
  tabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  scrollView: { flex: 1 },

  postCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md },
  myPostCard: {
    borderWidth: 1.5, borderColor: colors.mintGreen + '40',
    backgroundColor: 'rgba(26,47,47,0.85)',
  },
  myPostBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(181,217,168,0.15)',
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.mintGreen + '40',
    paddingHorizontal: spacing.sm, paddingVertical: 2, marginBottom: spacing.sm,
  },
  myPostBadgeText: { ...typography.small, color: colors.mintGreen, fontWeight: '700' },

  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
    borderWidth: 1, borderColor: colors.softTeal,
  },
  myAvatar: { backgroundColor: 'rgba(181,217,168,0.1)', borderColor: colors.mintGreen },
  avatarText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },

  username: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  followBtnText: { ...typography.small, color: colors.mintGreen, fontWeight: '600' },
  followingBtnText: { color: colors.textTertiary, fontWeight: '400' },
  postTime: { ...typography.small, color: colors.textTertiary },

  moodPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(20,40,40,0.8)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  moodEmoji: { fontSize: 14 },

  postTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  postImage: { width: '100%', height: 180, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  dreamText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  tag: { backgroundColor: 'rgba(26,47,47,0.7)', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  tagText: { ...typography.small, color: colors.textSecondary },

  postFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  actionBtn: { paddingVertical: spacing.xs, paddingRight: spacing.sm },
  actionText: { ...typography.caption, color: colors.textTertiary, fontWeight: '500' },
  actionTextActive: { color: colors.mintGreen },

  // Comments Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '75%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  modalGrabber: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.softTeal, alignSelf: 'center', marginBottom: spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  closeBtn: { padding: spacing.xs },
  closeBtnText: { ...typography.body, color: colors.mintGreen, fontWeight: '600' },

  commentsList: {
    flex: 1,
    padding: spacing.lg,
  },
  commentRow: {
    flexDirection: 'row', marginBottom: spacing.lg,
  },
  avatarSmall: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  avatarTextSmall: { fontSize: 12 },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2,
  },
  commentUser: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  commentTime: { ...typography.caption, color: colors.textTertiary, fontSize: 11 },
  commentText: { ...typography.body, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

  commentInputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.surface,
    backgroundColor: colors.background,
  },
  commentInput: {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md,
    color: colors.textPrimary, ...typography.body, minHeight: 36, maxHeight: 100,
    paddingHorizontal: spacing.md, paddingVertical: 8, marginRight: spacing.sm,
  },
  sendBtn: { justifyContent: 'center', paddingBottom: 8 },
  sendBtnText: { ...typography.body, color: colors.mintGreen, fontWeight: '600' },
});
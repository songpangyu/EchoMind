import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';
import { colors, spacing, typography, borderRadius } from '../theme';

const POSTS = [
  {
    id: '1', user: 'Luna', avatar: 'L', time: '2h ago',
    title: 'Flying Over Mountains',
    dream: 'I was soaring above snow-capped peaks with golden wings. The air was crisp and I could see entire cities below like tiny models...',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=250&fit=crop',
    mood: '😌', tags: ['Flying', 'Mountains'], likes: 24, comments: 5, liked: false,
  },
  {
    id: '2', user: 'River', avatar: 'R', time: '5h ago',
    title: 'Underwater Garden',
    dream: 'Swimming through a bioluminescent coral garden where fish sang melodies. Each coral pulsed with a different color...',
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=250&fit=crop',
    mood: '😊', tags: ['Water', 'Nature'], likes: 18, comments: 3, liked: true,
  },
  {
    id: '3', user: 'Sky', avatar: 'S', time: '8h ago',
    title: 'Talking Animals Tea Party',
    dream: 'A wise fox invited me to a tea party inside a giant hollow oak tree. All the forest animals were there discussing philosophy...',
    image: null,
    mood: '😊', tags: ['Animals', 'Fantasy'], likes: 32, comments: 8, liked: false,
  },
  {
    id: '4', user: 'Willow', avatar: 'W', time: '12h ago',
    title: 'Starlit Library',
    dream: 'Found an infinite library floating in space. Each book I opened transported me to a different galaxy. The librarian was a constellation...',
    image: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&h=250&fit=crop',
    mood: '🤔', tags: ['Stars', 'Books'], likes: 45, comments: 12, liked: true,
  },
  {
    id: '5', user: 'Ember', avatar: 'E', time: '1d ago',
    title: 'Crystal Cave Discovery',
    dream: 'Wandered into a cave where every surface was covered in glowing amethyst crystals. They hummed a gentle melody that healed my worries...',
    image: null,
    mood: '😌', tags: ['Cave', 'Crystals'], likes: 29, comments: 6, liked: false,
  },
  {
    id: '6', user: 'Sage', avatar: 'S', time: '1d ago',
    title: 'Time-Traveling Train',
    dream: 'Boarded a steam train that traveled through different eras. Each car was a different century, and passengers wore clothes from their time...',
    image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=250&fit=crop',
    mood: '😴', tags: ['Time', 'Adventure'], likes: 37, comments: 9, liked: false,
  },
];

const SIMILAR_DREAMS = [
  { user: 'Nova', dream: 'Flying over an ocean of clouds', match: 87 },
  { user: 'Fern', dream: 'Walking through a glowing forest', match: 82 },
  { user: 'Ash', dream: 'Swimming with luminous jellyfish', match: 76 },
];

const TABS = ['Trending', 'Recent', 'Similar'];

export const CommunityScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Trending');

  return (
    <View style={styles.container}>
      <FloatingParticles />
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
        {activeTab === 'Similar' ? (
          <View style={styles.similarSection}>
            <GlassCard style={styles.similarHeader}>
              <Text style={{ fontSize: 24 }}>🔮</Text>
              <Text style={styles.similarTitle}>Dream Matches</Text>
              <Text style={styles.similarDesc}>
                People who dreamed something similar to your recent dreams
              </Text>
            </GlassCard>
            {SIMILAR_DREAMS.map((s, i) => (
              <GlassCard key={i} style={styles.similarCard}>
                <View style={styles.similarRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{s.user[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.username}>{s.user}</Text>
                    <Text style={styles.similarDream}>{s.dream}</Text>
                  </View>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>{s.match}%</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.connectBtn}>
                  <Text style={styles.connectBtnText}>Connect</Text>
                </TouchableOpacity>
              </GlassCard>
            ))}
          </View>
        ) : (
          POSTS.map((post) => (
            <GlassCard key={post.id} style={styles.postCard}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{post.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.username}>{post.user}</Text>
                  <Text style={styles.postTime}>{post.time}</Text>
                </View>
                <View style={styles.moodBadge}>
                  <Text style={{ fontSize: 16 }}>{post.mood}</Text>
                </View>
              </View>

              {/* Dream Title */}
              <Text style={styles.postTitle}>{post.title}</Text>

              {/* Dream Image */}
              {post.image && (
                <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
              )}

              {/* Dream Text */}
              <Text style={styles.dreamText}>{post.dream}</Text>

              {/* Tags */}
              <View style={styles.tagRow}>
                {post.tags.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.postFooter}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionText}>
                    {post.liked ? '💚' : '🤍'} {post.likes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionText}>💬 {post.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionText}>🔗 Share</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}

        {/* Share Your Dream CTA */}
        <TouchableOpacity style={styles.shareCta}>
          <Text style={styles.shareCtaText}>Share Your Dream</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingTop: spacing.xxl },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  tabRow: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 4,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
  tabActive: { backgroundColor: colors.softTeal },
  tabText: { ...typography.caption, color: colors.textTertiary },
  tabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  scrollView: { flex: 1 },
  postCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.softTeal,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  avatarText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  username: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  postTime: { ...typography.small, color: colors.textTertiary },
  moodBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  postTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  postImage: { width: '100%', height: 180, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  dreamText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  tag: { backgroundColor: colors.deepTeal, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  tagText: { ...typography.small, color: colors.mintGreen },
  postFooter: { flexDirection: 'row', gap: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.deepTeal },
  actionBtn: { paddingVertical: spacing.xs },
  actionText: { ...typography.caption, color: colors.textTertiary },
  similarSection: { paddingHorizontal: spacing.lg },
  similarHeader: { marginBottom: spacing.md, alignItems: 'center' },
  similarTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  similarDesc: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  similarCard: { marginBottom: spacing.sm },
  similarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  similarDream: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  matchBadge: {
    backgroundColor: colors.mintGreen, paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  matchText: { ...typography.small, color: colors.deepTeal, fontWeight: '600' },
  connectBtn: {
    backgroundColor: colors.surface, padding: spacing.sm, borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  connectBtnText: { ...typography.caption, color: colors.mintGreen, fontWeight: '600' },
  shareCta: {
    marginHorizontal: spacing.lg, marginTop: spacing.md, backgroundColor: colors.mintGreen,
    padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center',
  },
  shareCtaText: { ...typography.body, color: colors.deepTeal, fontWeight: '600' },
});
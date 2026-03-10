import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { FloatingParticles } from '../components/FloatingParticles';
import { GlassCard } from '../components/GlassCard';

// Dummy posts for user profile
const USER_POSTS = [
    {
        id: 'p1',
        title: 'Lucid Cityscapes',
        dream: 'I was flying over a futuristic city made of light.',
        time: '2d ago',
        likes: 45,
        comments: 12,
    },
    {
        id: 'p2',
        title: 'Forest Whisper',
        dream: 'Walking through an ancient forest where the trees could talk.',
        time: '1w ago',
        likes: 120,
        comments: 34,
    },
];

export const CommunityProfileScreen: React.FC = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'CommunityProfile'>>();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { username } = route.params;

    return (
        <View style={styles.container}>
            <FloatingParticles />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Info */}
                <View style={styles.profileInfo}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarLargeText}>{username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.usernameLarge}>{username}</Text>
                    <Text style={styles.bioText}>Dream explorer. Sharing lucid adventures sideways.</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>142</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{USER_POSTS.length}</Text>
                            <Text style={styles.statLabel}>Dreams</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.followBtnLarge}>
                        <Text style={styles.followBtnLargeText}>Follow</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Recent Dreams</Text>

                {/* User Posts list */}
                {USER_POSTS.map(post => (
                    <GlassCard key={post.id} style={styles.postCard}>
                        <Text style={styles.postTime}>{post.time}</Text>
                        <Text style={styles.postTitle}>{post.title}</Text>
                        <Text style={styles.dreamText} numberOfLines={2}>{post.dream}</Text>
                        <View style={styles.postFooter}>
                            <Text style={styles.actionText}>💚 {post.likes}</Text>
                            <Text style={styles.actionText}>💬 {post.comments}</Text>
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
    profileInfo: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    avatarLarge: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarLargeText: {
        fontSize: 40,
        color: '#fff',
    },
    usernameLarge: {
        color: colors.textPrimary,
        ...typography.h1,
        marginBottom: spacing.sm,
    },
    bioText: {
        color: colors.textSecondary,
        ...typography.body,
        textAlign: 'center',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
    },
    statBox: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    statNumber: {
        color: colors.textPrimary,
        ...typography.h2,
        fontWeight: '700',
    },
    statLabel: {
        color: colors.textTertiary,
        ...typography.small,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    followBtnLarge: {
        backgroundColor: colors.mintGreen,
        paddingHorizontal: spacing.xl * 1.5,
        paddingVertical: 12,
        borderRadius: 24,
    },
    followBtnLargeText: {
        color: colors.deepTeal,
        ...typography.body,
        fontWeight: '700',
    },
    sectionTitle: {
        color: colors.textTertiary,
        ...typography.small,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    postCard: {
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    postTime: {
        color: colors.textTertiary,
        ...typography.small,
        marginBottom: 4,
    },
    postTitle: {
        color: colors.textPrimary,
        ...typography.h3,
        marginBottom: spacing.sm,
    },
    dreamText: {
        color: colors.textSecondary,
        ...typography.body,
        lineHeight: 22,
        marginBottom: spacing.md,
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

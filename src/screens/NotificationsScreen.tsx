import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { FloatingParticles } from '../components/FloatingParticles';

const DUMMY_NOTIFICATIONS = [
    { id: '1', type: 'like', text: 'River liked your dream "Fireflies in the Misty Forest"', time: '10m ago', unread: true },
    { id: '2', type: 'comment', text: 'Luna commented: "This sounds incredibly peaceful 🌙"', time: '1h ago', unread: true },
    { id: '3', type: 'save', text: 'Sky saved your dream "Fireflies in the Misty Forest"', time: '2h ago', unread: false },
    { id: '4', type: 'like', text: 'Nova liked your dream "Underwater Garden"', time: '1d ago', unread: false },
];

export const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <FloatingParticles />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {DUMMY_NOTIFICATIONS.map(notif => (
                    <GlassCard key={notif.id} style={[styles.notifCard, notif.unread ? styles.unreadCard : {}]}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.iconText}>
                                {notif.type === 'like' ? '💚' : notif.type === 'comment' ? '💬' : '⭐'}
                            </Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.notifText}>{notif.text}</Text>
                            <Text style={styles.timeText}>{notif.time}</Text>
                        </View>
                        {notif.unread && <View style={styles.unreadDot} />}
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
    notifCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    unreadCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(100, 255, 218, 0.3)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    iconText: {
        fontSize: 20,
    },
    textContainer: {
        flex: 1,
    },
    notifText: {
        ...typography.body,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    timeText: {
        ...typography.small,
        color: colors.textTertiary,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.mintGreen,
        marginLeft: spacing.sm,
    },
});

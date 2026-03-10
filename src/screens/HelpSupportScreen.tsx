import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { FloatingParticles } from '../components/FloatingParticles';
import { GlassCard } from '../components/GlassCard';

export const HelpSupportScreen: React.FC = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <FloatingParticles />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

                <GlassCard style={styles.faqCard}>
                    <Text style={styles.question}>How do I record a dream?</Text>
                    <Text style={styles.answer}>Tap the glowing orb in the center of the bottom navigation bar to start recording a new dream via voice or text.</Text>
                </GlassCard>

                <GlassCard style={styles.faqCard}>
                    <Text style={styles.question}>Can I edit a shared dream?</Text>
                    <Text style={styles.answer}>Once shared to the Community, you can delete a dream from your profile, but editing is currently disabled to preserve comment threads.</Text>
                </GlassCard>

                <GlassCard style={styles.faqCard}>
                    <Text style={styles.question}>How does the AI interpretation work?</Text>
                    <Text style={styles.answer}>Our models analyze symbols, emotions, and common themes to provide personalized insights based on Jungian and modern psychology frameworks.</Text>
                </GlassCard>

                <TouchableOpacity style={styles.contactBtn}>
                    <Text style={styles.contactBtnText}>Contact Support</Text>
                </TouchableOpacity>

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
    sectionTitle: {
        ...typography.small,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    faqCard: {
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    question: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    answer: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    contactBtn: {
        marginTop: spacing.xl,
        padding: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: borderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    contactBtnText: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
    },
});

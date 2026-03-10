import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { FloatingParticles } from '../components/FloatingParticles';

export const PrivacyScreen: React.FC = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <FloatingParticles />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.contentTitle}>Your Dreams Are Yours</Text>
                <Text style={styles.contentText}>
                    At EchoMind, we believe that your dreams are deeply personal. All entries you record locally on your device stay on your device unless you explicitly share them to the Community.
                </Text>

                <Text style={styles.contentTitle}>Data Security</Text>
                <Text style={styles.contentText}>
                    We encrypt all cloud-synced dream data. You have the right to delete your account and all associated data at any time from the app settings.
                </Text>

                <Text style={styles.contentTitle}>Third-Party Services</Text>
                <Text style={styles.contentText}>
                    We only share anonymous, aggregated data for analytical purposes to improve AI dream analysis models. Your username and explicit dream content are never sold.
                </Text>
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
    contentTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginTop: spacing.xl,
        marginBottom: spacing.sm,
    },
    contentText: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 24,
    },
});

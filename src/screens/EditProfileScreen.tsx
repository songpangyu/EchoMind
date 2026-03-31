import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { colors, spacing, typography, borderRadius } from '../theme';
import Icon from '../components/Icon';
import { FloatingParticles } from '../components/FloatingParticles';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useAuth } from '../contexts/AuthContext';
import { uploadAvatar, updateMe } from '../api/auth';
import { launchImageLibrary } from 'react-native-image-picker';

export const EditProfileScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { user, refreshUser } = useAuth();
    
    const [name, setName] = useState(user?.display_name || 'Dreamer');
    const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url || null);
    const [avatarFile, setAvatarFile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.display_name || 'Dreamer');
            setAvatarUri(user.avatar_url || null);
        }
    }, [user?.id]);

    const handlePickImage = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
        if (!result.didCancel && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setAvatarUri(asset.uri || null);
            setAvatarFile(asset);
        }
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            let updated = false;

            if (avatarFile && avatarFile.uri) {
                await uploadAvatar(
                    avatarFile.uri,
                    avatarFile.type || 'image/jpeg',
                    avatarFile.fileName || 'avatar.jpg'
                );
                updated = true;
            }

            if (name !== user?.display_name) {
                await updateMe({ display_name: name });
                updated = true;
            }

            if (updated) {
                await refreshUser();
            }
            navigation.goBack();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenWrapper>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <FloatingParticles />
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color={colors.mintGreen} size="small" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} disabled={isLoading}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <Icon name="moon" size={32} color={colors.mintGreen} />
                        )}
                        <View style={styles.editIconWrapper}>
                            <Icon name="camera" size={16} color={colors.textPrimary} />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.hintText}>Tap to change avatar</Text>
                </View>

                <View style={styles.inputSection}>
                    <Text style={styles.label}>Display Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Your name"
                        placeholderTextColor={colors.textTertiary}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
        </ScreenWrapper>
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
    saveBtnText: {
        ...typography.body,
        color: colors.mintGreen,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: spacing.xxl,
    },
    avatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: colors.mintGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
        position: 'relative',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    avatarEmoji: {
        fontSize: 50,
    },
    editIconWrapper: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.surface,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    editIcon: {
        fontSize: 16,
    },
    hintText: {
        ...typography.small,
        color: colors.textTertiary,
    },
    inputSection: {
        marginTop: spacing.md,
    },
    label: {
        ...typography.small,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: borderRadius.md,
        color: colors.textPrimary,
        padding: spacing.md,
        ...typography.body,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
});

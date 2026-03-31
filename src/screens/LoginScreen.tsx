import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Title */}
        <View style={styles.headerArea}>
          <Text style={styles.logo}>🌙</Text>
          <Text style={styles.title}>EchoMind</Text>
          <Text style={styles.subtitle}>Your dream journal</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Enter your username"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.deepTeal} />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>



          <TouchableOpacity
            onPress={() => navigation.navigate('Register' as any)}
            style={styles.switchLink}
          >
            <Text style={styles.switchText}>
              Don't have an account? <Text style={styles.switchHighlight}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },

  headerArea: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 64, marginBottom: spacing.md },
  title: { ...typography.h1, color: colors.textPrimary, fontSize: 32, fontWeight: '700' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },

  form: { gap: spacing.md },
  errorBox: {
    backgroundColor: 'rgba(224,82,82,0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(224,82,82,0.3)',
  },
  errorText: { ...typography.caption, color: '#e05252' },

  inputGroup: { gap: spacing.xs },
  label: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(26,47,47,0.8)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.softTeal,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.body,
  },

  btn: {
    backgroundColor: colors.mintGreen,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { ...typography.body, color: colors.deepTeal, fontWeight: '700', fontSize: 16 },

  switchLink: { alignItems: 'center', marginTop: spacing.sm },
  switchText: { ...typography.caption, color: colors.textSecondary },
  switchHighlight: { color: colors.mintGreen, fontWeight: '600' },


});

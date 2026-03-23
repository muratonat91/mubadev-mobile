import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { AuthApi } from '../../api/auth.api';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { colors, spacing, fontSize, radius } from '../../theme';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Toast.show({ type: 'error', text1: t('auth.emailRequired') });
      return;
    }
    setLoading(true);
    try {
      await AuthApi.forgotPassword(email.trim());
      setSent(true);
    } catch {
      Toast.show({ type: 'error', text1: t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.appName}>ProjectConfigurator</Text>
        <Text style={styles.title}>{t('auth.forgotPassword')}</Text>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.successTitle}>{t('auth.checkEmail')}</Text>
            <Text style={styles.successMsg}>{t('auth.resetLinkSent')}</Text>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.hint}>{t('auth.forgotPasswordHint')}</Text>
            <AppInput
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <AppButton
              title={t('auth.sendResetLink')}
              onPress={handleSubmit}
              loading={loading}
            />
          </View>
        )}

        <TouchableOpacity style={styles.link} onPress={() => router.back()}>
          <Text style={styles.linkText}>
            ← {t('auth.backToLogin')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  appName: {
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  title: {
    textAlign: 'center',
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray900,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.gray500,
    lineHeight: 20,
  },
  form: { gap: spacing.md },
  successBox: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#f0fdf4',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successIcon: { fontSize: 40 },
  successTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.success,
  },
  successMsg: {
    fontSize: fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 20,
  },
  link: { alignItems: 'center' },
  linkText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
});

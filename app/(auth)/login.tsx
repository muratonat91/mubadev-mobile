import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth';
import { AuthApi } from '../../api/auth.api';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { colors, spacing, fontSize, radius } from '../../theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert(t('common.error'), 'Email and password required'); return; }
    setLoading(true);
    try {
      const tokens = await AuthApi.login(email.trim(), password);
      await AsyncStorage.setItem('access_token', tokens.access_token);
      await AsyncStorage.setItem('refresh_token', tokens.refresh_token);
      const me = await AuthApi.me();
      setUser(me);
      if (me.status === 'pending_approval') {
        router.replace('/(auth)/pending');
      } else {
        router.replace('/(app)');
      }
    } catch {
      Alert.alert(t('common.error'), 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.appName}>ProjectConfigurator</Text>
        <Text style={styles.title}>{t('auth.login')}</Text>

        <View style={styles.form}>
          <AppInput
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <AppInput
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <AppButton title={t('auth.signIn')} onPress={handleLogin} loading={loading} />
          <TouchableOpacity style={styles.forgotLink} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.linkText}>{t('auth.noAccount')} <Text style={styles.linkBold}>{t('auth.register')}</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryLight, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg },
  appName: { textAlign: 'center', fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  title: { textAlign: 'center', fontSize: fontSize['2xl'], fontWeight: '700', color: colors.gray900 },
  form: { gap: spacing.md },
  link: { alignItems: 'center' },
  linkText: { fontSize: fontSize.sm, color: colors.gray500 },
  linkBold: { color: colors.primary, fontWeight: '600' },
  forgotLink: { alignItems: 'center' },
  forgotText: { fontSize: fontSize.sm, color: colors.primary },
});

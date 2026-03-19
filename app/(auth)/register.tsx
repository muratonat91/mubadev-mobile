import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthApi } from '../../api/auth.api';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { colors, spacing, fontSize, radius } from '../../theme';

type Step = 'email' | 'verify' | 'profile';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);

  // Fields
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [company, setCompany] = useState('');
  const [companyTitle, setCompanyTitle] = useState('');
  const [phone, setPhone] = useState('');

  const STEPS: Step[] = ['email', 'verify', 'profile'];
  const stepIndex = STEPS.indexOf(step);

  const handleSendCode = async () => {
    if (!email) { Alert.alert(t('common.error'), 'Email required'); return; }
    setLoading(true);
    try {
      await AuthApi.register(email.trim());
      setStep('verify');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('common.error');
      Alert.alert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) { Alert.alert(t('common.error'), 'Code required'); return; }
    setLoading(true);
    try {
      await AuthApi.verifyCode(email.trim(), code.trim());
      setStep('profile');
    } catch {
      Alert.alert(t('common.error'), 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!password || password !== confirmPass) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await AuthApi.completeProfile({ email: email.trim(), password, company, company_title: companyTitle, phone });
      router.replace('/(auth)/pending');
    } catch {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>{t('auth.register')}</Text>

        {/* Step indicator */}
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepRow}>
              <View style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]}>
                <Text style={[styles.stepNum, i <= stepIndex && styles.stepNumActive]}>{i + 1}</Text>
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, i < stepIndex && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        <View style={styles.form}>
          {step === 'email' && (
            <>
              <AppInput label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <AppButton title={t('common.next')} onPress={handleSendCode} loading={loading} />
            </>
          )}

          {step === 'verify' && (
            <>
              <Text style={styles.hint}>{t('auth.codeSent')}</Text>
              <AppInput label={t('auth.verifyCode')} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
              <AppButton title={t('auth.verify')} onPress={handleVerify} loading={loading} />
              <AppButton title={t('common.back')} onPress={() => setStep('email')} variant="ghost" />
            </>
          )}

          {step === 'profile' && (
            <>
              <AppInput label={t('auth.company')} value={company} onChangeText={setCompany} />
              <AppInput label={t('auth.companyTitle')} value={companyTitle} onChangeText={setCompanyTitle} />
              <AppInput label={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <AppInput label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry />
              <AppInput label={t('auth.confirmPassword')} value={confirmPass} onChangeText={setConfirmPass} secureTextEntry />
              <AppButton title={t('auth.completeReg')} onPress={handleComplete} loading={loading} />
            </>
          )}
        </View>

        <TouchableOpacity style={styles.link} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.linkText}>{t('auth.hasAccount')} <Text style={styles.linkBold}>{t('auth.login')}</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryLight, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg },
  title: { textAlign: 'center', fontSize: fontSize['2xl'], fontWeight: '700', color: colors.gray900 },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gray200, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: colors.primary },
  stepNum: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray500 },
  stepNumActive: { color: colors.white },
  stepLine: { width: 32, height: 2, backgroundColor: colors.gray200 },
  stepLineActive: { backgroundColor: colors.primary },
  hint: { fontSize: fontSize.sm, color: colors.gray500, textAlign: 'center' },
  form: { gap: spacing.md },
  link: { alignItems: 'center' },
  linkText: { fontSize: fontSize.sm, color: colors.gray500 },
  linkBold: { color: colors.primary, fontWeight: '600' },
});

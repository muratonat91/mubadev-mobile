import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../i18n/config';
import { useAuthStore } from '../../store/auth';
import { AuthApi } from '../../api/auth.api';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { colors, spacing, fontSize, radius } from '../../theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [company, setCompany] = useState(user?.company ?? '');
  const [companyTitle, setCompanyTitle] = useState(user?.company_title ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const currentLang = i18n.language;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await AuthApi.updateProfile({
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        company: company.trim() || undefined,
        company_title: companyTitle.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setUser(updated);
      Toast.show({ type: 'success', text1: t('profile.toastUpdated') });
    } catch {
      Toast.show({ type: 'error', text1: t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert(t('common.error'), t('profile.fillAllPasswordFields'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert(t('common.error'), t('profile.passwordMismatch'));
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(t('common.error'), t('profile.passwordTooShort'));
      return;
    }
    setChangingPassword(true);
    try {
      await AuthApi.changePassword(currentPassword, newPassword);
      Toast.show({ type: 'success', text1: t('profile.passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch {
      Toast.show({ type: 'error', text1: t('profile.passwordChangeFailed') });
    } finally {
      setChangingPassword(false);
    }
  };

  const toggleLanguage = async () => {
    const newLang = currentLang === 'en' ? 'tr' : 'en';
    await i18n.changeLanguage(newLang);
    await AsyncStorage.setItem('app_language', newLang);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.pageTitle}>{t('profile.title')}</Text>
            <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
              <Text style={styles.langBtnText}>{currentLang === 'en' ? 'TR' : 'EN'}</Text>
            </TouchableOpacity>
          </View>

          {/* User Info (read-only) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.accountInfo')}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('auth.email')}</Text>
              <Text style={styles.infoValue}>{user?.email ?? '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile.role')}</Text>
              <Text style={styles.infoValue}>{user?.role ?? '—'}</Text>
            </View>
          </View>

          {/* Edit Profile */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.editProfile')}</Text>
            <AppInput
              label={t('profile.firstName')}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            <AppInput
              label={t('profile.lastName')}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
            <AppInput
              label={t('auth.company')}
              value={company}
              onChangeText={setCompany}
            />
            <AppInput
              label={t('auth.companyTitle')}
              value={companyTitle}
              onChangeText={setCompanyTitle}
            />
            <AppInput
              label={t('auth.phone')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <AppButton
              title={t('common.save')}
              onPress={handleSaveProfile}
              loading={saving}
            />
          </View>

          {/* Change Password */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.changePassword')}</Text>
            <AppInput
              label={t('profile.currentPassword')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <AppInput
              label={t('profile.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <AppInput
              label={t('profile.confirmNewPassword')}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
            />
            <AppButton
              title={t('profile.changePassword')}
              onPress={handleChangePassword}
              loading={changingPassword}
              variant="secondary"
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray900 },
  langBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  langBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.gray900 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: fontSize.sm, color: colors.gray500, fontWeight: '500' },
  infoValue: { fontSize: fontSize.sm, color: colors.gray900, fontWeight: '600' },
});

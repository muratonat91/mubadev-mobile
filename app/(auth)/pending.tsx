import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth';
import { AppButton } from '../../components/ui/AppButton';
import { colors, spacing, fontSize, radius } from '../../theme';

export default function PendingScreen() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>⏳</Text>
        <Text style={styles.title}>{t('auth.pendingTitle')}</Text>
        <Text style={styles.message}>{t('auth.pendingMsg')}</Text>
        <AppButton title={t('auth.logout')} onPress={logout} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg, width: '100%', alignItems: 'center' },
  icon: { fontSize: 48 },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray900, textAlign: 'center' },
  message: { fontSize: fontSize.base, color: colors.gray500, textAlign: 'center', lineHeight: 22 },
});

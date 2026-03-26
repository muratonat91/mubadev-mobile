import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../i18n/config';
import { useAuthStore } from '../../store/auth';
import { colors, spacing, fontSize, radius } from '../../theme';

const CARDS = [
  { titleKey: 'nav.projects', emoji: '📁', route: '/(app)/projects' as const, color: colors.accentDark, glow: 'rgba(27,141,186,0.3)' },
  { titleKey: 'nav.products', emoji: '📦', route: '/(app)/products' as const, color: '#7c3aed', glow: 'rgba(124,58,237,0.3)' },
  { titleKey: 'nav.notifications', emoji: '🔔', route: '/(app)/notifications' as const, color: '#059669', glow: 'rgba(5,150,105,0.3)' },
] as const;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const currentLang = i18n.language;

  const toggleLanguage = async () => {
    const newLang = currentLang === 'en' ? 'tr' : 'en';
    await i18n.changeLanguage(newLang);
    await AsyncStorage.setItem('app_language', newLang);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.appName}>MUBADEV Matrix</Text>
            <Text style={styles.greeting}>
              {user?.first_name ? `👋 ${user.first_name}` : `👋 ${user?.email}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
            <Text style={styles.langBtnText}>{currentLang === 'en' ? 'TR' : 'EN'}</Text>
          </TouchableOpacity>
        </View>

        {/* Role badge */}
        {user?.role && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user.role.toUpperCase()}</Text>
          </View>
        )}

        {/* Cards */}
        <View style={styles.grid}>
          {CARDS.map(card => (
            <TouchableOpacity
              key={card.route}
              style={[styles.card, { borderColor: card.color + '40', shadowColor: card.glow }]}
              onPress={() => router.push(card.route)}
              activeOpacity={0.8}
            >
              <View style={[styles.cardIcon, { backgroundColor: card.color + '20' }]}>
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
              </View>
              <Text style={styles.cardTitle}>{t(card.titleKey)}</Text>
              <Text style={[styles.cardArrow, { color: card.color }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>⎋  {t('auth.logout')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: spacing.sm },
  headerLeft: { gap: 4, flex: 1 },
  appName: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.accent, letterSpacing: 0.5 },
  greeting: { fontSize: fontSize.base, color: colors.subtext },
  langBtn: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  langBtnText: { color: colors.accent, fontWeight: '700', fontSize: fontSize.sm },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  roleBadgeText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1 },
  grid: { gap: spacing.md },
  card: {
    backgroundColor: colors.surface2,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardIcon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 24 },
  cardTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardArrow: { fontSize: 28, fontWeight: '300' },
  divider: { height: 1, backgroundColor: colors.border },
  logoutBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  logoutText: { fontSize: fontSize.sm, color: colors.muted },
});

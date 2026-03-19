import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { colors, spacing, fontSize, radius } from '../../theme';

const CARDS = [
  { titleKey: 'nav.projects', emoji: '📁', route: '/(app)/projects' as const, color: '#2563eb' },
  { titleKey: 'nav.products', emoji: '📦', route: '/(app)/products' as const, color: '#7c3aed' },
  { titleKey: 'nav.notifications', emoji: '🔔', route: '/(app)/notifications' as const, color: '#059669' },
] as const;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appName}>ProjectConfigurator</Text>
          <Text style={styles.greeting}>👋 {user?.email}</Text>
        </View>

        <View style={styles.grid}>
          {CARDS.map(card => (
            <TouchableOpacity
              key={card.route}
              style={[styles.card, { backgroundColor: card.color }]}
              onPress={() => router.push(card.route)}
              activeOpacity={0.85}
            >
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
              <Text style={styles.cardTitle}>{t(card.titleKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  container: { padding: spacing.lg, gap: spacing.xl },
  header: { gap: spacing.xs },
  appName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  greeting: { fontSize: fontSize.base, color: colors.gray500 },
  grid: { gap: spacing.md },
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardEmoji: { fontSize: 40 },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.white },
  logoutBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  logoutText: { fontSize: fontSize.sm, color: colors.gray400 },
});

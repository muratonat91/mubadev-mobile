import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { NotificationsApi, type NotificationDto } from '../../api/notifications.api';
import { AppButton } from '../../components/ui/AppButton';
import { colors, spacing, fontSize, radius } from '../../theme';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifications(await NotificationsApi.list());
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    await NotificationsApi.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await NotificationsApi.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    Toast.show({ type: 'success', text1: t('notifications.toastMarked') });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderItem = ({ item }: { item: NotificationDto }) => (
    <TouchableOpacity
      style={[styles.card, !item.is_read && styles.cardUnread]}
      onPress={() => !item.is_read && handleMarkRead(item.id)}
      activeOpacity={item.is_read ? 1 : 0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, !item.is_read && styles.cardTitleUnread]}>{item.title}</Text>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.cardMessage}>{item.message}</Text>
      <Text style={styles.cardMeta}>
        {item.sender_email} · {new Date(item.created_at).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>{t('notifications.title')}</Text>
        {unreadCount > 0 && (
          <AppButton
            title={t('notifications.markAllRead')}
            onPress={handleMarkAllRead}
            variant="ghost"
            style={styles.markAllBtn}
          />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchNotifications(); }} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  pageTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray900 },
  markAllBtn: { paddingVertical: 7, paddingHorizontal: 12 },
  list: { padding: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardUnread: { borderColor: colors.primary, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: fontSize.base, fontWeight: '500', color: colors.gray800, flex: 1 },
  cardTitleUnread: { fontWeight: '700', color: colors.gray900 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: spacing.sm },
  cardMessage: { fontSize: fontSize.sm, color: colors.gray600, lineHeight: 20 },
  cardMeta: { fontSize: fontSize.xs, color: colors.gray400 },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: fontSize.base, color: colors.gray400 },
});

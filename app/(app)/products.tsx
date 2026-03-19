import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { ProductsApi, type ProductDto } from '../../api/products.api';
import { AppButton } from '../../components/ui/AppButton';
import { colors, spacing, fontSize, radius } from '../../theme';

export default function ProductsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ project_id?: string }>();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const projectId = params.project_id ? Number(params.project_id) : undefined;

  const fetchProducts = useCallback(async (p = 1, reset = false) => {
    try {
      const result = await ProductsApi.list({ project_id: projectId, search: search || undefined, page: p, limit: 20 });
      setProducts(prev => reset ? result.data : [...prev, ...result.data]);
      setTotal(result.meta.total);
      setPage(p);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [projectId, search]);

  useEffect(() => { void fetchProducts(1, true); }, [fetchProducts]);

  const handleDelete = (item: ProductDto) => {
    Alert.alert(t('products.confirmDelete'), item.product_name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          await ProductsApi.delete(item.id);
          setProducts(prev => prev.filter(p => p.id !== item.id));
          Toast.show({ type: 'success', text1: t('products.toastDeleted') });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ProductDto }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{item.product_name}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{item.product_type}</Text>
        </View>
      </View>
      <Text style={styles.cardSub}>{item.machine_type_name} · {item.machine_name}</Text>
      <Text style={styles.cardSub}>{item.project_name}</Text>
      {item.copied_from_project_name ? (
        <Text style={styles.copiedBadge}>{t('products.copiedFrom', { project: item.copied_from_project_name })}</Text>
      ) : null}
      <View style={styles.cardActions}>
        <AppButton
          title={t('common.edit')}
          onPress={() => router.push(`/(app)/product-form?id=${item.id}`)}
          variant="secondary"
          style={styles.actionBtn}
        />
        <AppButton
          title={t('common.delete')}
          onPress={() => handleDelete(item)}
          variant="danger"
          style={styles.actionBtn}
        />
      </View>
    </View>
  );

  const hasMore = products.length < total;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>{t('products.title')}</Text>
        <AppButton
          title={t('products.new')}
          onPress={() => router.push(`/(app)/product-form${projectId ? `?project_id=${projectId}` : ''}`)}
          style={styles.newBtn}
        />
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('products.search')}
          placeholderTextColor={colors.gray400}
          value={search}
          onChangeText={s => { setSearch(s); }}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchProducts(1, true); }} />}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>{t('common.noData')}</Text> : null}
        onEndReached={() => { if (hasMore && !isLoading) void fetchProducts(page + 1); }}
        onEndReachedThreshold={0.3}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  pageTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray900 },
  newBtn: { paddingVertical: 8, paddingHorizontal: 14 },
  searchBar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    fontSize: fontSize.base,
    color: colors.gray900,
  },
  list: { padding: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.gray200 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  cardName: { fontSize: fontSize.md, fontWeight: '600', color: colors.gray900, flex: 1 },
  typeBadge: { backgroundColor: colors.gray100, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontSize: fontSize.xs, color: colors.gray600 },
  cardSub: { fontSize: fontSize.sm, color: colors.gray500 },
  copiedBadge: { fontSize: fontSize.xs, color: colors.primary, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1, paddingVertical: 7 },
  empty: { textAlign: 'center', color: colors.gray400, marginTop: 60 },
});

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, RefreshControl, Modal, ScrollView,
  ActivityIndicator, Image,
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? 'https://icematrix.site';
const toImageUrl = (path: string) => path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { ProductsApi, type ProductDto } from '../../api/products.api';
import { ProjectsApi, type ProjectDto } from '../../api/projects.api';
import { AppButton } from '../../components/ui/AppButton';
import { colors, spacing, fontSize, radius } from '../../theme';

// ─── Product Detail Modal ──────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: unknown }) {
  let display: React.ReactNode;

  if (value === null || value === undefined || value === '') {
    display = <Text style={detailStyles.valueMuted}>—</Text>;
  } else if (typeof value === 'boolean') {
    display = (
      <Text style={[detailStyles.valueBadge, value ? detailStyles.yes : detailStyles.no]}>
        {value ? 'Yes' : 'No'}
      </Text>
    );
  } else {
    display = <Text style={detailStyles.value}>{String(value)}</Text>;
  }

  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      {display}
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  label: { fontSize: fontSize.sm, color: colors.gray500, flex: 1, marginRight: spacing.sm },
  value: { fontSize: fontSize.sm, color: colors.gray900, fontWeight: '500', flex: 1, textAlign: 'right' },
  valueMuted: { fontSize: fontSize.sm, color: colors.gray300, flex: 1, textAlign: 'right' },
  valueBadge: { fontSize: fontSize.xs, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  yes: { backgroundColor: '#dcfce7', color: '#15803d' },
  no: { backgroundColor: '#fee2e2', color: '#dc2626' },
});

function ProductDetailModal({ product, onClose }: { product: ProductDto; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title} numberOfLines={2}>{product.product_name}</Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Text style={modalStyles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modalStyles.content}>
          <Text style={modalStyles.sectionTitle}>{t('products.steps.machine')}</Text>
          <DetailRow label={t('products.fields.machineType')} value={product.machine_type_name} />
          <DetailRow label={t('products.fields.machine')} value={product.machine_name} />
          <DetailRow label={t('products.fields.project')} value={product.project_name} />

          <Text style={[modalStyles.sectionTitle, { marginTop: spacing.md }]}>{t('products.steps.info')}</Text>
          <DetailRow label={t('products.fields.productType')} value={product.product_type} />
          <DetailRow label={t('products.fields.capacity')} value={product.capacity} />
          <DetailRow label={t('products.fields.toBeCommissioned')} value={product.to_be_commissioned} />

          <Text style={[modalStyles.sectionTitle, { marginTop: spacing.md }]}>{t('products.steps.flavor')}</Text>
          <DetailRow label={t('products.fields.noOfFlavor')} value={product.no_of_flavor} />
          <DetailRow label={t('products.fields.totalVolume')} value={product.total_volume} />
          <DetailRow label={t('products.fields.inclusionInIceCream')} value={product.inclusion_in_ice_cream} />
          <DetailRow label={t('products.fields.rippleSauce')} value={product.ripple_sauce} />
          <DetailRow label={t('products.fields.noOfRippleSauce')} value={product.no_of_ripple_sauce} />

          <Text style={[modalStyles.sectionTitle, { marginTop: spacing.md }]}>{t('products.steps.filling')}</Text>
          <DetailRow label={t('products.fields.fillingPattern')} value={product.filling_pattern} />
          <DetailRow label={t('products.fields.liquidSauceTopping')} value={product.liquid_sauce_topping} />
          <DetailRow label={t('products.fields.liquidSauceToppingType')} value={product.liquid_sauce_topping_type} />
          <DetailRow label={t('products.fields.dryTopping')} value={product.dry_topping} />
          <DetailRow label={t('products.fields.dryToppingTypeSize')} value={product.dry_topping_type_size} />

          <Text style={[modalStyles.sectionTitle, { marginTop: spacing.md }]}>{t('products.steps.chocolate')}</Text>
          <DetailRow label={t('products.fields.chocolateCoating')} value={product.chocolate_coating} />
          <DetailRow label={t('products.fields.chocolateCoatingType')} value={product.chocolate_coating_type} />
          <DetailRow label={t('products.fields.coatingSequence')} value={product.coating_sequence} />
          <DetailRow label={t('products.fields.dryStuffInChocolate')} value={product.dry_stuff_in_chocolate} />
          <DetailRow label={t('products.fields.dryStuffType')} value={product.dry_stuff_type} />

          <Text style={[modalStyles.sectionTitle, { marginTop: spacing.md }]}>{t('products.steps.dimensions')}</Text>
          <DetailRow label={t('products.fields.lengthL1')} value={product.product_length_l1} />
          <DetailRow label={t('products.fields.lengthL2')} value={product.product_length_l2} />
          <DetailRow label={t('products.fields.widthW')} value={product.product_width_w} />
          <DetailRow label={t('products.fields.thicknessH')} value={product.product_thickness_h} />
          <DetailRow label={t('products.fields.diameter')} value={product.product_diameter} />
          <DetailRow label={t('products.fields.coneDegree')} value={product.cone_degree} />

          <Text style={[modalStyles.sectionTitle, { marginTop: spacing.md }]}>{t('products.steps.stick')}</Text>
          <DetailRow label={t('products.fields.stickType')} value={product.stick_type} />
          <DetailRow label={t('products.fields.stickLength')} value={product.stick_length} />
          <DetailRow label={t('products.fields.stickWidth')} value={product.stick_width} />

          <Text style={[modalStyles.sectionTitle, { marginTop: spacing.md }]}>{t('products.steps.eol')}</Text>
          <DetailRow label={t('products.fields.isEolInc')} value={product.is_eol_inc} />
          <DetailRow label={t('products.fields.howManyPackPattern')} value={product.how_many_pack_pattern} />

          {product.copied_from_project_name ? (
            <>
              <Text style={[modalStyles.sectionTitle, { marginTop: spacing.md }]}>{t('products.copyInfo')}</Text>
              <DetailRow label={t('products.copiedFrom', { project: '' })} value={product.copied_from_project_name} />
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: fontSize.lg, fontWeight: '700', color: colors.gray900 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: fontSize.base, color: colors.gray600, fontWeight: '700' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Copy Product Modal ────────────────────────────────────────────────────────

function CopyProductModal({
  product,
  projects,
  onClose,
  onSuccess,
}: {
  product: ProductDto;
  projects: ProjectDto[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    if (!selectedProjectId) {
      Alert.alert(t('common.error'), t('products.selectProject'));
      return;
    }
    setCopying(true);
    try {
      await ProductsApi.copy(product.id, selectedProjectId);
      Toast.show({ type: 'success', text1: t('products.toastCopied') });
      onSuccess();
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: t('common.error') });
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={copyStyles.overlay}>
        <View style={copyStyles.sheet}>
          <Text style={copyStyles.title}>{t('products.copyTo')}</Text>
          <Text style={copyStyles.subtitle}>{product.product_name}</Text>

          <ScrollView style={copyStyles.list} showsVerticalScrollIndicator={false}>
            {projects.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[copyStyles.projectItem, selectedProjectId === p.id && copyStyles.projectItemSelected]}
                onPress={() => setSelectedProjectId(p.id)}
              >
                <Text style={[copyStyles.projectName, selectedProjectId === p.id && copyStyles.projectNameSelected]}>
                  {p.project_name}
                </Text>
                {p.customer_name ? (
                  <Text style={copyStyles.projectSub}>{p.customer_name}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={copyStyles.actions}>
            <AppButton title={t('common.cancel')} onPress={onClose} variant="ghost" style={{ flex: 1 }} />
            <AppButton
              title={t('products.copy')}
              onPress={handleCopy}
              loading={copying}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const copyStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '70%',
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray900 },
  subtitle: { fontSize: fontSize.sm, color: colors.gray500 },
  list: { maxHeight: 300 },
  projectItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.sm,
    gap: 2,
  },
  projectItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  projectName: { fontSize: fontSize.base, color: colors.gray900, fontWeight: '600' },
  projectNameSelected: { color: colors.primary },
  projectSub: { fontSize: fontSize.sm, color: colors.gray500 },
  actions: { flexDirection: 'row', gap: spacing.md },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

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

  // Detail modal
  const [detailProduct, setDetailProduct] = useState<ProductDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Copy modal
  const [copyProduct, setCopyProduct] = useState<ProductDto | null>(null);
  const [allProjects, setAllProjects] = useState<ProjectDto[]>([]);

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

  // Preload projects for copy modal
  useEffect(() => {
    void ProjectsApi.list().then(setAllProjects).catch(() => {});
  }, []);

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

  const handleOpenDetail = async (item: ProductDto) => {
    setLoadingDetail(true);
    try {
      const full = await ProductsApi.getById(item.id);
      setDetailProduct(full);
    } catch {
      Toast.show({ type: 'error', text1: t('common.error') });
    } finally {
      setLoadingDetail(false);
    }
  };

  const renderItem = ({ item }: { item: ProductDto }) => {
    const primaryImg = item.images?.find(i => i.is_primary) ?? item.images?.[0];
    return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {primaryImg?.image_url ? (
          <Image
            source={{ uri: toImageUrl(primaryImg.image_url) }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={{ fontSize: 20 }}>📦</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{item.product_name}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{item.product_type}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.cardSub}>{item.machine_type_name} · {item.machine_name}</Text>
      <Text style={styles.cardSub}>{item.project_name}</Text>
      {item.copied_from_project_name ? (
        <Text style={styles.copiedBadge}>{t('products.copiedFrom', { project: item.copied_from_project_name })}</Text>
      ) : null}
      <View style={styles.cardActions}>
        {/* Info / Detail button */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => handleOpenDetail(item)}
          disabled={loadingDetail}
        >
          {loadingDetail ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.iconBtnText}>👁</Text>
          )}
        </TouchableOpacity>
        {/* Copy button */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setCopyProduct(item)}
        >
          <Text style={styles.iconBtnText}>📋</Text>
        </TouchableOpacity>
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
  };

  const hasMore = products.length < total;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>{t('products.title')}</Text>
        <AppButton
          title={t('products.new')}
          onPress={() => router.push(projectId ? `/(app)/product-form?project_id=${projectId}` as never : '/(app)/product-form')}
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

      {/* Product Detail Modal */}
      {detailProduct ? (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
        />
      ) : null}

      {/* Copy Product Modal */}
      {copyProduct ? (
        <CopyProductModal
          product={copyProduct}
          projects={allProjects}
          onClose={() => setCopyProduct(null)}
          onSuccess={() => void fetchProducts(1, true)}
        />
      ) : null}
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardImage: { width: 56, height: 56, borderRadius: radius.md, flexShrink: 0 },
  cardImagePlaceholder: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardName: { fontSize: fontSize.md, fontWeight: '600', color: colors.gray900, marginBottom: 4 },
  typeBadge: { backgroundColor: colors.gray100, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  typeBadgeText: { fontSize: fontSize.xs, color: colors.gray600 },
  cardSub: { fontSize: fontSize.sm, color: colors.gray500 },
  copiedBadge: { fontSize: fontSize.xs, color: colors.primary, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, alignItems: 'center' },
  actionBtn: { flex: 1, paddingVertical: 7 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 16 },
  empty: { textAlign: 'center', color: colors.gray400, marginTop: 60 },
});

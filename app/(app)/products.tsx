import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, RefreshControl, Modal, ScrollView,
  ActivityIndicator, Image, StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { ProductsApi, type ProductDto } from '../../api/products.api';
import { ProjectsApi, type ProjectDto } from '../../api/projects.api';
import { colors, spacing, fontSize, radius } from '../../theme';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'https://icematrix.site/api').replace('/api', '');
const toImageUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
};

// ─── Spec Row ──────────────────────────────────────────────────────────────────
function SpecRow({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === '') return null;
  const isBoolean = typeof value === 'boolean';
  return (
    <View style={detailS.row}>
      <Text style={detailS.label}>{label}</Text>
      {isBoolean ? (
        <View style={[detailS.badge, value ? detailS.yes : detailS.no]}>
          <Text style={[detailS.badgeText, { color: value ? colors.success : colors.danger }]}>
            {value ? '✓ Yes' : '✗ No'}
          </Text>
        </View>
      ) : (
        <Text style={detailS.value}>{String(value)}</Text>
      )}
    </View>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function ProductDetailModal({ product, onClose }: { product: ProductDto; onClose: () => void }) {
  const { t } = useTranslation();
  const images = product.images ?? [];
  const [imgIndex, setImgIndex] = useState(0);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar barStyle="light-content" />
        <View style={detailS.header}>
          <TouchableOpacity onPress={onClose} style={detailS.closeBtn}>
            <Text style={detailS.closeBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={detailS.title} numberOfLines={2}>{product.product_name}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} showsVerticalScrollIndicator={false}>
          {/* Image slider */}
          {images.length > 0 && (
            <View>
              <Image
                source={{ uri: toImageUrl(images[imgIndex]?.image_path) ?? '' }}
                style={detailS.mainImage}
                resizeMode="cover"
              />
              {images.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.sm }}>
                  {images.map((img, i) => (
                    <TouchableOpacity key={img.id} onPress={() => setImgIndex(i)}>
                      <Image
                        source={{ uri: toImageUrl(img.image_path) ?? '' }}
                        style={[detailS.thumb, i === imgIndex && detailS.thumbActive]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Capacity hero */}
          <View style={detailS.heroCard}>
            <Text style={detailS.heroLabel}>CAPACITY</Text>
            <Text style={detailS.heroValue}>{product.capacity?.toLocaleString()}</Text>
            <Text style={detailS.heroUnit}>pcs / hr</Text>
          </View>

          <View style={detailS.section}>
            <Text style={detailS.sectionTitle}>{t('products.steps.machine')}</Text>
            <SpecRow label={t('products.fields.machineType')} value={product.machine_type_name} />
            <SpecRow label={t('products.fields.machine')} value={product.machine_name} />
            <SpecRow label="Project" value={product.project_name} />
          </View>

          <View style={detailS.section}>
            <Text style={detailS.sectionTitle}>{t('products.steps.info')}</Text>
            <SpecRow label={t('products.fields.productType')} value={product.product_type} />
            <SpecRow label={t('products.fields.toBeCommissioned')} value={product.to_be_commissioned} />
          </View>

          <View style={detailS.section}>
            <Text style={detailS.sectionTitle}>{t('products.steps.flavor')}</Text>
            <SpecRow label={t('products.fields.noOfFlavor')} value={product.no_of_flavor} />
            <SpecRow label={t('products.fields.totalVolume')} value={product.total_volume} />
            <SpecRow label={t('products.fields.inclusionInIceCream')} value={product.inclusion_in_ice_cream} />
            <SpecRow label={t('products.fields.rippleSauce')} value={product.ripple_sauce} />
            <SpecRow label={t('products.fields.noOfRippleSauce')} value={product.no_of_ripple_sauce} />
          </View>

          <View style={detailS.section}>
            <Text style={detailS.sectionTitle}>{t('products.steps.filling')}</Text>
            <SpecRow label={t('products.fields.fillingPattern')} value={product.filling_pattern} />
            <SpecRow label={t('products.fields.liquidSauceTopping')} value={product.liquid_sauce_topping} />
            <SpecRow label="Liquid Sauce Type" value={product.liquid_sauce_topping_type} />
            <SpecRow label={t('products.fields.dryTopping')} value={product.dry_topping} />
            <SpecRow label="Dry Topping Type & Size" value={product.dry_topping_type_size} />
          </View>

          <View style={detailS.section}>
            <Text style={detailS.sectionTitle}>{t('products.steps.chocolate')}</Text>
            <SpecRow label={t('products.fields.chocolateCoating')} value={product.chocolate_coating} />
            <SpecRow label={t('products.fields.chocolateCoatingType')} value={product.chocolate_coating_type} />
            <SpecRow label={t('products.fields.coatingSequence')} value={product.coating_sequence} />
            <SpecRow label={t('products.fields.dryStuffInChocolate')} value={product.dry_stuff_in_chocolate} />
            <SpecRow label="Dry Stuff Type" value={product.dry_stuff_type} />
          </View>

          <View style={detailS.section}>
            <Text style={detailS.sectionTitle}>{t('products.steps.dimensions')}</Text>
            <SpecRow label={t('products.fields.lengthL1')} value={product.product_length_l1 ? `${product.product_length_l1} mm` : null} />
            <SpecRow label={t('products.fields.lengthL2')} value={product.product_length_l2 ? `${product.product_length_l2} mm` : null} />
            <SpecRow label={t('products.fields.widthW')} value={product.product_width_w ? `${product.product_width_w} mm` : null} />
            <SpecRow label={t('products.fields.thicknessH')} value={product.product_thickness_h ? `${product.product_thickness_h} mm` : null} />
            <SpecRow label={t('products.fields.diameter')} value={product.product_diameter ? `${product.product_diameter} mm` : null} />
            <SpecRow label="Cone Degree" value={product.cone_degree} />
          </View>

          {(product.stick_type || product.stick_length) && (
            <View style={detailS.section}>
              <Text style={detailS.sectionTitle}>{t('products.steps.stick')}</Text>
              <SpecRow label={t('products.fields.stickType')} value={product.stick_type} />
              <SpecRow label={t('products.fields.stickLength')} value={product.stick_length ? `${product.stick_length} mm` : null} />
              <SpecRow label={t('products.fields.stickWidth')} value={product.stick_width ? `${product.stick_width} mm` : null} />
            </View>
          )}

          <View style={[detailS.section, { marginBottom: 40 }]}>
            <Text style={detailS.sectionTitle}>{t('products.steps.eol')}</Text>
            <SpecRow label={t('products.fields.isEolInc')} value={product.is_eol_inc} />
            <SpecRow label={t('products.fields.howManyPackPattern')} value={product.how_many_pack_pattern} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const detailS = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: fontSize.lg, color: colors.accent, fontWeight: '700' },
  title: { flex: 1, fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  mainImage: { width: '100%', height: 220, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  thumb: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, opacity: 0.6 },
  thumbActive: { borderColor: colors.accent, opacity: 1 },
  heroCard: {
    backgroundColor: colors.surface2, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', borderWidth: 1, borderColor: colors.borderAccent,
  },
  heroLabel: { fontSize: fontSize.xs, color: colors.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  heroValue: { fontSize: 40, fontWeight: '800', color: colors.accent, marginVertical: 4 },
  heroUnit: { fontSize: fontSize.sm, color: colors.subtext },
  section: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    gap: 2, borderWidth: 1, borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.accent,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontSize: fontSize.sm, color: colors.subtext, flex: 1 },
  value: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500', textAlign: 'right', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1 },
  yes: { backgroundColor: colors.successSoft, borderColor: colors.success + '40' },
  no: { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '40' },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },
});

// ─── Copy Modal ────────────────────────────────────────────────────────────────
function CopyProductModal({ product, projects, onClose, onSuccess }: {
  product: ProductDto; projects: ProjectDto[];
  onClose: () => void; onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    if (!selectedId) { Alert.alert(t('common.error'), t('products.selectProject')); return; }
    setCopying(true);
    try {
      await ProductsApi.copy(product.id, selectedId);
      Toast.show({ type: 'success', text1: t('products.toastCopied') });
      onSuccess(); onClose();
    } catch {
      Toast.show({ type: 'error', text1: t('common.error') });
    } finally { setCopying(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={copyS.overlay}>
        <View style={copyS.sheet}>
          <Text style={copyS.title}>{t('products.copyTo')}</Text>
          <Text style={copyS.subtitle}>{product.product_name}</Text>
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {projects.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[copyS.item, selectedId === p.id && copyS.itemSelected]}
                onPress={() => setSelectedId(p.id)}
              >
                <Text style={[copyS.itemName, selectedId === p.id && { color: colors.accent }]}>{p.project_name}</Text>
                {p.customer_name ? <Text style={copyS.itemSub}>{p.customer_name}</Text> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={copyS.actions}>
            <TouchableOpacity style={copyS.cancelBtn} onPress={onClose}>
              <Text style={copyS.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={copyS.confirmBtn} onPress={handleCopy} disabled={copying}>
              {copying ? <ActivityIndicator color={colors.text} size="small" /> : <Text style={copyS.confirmText}>{t('products.copy')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const copyS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface2, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderColor: colors.border },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.subtext },
  item: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, gap: 2 },
  itemSelected: { borderColor: colors.borderAccent, backgroundColor: colors.accentSoft },
  itemName: { fontSize: fontSize.base, color: colors.text, fontWeight: '600' },
  itemSub: { fontSize: fontSize.sm, color: colors.subtext },
  actions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { color: colors.subtext, fontWeight: '600' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.accentDark, alignItems: 'center' },
  confirmText: { color: colors.text, fontWeight: '700' },
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
  const [detailProduct, setDetailProduct] = useState<ProductDto | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [copyProduct, setCopyProduct] = useState<ProductDto | null>(null);
  const [allProjects, setAllProjects] = useState<ProjectDto[]>([]);

  const projectId = params.project_id ? Number(params.project_id) : undefined;

  const fetchProducts = useCallback(async (p = 1, reset = false) => {
    try {
      const result = await ProductsApi.list({ project_id: projectId, search: search || undefined, page: p, limit: 20 });
      setProducts(prev => reset ? result.data : [...prev, ...result.data]);
      setTotal(result.meta.total);
      setPage(p);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [projectId, search]);

  // Refresh every time screen comes into focus (handles navigate-back after add/edit)
  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    void fetchProducts(1, true);
  }, [fetchProducts]));

  // Load all projects for copy modal
  useFocusEffect(useCallback(() => {
    void ProjectsApi.list().then(setAllProjects).catch(() => {});
  }, []));

  const handleDelete = (item: ProductDto) => {
    Alert.alert(t('products.confirmDelete'), item.product_name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          try {
            await ProductsApi.delete(item.id);
            setProducts(prev => prev.filter(p => p.id !== item.id));
            setTotal(prev => prev - 1);
            Toast.show({ type: 'success', text1: t('products.toastDeleted') });
          } catch {
            Toast.show({ type: 'error', text1: t('common.error') });
          }
        },
      },
    ]);
  };

  const handleOpenDetail = async (item: ProductDto) => {
    setLoadingDetailId(item.id);
    try {
      const full = await ProductsApi.getById(item.id);
      setDetailProduct(full);
    } catch {
      Toast.show({ type: 'error', text1: t('common.error') });
    } finally { setLoadingDetailId(null); }
  };

  const renderItem = ({ item }: { item: ProductDto }) => {
    // Images come from list API with image_path field
    const primaryImg = item.images?.find(i => i.is_primary) ?? item.images?.[0];
    const imgUrl = toImageUrl(primaryImg?.image_path);

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Text style={{ fontSize: 24 }}>📦</Text>
            </View>
          )}

          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{item.product_name}</Text>
            <View style={styles.badges}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{item.product_type.replace(/_/g, ' ')}</Text>
              </View>
              {item.copied_from_project_name && (
                <View style={styles.copiedBadge}>
                  <Text style={styles.copiedBadgeText}>copy</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSub} numberOfLines={1}>{item.machine_type_name} · {item.machine_name}</Text>
            <Text style={styles.cardCapacity}>
              {item.capacity?.toLocaleString()} <Text style={styles.cardCapacityUnit}>pcs/hr</Text>
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => handleOpenDetail(item)}
            disabled={loadingDetailId === item.id}
          >
            {loadingDetailId === item.id
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <Text style={styles.actionIconText}>👁</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => setCopyProduct(item)}>
            <Text style={styles.actionIconText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => router.push(`/(app)/product-form?id=${item.id}` as never)}
          >
            <Text style={styles.editBtnText}>{t('common.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.pageTitle}>{t('products.title')}</Text>
          <Text style={styles.pageSubtitle}>{total} {t('common.total') ?? 'total'}</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push(
            projectId
              ? `/(app)/product-form?project_id=${projectId}` as never
              : '/(app)/product-form' as never
          )}
        >
          <Text style={styles.newBtnText}>+ {t('products.new')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('products.search')}
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={s => setSearch(s)}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: colors.muted, fontSize: 18 }}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            onRefresh={() => { setRefreshing(true); void fetchProducts(1, true); }}
          />
        }
        ListEmptyComponent={
          isLoading
            ? <ActivityIndicator color={colors.accent} style={{ marginTop: 60 }} />
            : (
              <View style={styles.empty}>
                <Text style={{ fontSize: 44, marginBottom: spacing.md }}>📦</Text>
                <Text style={styles.emptyText}>{t('common.noData')}</Text>
              </View>
            )
        }
        onEndReached={() => { if (products.length < total && !isLoading) void fetchProducts(page + 1); }}
        onEndReachedThreshold={0.3}
      />

      {detailProduct && (
        <ProductDetailModal product={detailProduct} onClose={() => setDetailProduct(null)} />
      )}
      {copyProduct && (
        <CopyProductModal
          product={copyProduct}
          projects={allProjects}
          onClose={() => setCopyProduct(null)}
          onSuccess={() => { void fetchProducts(1, true); }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  pageTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  pageSubtitle: { fontSize: fontSize.sm, color: colors.muted, marginTop: 2 },
  newBtn: { backgroundColor: colors.accentDark, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.md },
  newBtnText: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.surface2, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: colors.text, fontSize: fontSize.base },
  list: { padding: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cardRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.md },
  thumb: { width: 80, height: 80, borderRadius: radius.md, flexShrink: 0 },
  thumbPlaceholder: {
    width: 80, height: 80, borderRadius: radius.md,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardInfo: { flex: 1, gap: 4, justifyContent: 'center' },
  cardName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  typeBadge: {
    backgroundColor: colors.accentSoft, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: colors.borderAccent,
  },
  typeBadgeText: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '600' },
  copiedBadge: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  copiedBadgeText: { fontSize: fontSize.xs, color: colors.warning, fontWeight: '600' },
  cardSub: { fontSize: fontSize.sm, color: colors.subtext },
  cardCapacity: { fontSize: fontSize.md, fontWeight: '700', color: colors.accent },
  cardCapacityUnit: { fontSize: fontSize.xs, color: colors.muted, fontWeight: '400' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  actionIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  actionIconText: { fontSize: 16 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.md, alignItems: 'center', borderWidth: 1 },
  editBtn: { backgroundColor: colors.surface2, borderColor: colors.border },
  editBtnText: { color: colors.subtext, fontSize: fontSize.sm, fontWeight: '600' },
  deleteBtn: { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '40' },
  deleteBtnText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.muted, fontSize: fontSize.base },
});

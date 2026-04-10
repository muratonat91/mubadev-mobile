import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Switch,
  Image, ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { ProductsApi, type ProductPayload, type ProductImageDto } from '../../api/products.api';
import { ProjectsApi, type ProjectDto } from '../../api/projects.api';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { AppPicker } from '../../components/ui/AppPicker';
import { colors, spacing, fontSize, radius } from '../../theme';
import {
  MACHINE_MAP, MACHINE_TYPES, PRODUCT_TYPE_MAP,
  STICK_PRODUCT_TYPES, CONE_PRODUCT_TYPES,
  COATING_SEQUENCE_MAP, CHOCOLATE_COATING_TYPES, STICK_TYPES, CONE_DEGREES,
} from '../../constants/productConstants';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'https://icematrix.site/api').replace('/api', '');
const toImageUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
};

// Static ID maps (must match DB seed order)
const MACHINE_TYPE_IDS: Record<string, number> = { 'Extrusion': 1, 'Filler': 2, 'Mould': 3 };
const MACHINE_IDS: Record<string, number> = {
  'BT': 1, 'BT-C': 2,
  'GMF-C': 3, 'Flexline': 4, 'RUF': 5, 'RUF-C': 6,
  'RIA4': 7, 'RIA10-C': 8, 'RIA14': 9,
};

// ─── Step titles ──────────────────────────────────────────────────────────────
const STEP_KEYS = ['machine', 'info', 'flavor', 'filling', 'chocolate', 'dimensions', 'stick', 'eol', 'images'] as const;
type StepKey = (typeof STEP_KEYS)[number];

interface LocalImage {
  uri: string;
  isPrimary: boolean;
  existingId?: number;
}

type FormState = {
  project_id: string;
  machine_type: string;
  machine: string;
  product_type: string;
  product_name: string;
  capacity: string;
  to_be_commissioned: boolean;
  no_of_flavor: string;
  total_volume: string;
  inclusion_in_ice_cream: boolean;
  ripple_sauce: boolean;
  no_of_ripple_sauce: string;
  filling_pattern: string;
  liquid_sauce_topping: boolean;
  liquid_sauce_topping_type: string;
  dry_topping: boolean;
  dry_topping_type_size: string;
  chocolate_coating: boolean;
  chocolate_coating_type: string;
  coating_sequence: string;
  dry_stuff_in_chocolate: boolean;
  dry_stuff_type: string;
  product_length_l1: string;
  product_length_l2: string;
  product_width_w: string;
  product_thickness_h: string;
  product_diameter: string;
  cone_degree: string;
  stick_type: string;
  stick_length: string;
  stick_width: string;
  is_eol_inc: boolean;
  how_many_pack_pattern: string;
};

const DEFAULTS: FormState = {
  project_id: '', machine_type: '', machine: '', product_type: '', product_name: '',
  capacity: '', to_be_commissioned: false, no_of_flavor: '1', total_volume: '',
  inclusion_in_ice_cream: false, ripple_sauce: false, no_of_ripple_sauce: '0',
  filling_pattern: '', liquid_sauce_topping: false, liquid_sauce_topping_type: '',
  dry_topping: false, dry_topping_type_size: '', chocolate_coating: false,
  chocolate_coating_type: '', coating_sequence: '', dry_stuff_in_chocolate: false,
  dry_stuff_type: '', product_length_l1: '', product_length_l2: '', product_width_w: '',
  product_thickness_h: '', product_diameter: '', cone_degree: '', stick_type: '',
  stick_length: '', stick_width: '', is_eol_inc: false, how_many_pack_pattern: '1',
};

export default function ProductFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; project_id?: string }>();

  const isEdit = !!params.id;
  const [form, setForm] = useState<FormState>({ ...DEFAULTS, project_id: params.project_id ?? '' });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // Derived
  const machines = form.machine_type ? (MACHINE_MAP[form.machine_type] ?? []) : [];
  const productTypes = form.machine ? (PRODUCT_TYPE_MAP[form.machine] ?? []) : [];
  const isStick = STICK_PRODUCT_TYPES.includes(form.product_type);

  const steps: StepKey[] = isStick
    ? ['machine', 'info', 'flavor', 'filling', 'chocolate', 'dimensions', 'stick', 'eol', 'images']
    : ['machine', 'info', 'flavor', 'filling', 'chocolate', 'dimensions', 'eol', 'images'];

  useEffect(() => { void ProjectsApi.list().then(setProjects); }, []);

  // Reset form when creating new product
  useEffect(() => {
    if (!isEdit) {
      setForm({ ...DEFAULTS, project_id: params.project_id ?? '' });
      setImages([]);
      setStep(0);
    }
  }, [isEdit, params.project_id]);

  // Load existing product when editing
  useEffect(() => {
    if (!isEdit) return;
    void ProductsApi.getById(Number(params.id)).then(p => {
      const r = p as Record<string, unknown>;
      setForm({
        project_id: String(r.project_id ?? ''),
        machine_type: String(r.machine_type_name ?? ''),
        machine: String(r.machine_name ?? ''),
        product_type: String(r.product_type ?? ''),
        product_name: String(r.product_name ?? ''),
        capacity: String(r.capacity ?? ''),
        to_be_commissioned: Boolean(r.to_be_commissioned),
        no_of_flavor: String(r.no_of_flavor ?? '1'),
        total_volume: r.total_volume != null ? String(r.total_volume) : '',
        inclusion_in_ice_cream: Boolean(r.inclusion_in_ice_cream),
        ripple_sauce: Boolean(r.ripple_sauce),
        no_of_ripple_sauce: String(r.no_of_ripple_sauce ?? '0'),
        filling_pattern: String(r.filling_pattern ?? ''),
        liquid_sauce_topping: Boolean(r.liquid_sauce_topping),
        liquid_sauce_topping_type: String(r.liquid_sauce_topping_type ?? ''),
        dry_topping: Boolean(r.dry_topping),
        dry_topping_type_size: String(r.dry_topping_type_size ?? ''),
        chocolate_coating: Boolean(r.chocolate_coating),
        chocolate_coating_type: String(r.chocolate_coating_type ?? ''),
        coating_sequence: String(r.coating_sequence ?? ''),
        dry_stuff_in_chocolate: Boolean(r.dry_stuff_in_chocolate),
        dry_stuff_type: String(r.dry_stuff_type ?? ''),
        product_length_l1: r.product_length_l1 != null ? String(r.product_length_l1) : '',
        product_length_l2: r.product_length_l2 != null ? String(r.product_length_l2) : '',
        product_width_w: r.product_width_w != null ? String(r.product_width_w) : '',
        product_thickness_h: r.product_thickness_h != null ? String(r.product_thickness_h) : '',
        product_diameter: r.product_diameter != null ? String(r.product_diameter) : '',
        cone_degree: String(r.cone_degree ?? ''),
        stick_type: String(r.stick_type ?? ''),
        stick_length: r.stick_length != null ? String(r.stick_length) : '',
        stick_width: r.stick_width != null ? String(r.stick_width) : '',
        is_eol_inc: Boolean(r.is_eol_inc),
        how_many_pack_pattern: String(r.how_many_pack_pattern ?? '1'),
      });
      const existingImages = (r.images as ProductImageDto[] | undefined) ?? [];
      setImages(existingImages.map(img => ({
        uri: toImageUrl(img.image_path) ?? '',
        isPrimary: img.is_primary,
        existingId: img.id,
      })));
    });
  }, [isEdit, params.id]);

  const set = (key: keyof FormState, val: unknown) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newImgs: LocalImage[] = result.assets.map(asset => ({ uri: asset.uri, isPrimary: false }));
      setImages(prev => {
        const combined = [...prev, ...newImgs];
        if (!combined.some(img => img.isPrimary) && combined.length > 0) {
          combined[0].isPrimary = true;
        }
        return combined;
      });
    }
  };

  const setPrimary = (index: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const removeImage = async (index: number) => {
    const img = images[index];
    if (img.existingId && isEdit) {
      setDeletingImageId(img.existingId);
      try {
        await ProductsApi.deleteImage(Number(params.id), img.existingId);
        setImages(prev => prev.filter((_, i) => i !== index));
        Toast.show({ type: 'success', text1: t('products.imageDeleted') });
      } catch {
        Toast.show({ type: 'error', text1: t('common.error') });
      } finally {
        setDeletingImageId(null);
      }
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!form.project_id || !form.machine_type || !form.machine || !form.product_type || !form.product_name) {
      Alert.alert(t('common.error'), 'Please fill all required fields (Project, Machine Type, Machine, Product Type, Product Name)');
      setStep(0);
      return;
    }

    const machineTypeId = MACHINE_TYPE_IDS[form.machine_type];
    const machineId = MACHINE_IDS[form.machine];

    if (!machineTypeId || !machineId) {
      Alert.alert(t('common.error'), `Unknown machine: ${form.machine_type} / ${form.machine}`);
      return;
    }

    const payload: ProductPayload = {
      project_id: Number(form.project_id),
      machine_type_id: machineTypeId,
      machine_id: machineId,
      product_type: form.product_type,
      product_name: form.product_name,
      capacity: Number(form.capacity) || 0,
      to_be_commissioned: form.to_be_commissioned,
      no_of_flavor: Number(form.no_of_flavor) || 1,
      total_volume: form.total_volume ? Number(form.total_volume) : null,
      inclusion_in_ice_cream: form.inclusion_in_ice_cream,
      ripple_sauce: form.ripple_sauce,
      no_of_ripple_sauce: Number(form.no_of_ripple_sauce) || 0,
      filling_pattern: form.filling_pattern || null,
      liquid_sauce_topping: form.liquid_sauce_topping,
      liquid_sauce_topping_type: form.liquid_sauce_topping_type || null,
      dry_topping: form.dry_topping,
      dry_topping_type_size: form.dry_topping_type_size || null,
      chocolate_coating: form.chocolate_coating,
      chocolate_coating_type: form.chocolate_coating_type || null,
      coating_sequence: form.coating_sequence || null,
      dry_stuff_in_chocolate: form.dry_stuff_in_chocolate,
      dry_stuff_type: form.dry_stuff_type || null,
      product_length_l1: form.product_length_l1 ? Number(form.product_length_l1) : null,
      product_length_l2: form.product_length_l2 ? Number(form.product_length_l2) : null,
      product_width_w: form.product_width_w ? Number(form.product_width_w) : null,
      product_thickness_h: form.product_thickness_h ? Number(form.product_thickness_h) : null,
      product_diameter: form.product_diameter ? Number(form.product_diameter) : null,
      cone_degree: form.cone_degree || null,
      stick_type: form.stick_type || null,
      stick_length: form.stick_length ? Number(form.stick_length) : null,
      stick_width: form.stick_width ? Number(form.stick_width) : null,
      is_eol_inc: form.is_eol_inc,
      how_many_pack_pattern: Number(form.how_many_pack_pattern) || 1,
    };

    setSaving(true);
    try {
      let productId: number;
      if (isEdit) {
        await ProductsApi.update(Number(params.id), payload);
        productId = Number(params.id);
        Toast.show({ type: 'success', text1: t('products.toastUpdated') });
      } else {
        const created = await ProductsApi.create(payload);
        productId = created.id;
        Toast.show({ type: 'success', text1: t('products.toastCreated') });
      }

      // Upload new images
      const newImages = images.filter(img => !img.existingId);
      if (newImages.length > 0) {
        setUploadingImages(true);
        for (const img of newImages) {
          try {
            await ProductsApi.uploadImage(productId, img.uri, img.isPrimary);
          } catch {
            // continue uploading others
          }
        }
        setUploadingImages(false);
      }

      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      Toast.show({ type: 'error', text1: t('common.error'), text2: msg });
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrap}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? t('common.edit') : t('products.new')}
        </Text>
        <Text style={styles.stepCount}>{step + 1}/{steps.length}</Text>
      </View>

      {/* Step dots */}
      <View style={styles.stepDots}>
        {steps.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setStep(i)}>
            <View style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Step label */}
      <Text style={styles.stepLabel}>{t(`products.steps.${currentStep}`)}</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* STEP: machine */}
        {currentStep === 'machine' && (
          <View style={styles.fields}>
            <AppPicker
              label="Project *"
              value={form.project_id}
              options={projects.map(p => ({ label: `${p.project_name}${p.customer_name ? ` — ${p.customer_name}` : ''}`, value: String(p.id) }))}
              onChange={v => set('project_id', v)}
            />
            <AppPicker
              label="Machine Type *"
              value={form.machine_type}
              options={MACHINE_TYPES.map(m => ({ label: m, value: m }))}
              onChange={v => { set('machine_type', v); set('machine', ''); set('product_type', ''); }}
            />
            {form.machine_type ? (
              <AppPicker
                label="Machine *"
                value={form.machine}
                options={machines.map(m => ({ label: m, value: m }))}
                onChange={v => { set('machine', v); set('product_type', ''); }}
              />
            ) : null}
            {form.machine ? (
              <AppPicker
                label="Product Type *"
                value={form.product_type}
                options={productTypes.map(pt => ({ label: pt, value: pt }))}
                onChange={v => set('product_type', v)}
              />
            ) : null}
          </View>
        )}

        {/* STEP: info */}
        {currentStep === 'info' && (
          <View style={styles.fields}>
            <AppInput label="Product Name *" value={form.product_name} onChangeText={v => set('product_name', v)} placeholder="e.g. Classic Vanilla Stick" />
            <AppInput label="Capacity (pcs/hr)" value={form.capacity} onChangeText={v => set('capacity', v)} keyboardType="numeric" />
            <SwitchRow label="To Be Commissioned" value={form.to_be_commissioned} onChange={v => set('to_be_commissioned', v)} />
          </View>
        )}

        {/* STEP: flavor */}
        {currentStep === 'flavor' && (
          <View style={styles.fields}>
            <AppInput label="No. of Flavors" value={form.no_of_flavor} onChangeText={v => set('no_of_flavor', v)} keyboardType="numeric" />
            <AppInput label="Total Volume (ml)" value={form.total_volume} onChangeText={v => set('total_volume', v)} keyboardType="numeric" />
            <SwitchRow label="Inclusion in Ice Cream" value={form.inclusion_in_ice_cream} onChange={v => set('inclusion_in_ice_cream', v)} />
            <SwitchRow label="Ripple Sauce" value={form.ripple_sauce} onChange={v => set('ripple_sauce', v)} />
            {form.ripple_sauce && (
              <AppInput label="No. of Ripple Sauces" value={form.no_of_ripple_sauce} onChangeText={v => set('no_of_ripple_sauce', v)} keyboardType="numeric" />
            )}
          </View>
        )}

        {/* STEP: filling */}
        {currentStep === 'filling' && (
          <View style={styles.fields}>
            <AppInput label="Filling Pattern" value={form.filling_pattern} onChangeText={v => set('filling_pattern', v)} />
            <SwitchRow label="Liquid Sauce Topping" value={form.liquid_sauce_topping} onChange={v => set('liquid_sauce_topping', v)} />
            {form.liquid_sauce_topping && (
              <AppInput label="Liquid Sauce Type" value={form.liquid_sauce_topping_type} onChangeText={v => set('liquid_sauce_topping_type', v)} multiline numberOfLines={3} />
            )}
            <SwitchRow label="Dry Topping" value={form.dry_topping} onChange={v => set('dry_topping', v)} />
            {form.dry_topping && (
              <AppInput label="Dry Topping Type & Size" value={form.dry_topping_type_size} onChangeText={v => set('dry_topping_type_size', v)} multiline numberOfLines={3} />
            )}
          </View>
        )}

        {/* STEP: chocolate */}
        {currentStep === 'chocolate' && (
          <View style={styles.fields}>
            <SwitchRow
              label="Chocolate Coating"
              value={form.chocolate_coating}
              onChange={v => { set('chocolate_coating', v); if (!v) { set('chocolate_coating_type', ''); set('coating_sequence', ''); } }}
            />
            {form.chocolate_coating && (
              <>
                <AppPicker
                  label="Coating Type"
                  value={form.chocolate_coating_type}
                  options={CHOCOLATE_COATING_TYPES}
                  onChange={v => {
                    set('chocolate_coating_type', v);
                    if (String(v) !== 'other') set('coating_sequence', COATING_SEQUENCE_MAP[String(v)] ?? '');
                  }}
                />
                <AppInput label="Coating Sequence" value={form.coating_sequence} onChangeText={v => set('coating_sequence', v)} />
              </>
            )}
            <SwitchRow label="Dry Stuff in Chocolate" value={form.dry_stuff_in_chocolate} onChange={v => set('dry_stuff_in_chocolate', v)} />
            {form.dry_stuff_in_chocolate && (
              <AppInput label="Dry Stuff Type" value={form.dry_stuff_type} onChangeText={v => set('dry_stuff_type', v)} />
            )}
          </View>
        )}

        {/* STEP: dimensions */}
        {currentStep === 'dimensions' && (
          <View style={styles.fields}>
            <AppInput label="Length L2 (mm)" value={form.product_length_l2} onChangeText={v => set('product_length_l2', v)} keyboardType="numeric" />
            <AppInput label="Length L1 (mm)" value={form.product_length_l1} onChangeText={v => set('product_length_l1', v)} keyboardType="numeric" />
            <AppInput label="Width W (mm)" value={form.product_width_w} onChangeText={v => set('product_width_w', v)} keyboardType="numeric" />
            <AppInput label="Thickness H (mm)" value={form.product_thickness_h} onChangeText={v => set('product_thickness_h', v)} keyboardType="numeric" />
            <AppInput label="Diameter (mm)" value={form.product_diameter} onChangeText={v => set('product_diameter', v)} keyboardType="numeric" />
            {CONE_PRODUCT_TYPES.includes(form.product_type) && (
              <AppPicker label="Cone Degree" value={form.cone_degree} options={CONE_DEGREES} onChange={v => set('cone_degree', v)} />
            )}
          </View>
        )}

        {/* STEP: stick */}
        {currentStep === 'stick' && (
          <View style={styles.fields}>
            <AppPicker label="Stick Type" value={form.stick_type} options={STICK_TYPES} onChange={v => set('stick_type', v)} />
            <AppInput label="Stick Length (mm)" value={form.stick_length} onChangeText={v => set('stick_length', v)} keyboardType="numeric" />
            <AppInput label="Stick Width (mm)" value={form.stick_width} onChangeText={v => set('stick_width', v)} keyboardType="numeric" />
          </View>
        )}

        {/* STEP: eol */}
        {currentStep === 'eol' && (
          <View style={styles.fields}>
            <SwitchRow label="EOL Included" value={form.is_eol_inc} onChange={v => set('is_eol_inc', v)} />
            <AppInput label="Pack Patterns" value={form.how_many_pack_pattern} onChangeText={v => set('how_many_pack_pattern', v)} keyboardType="numeric" />
          </View>
        )}

        {/* STEP: images */}
        {currentStep === 'images' && (
          <View style={styles.fields}>
            <Text style={styles.imageHint}>Tap on an image to set it as the primary (cover) image. Tap × to remove.</Text>

            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScroll}>
                {images.map((img, index) => (
                  <View key={img.existingId ?? img.uri} style={styles.imageThumbnailContainer}>
                    <TouchableOpacity onPress={() => setPrimary(index)} activeOpacity={0.8}>
                      <Image
                        source={{ uri: img.uri }}
                        style={[styles.imageThumbnail, img.isPrimary && styles.imageThumbnailPrimary]}
                      />
                      {img.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => removeImage(index)}
                      disabled={deletingImageId === img.existingId}
                    >
                      {deletingImageId === img.existingId
                        ? <ActivityIndicator size="small" color={colors.white} />
                        : <Text style={styles.removeImageBtnText}>✕</Text>}
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <AppButton title="+ Add Images" onPress={pickImages} variant="secondary" />

            {uploadingImages && (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.uploadingText}>Uploading images...</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Navigation bar */}
      <View style={styles.navBar}>
        {step > 0 && (
          <AppButton title={t('common.back')} onPress={() => setStep(s => s - 1)} variant="secondary" style={styles.navBtn} />
        )}
        {isLast ? (
          <AppButton
            title={saving ? 'Saving...' : t('common.save')}
            onPress={handleSave}
            loading={saving || uploadingImages}
            style={[styles.navBtn, { flex: 1 }]}
          />
        ) : (
          <AppButton title={t('common.next')} onPress={() => setStep(s => s + 1)} style={[styles.navBtn, { flex: 1 }]} />
        )}
      </View>
    </SafeAreaView>
  );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={colors.white}
        trackColor={{ false: colors.surface2, true: colors.accentDark }}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: colors.surface2, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  label: { fontSize: fontSize.base, color: colors.text, flex: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtnWrap: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtn: { fontSize: fontSize.lg, color: colors.accent, fontWeight: '700' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  stepCount: { fontSize: fontSize.sm, color: colors.muted },
  stepDots: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingVertical: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  dotActive: { backgroundColor: colors.accent, width: 24, borderColor: colors.accent },
  dotDone: { backgroundColor: colors.accentDark, borderColor: colors.accentDark },
  stepLabel: {
    textAlign: 'center', fontSize: fontSize.sm, fontWeight: '700',
    color: colors.accent, marginBottom: spacing.md,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  fields: { gap: spacing.md },
  navBar: {
    flexDirection: 'row', gap: spacing.md, padding: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  navBtn: { minWidth: 100 },
  imageHint: { fontSize: fontSize.sm, color: colors.subtext, lineHeight: 20 },
  imageScroll: { gap: spacing.sm, paddingVertical: spacing.sm },
  imageThumbnailContainer: { position: 'relative', marginRight: spacing.sm },
  imageThumbnail: { width: 110, height: 110, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border },
  imageThumbnailPrimary: { borderColor: colors.accent },
  primaryBadge: {
    position: 'absolute', bottom: 4, left: 4, right: 4,
    backgroundColor: colors.accentDark, borderRadius: radius.sm,
    paddingVertical: 2, alignItems: 'center',
  },
  primaryBadgeText: { color: colors.text, fontSize: fontSize.xs, fontWeight: '700' },
  removeImageBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
  },
  removeImageBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center' },
  uploadingText: { fontSize: fontSize.sm, color: colors.accent },
});

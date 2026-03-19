import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { ProductsApi, type ProductPayload } from '../../api/products.api';
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

// ─── Step titles ──────────────────────────────────────────────────────────────
const STEP_KEYS = ['machine', 'info', 'flavor', 'filling', 'chocolate', 'dimensions', 'stick', 'eol'] as const;
type StepKey = (typeof STEP_KEYS)[number];

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

  const [form, setForm] = useState<FormState>({ ...DEFAULTS, project_id: params.project_id ?? '' });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const isEdit = !!params.id;

  // Derived
  const machines = form.machine_type ? (MACHINE_MAP[form.machine_type] ?? []) : [];
  const productTypes = form.machine ? (PRODUCT_TYPE_MAP[form.machine] ?? []) : [];
  const isStick = STICK_PRODUCT_TYPES.includes(form.product_type);
  const isCone = CONE_PRODUCT_TYPES.includes(form.product_type);

  const steps: StepKey[] = isStick
    ? ['machine', 'info', 'flavor', 'filling', 'chocolate', 'dimensions', 'stick', 'eol']
    : ['machine', 'info', 'flavor', 'filling', 'chocolate', 'dimensions', 'eol'];

  useEffect(() => { void ProjectsApi.list().then(setProjects); }, []);

  useEffect(() => {
    if (isEdit) {
      void ProductsApi.getById(Number(params.id)).then(p => {
        const r = p as Record<string, unknown>;
        setForm(prev => ({
          ...prev,
          project_id: String(r.project_id ?? ''),
          machine_type: String(r.machine_type_name ?? ''),
          machine: String(r.machine_name ?? ''),
          product_type: String(r.product_type ?? ''),
          product_name: String(r.product_name ?? ''),
          capacity: String(r.capacity ?? ''),
          to_be_commissioned: Boolean(r.to_be_commissioned),
          no_of_flavor: String(r.no_of_flavor ?? '1'),
          total_volume: r.total_volume != null ? String(r.total_volume) : '',
          ripple_sauce: Boolean(r.ripple_sauce),
          no_of_ripple_sauce: String(r.no_of_ripple_sauce ?? '0'),
          chocolate_coating: Boolean(r.chocolate_coating),
          chocolate_coating_type: String(r.chocolate_coating_type ?? ''),
          coating_sequence: String(r.coating_sequence ?? ''),
          is_eol_inc: Boolean(r.is_eol_inc),
          how_many_pack_pattern: String(r.how_many_pack_pattern ?? '1'),
        }));
      });
    }
  }, [isEdit, params.id]);

  const set = (key: keyof FormState, val: unknown) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.project_id || !form.machine_type || !form.machine || !form.product_type || !form.product_name) {
      Alert.alert(t('common.error'), 'Please fill all required fields');
      return;
    }

    // Find machine_type_id and machine_id by name — in a real app these IDs come from backend
    // Here we use index-based mapping (same as web seeder order)
    const machineTypeNames = MACHINE_TYPES;
    const machineTypeId = machineTypeNames.indexOf(form.machine_type) + 1;
    const machineId = (MACHINE_MAP[form.machine_type] ?? []).indexOf(form.machine) + 1;

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
      if (isEdit) {
        await ProductsApi.update(Number(params.id), payload);
        Toast.show({ type: 'success', text1: 'Product updated' });
      } else {
        await ProductsApi.create(payload);
        Toast.show({ type: 'success', text1: 'Product created' });
      }
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? t('common.edit') : t('products.new')}
        </Text>
        <Text style={styles.stepCount}>{step + 1}/{steps.length}</Text>
      </View>

      {/* Step dots */}
      <View style={styles.stepDots}>
        {steps.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
        ))}
      </View>

      {/* Step label */}
      <Text style={styles.stepLabel}>{t(`products.steps.${currentStep}`)}</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {currentStep === 'machine' && (
          <View style={styles.fields}>
            <AppPicker
              label="Project *"
              value={form.project_id}
              options={projects.map(p => ({ label: p.project_name, value: String(p.id) }))}
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
          </View>
        )}

        {currentStep === 'info' && (
          <View style={styles.fields}>
            {form.machine ? (
              <AppPicker
                label="Product Type *"
                value={form.product_type}
                options={productTypes.map(t => ({ label: t, value: t }))}
                onChange={v => set('product_type', v)}
              />
            ) : null}
            <AppInput label="Product Name *" value={form.product_name} onChangeText={v => set('product_name', v)} />
            <AppInput label="Capacity" value={form.capacity} onChangeText={v => set('capacity', v)} keyboardType="numeric" />
            <Row label="To Be Commissioned" value={form.to_be_commissioned} onChange={v => set('to_be_commissioned', v)} />
          </View>
        )}

        {currentStep === 'flavor' && (
          <View style={styles.fields}>
            <AppInput label="No. of Flavors" value={form.no_of_flavor} onChangeText={v => set('no_of_flavor', v)} keyboardType="numeric" />
            <AppInput label="Total Volume (ml)" value={form.total_volume} onChangeText={v => set('total_volume', v)} keyboardType="numeric" />
            <Row label="Inclusion in Ice Cream" value={form.inclusion_in_ice_cream} onChange={v => set('inclusion_in_ice_cream', v)} />
            <Row label="Ripple Sauce" value={form.ripple_sauce} onChange={v => set('ripple_sauce', v)} />
            {form.ripple_sauce && (
              <AppInput label="No. of Ripple Sauces" value={form.no_of_ripple_sauce} onChangeText={v => set('no_of_ripple_sauce', v)} keyboardType="numeric" />
            )}
          </View>
        )}

        {currentStep === 'filling' && (
          <View style={styles.fields}>
            <AppInput label="Filling Pattern" value={form.filling_pattern} onChangeText={v => set('filling_pattern', v)} />
            <Row label="Liquid Sauce Topping" value={form.liquid_sauce_topping} onChange={v => set('liquid_sauce_topping', v)} />
            {form.liquid_sauce_topping && (
              <AppInput label="Liquid Sauce Type" value={form.liquid_sauce_topping_type} onChangeText={v => set('liquid_sauce_topping_type', v)} multiline numberOfLines={3} />
            )}
            <Row label="Dry Topping" value={form.dry_topping} onChange={v => set('dry_topping', v)} />
            {form.dry_topping && (
              <AppInput label="Dry Topping Type & Size" value={form.dry_topping_type_size} onChangeText={v => set('dry_topping_type_size', v)} multiline numberOfLines={3} />
            )}
          </View>
        )}

        {currentStep === 'chocolate' && (
          <View style={styles.fields}>
            <Row label="Chocolate Coating" value={form.chocolate_coating} onChange={v => { set('chocolate_coating', v); if (!v) { set('chocolate_coating_type', ''); set('coating_sequence', ''); } }} />
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
            <Row label="Dry Stuff in Chocolate" value={form.dry_stuff_in_chocolate} onChange={v => set('dry_stuff_in_chocolate', v)} />
            {form.dry_stuff_in_chocolate && (
              <AppInput label="Dry Stuff Type" value={form.dry_stuff_type} onChangeText={v => set('dry_stuff_type', v)} />
            )}
          </View>
        )}

        {currentStep === 'dimensions' && (
          <View style={styles.fields}>
            <AppInput label="Length L2 (mm)" value={form.product_length_l2} onChangeText={v => set('product_length_l2', v)} keyboardType="numeric" />
            <AppInput label="Length L1 (mm)" value={form.product_length_l1} onChangeText={v => set('product_length_l1', v)} keyboardType="numeric" />
            <AppInput label="Width W (mm)" value={form.product_width_w} onChangeText={v => set('product_width_w', v)} keyboardType="numeric" />
            <AppInput label="Thickness H (mm)" value={form.product_thickness_h} onChangeText={v => set('product_thickness_h', v)} keyboardType="numeric" />
            <AppInput label="Diameter (mm)" value={form.product_diameter} onChangeText={v => set('product_diameter', v)} keyboardType="numeric" />
            {isCone && (
              <AppPicker label="Cone Degree" value={form.cone_degree} options={CONE_DEGREES} onChange={v => set('cone_degree', v)} />
            )}
          </View>
        )}

        {currentStep === 'stick' && (
          <View style={styles.fields}>
            <AppPicker label="Stick Type" value={form.stick_type} options={STICK_TYPES} onChange={v => set('stick_type', v)} />
            <AppInput label="Stick Length (mm)" value={form.stick_length} onChangeText={v => set('stick_length', v)} keyboardType="numeric" />
            <AppInput label="Stick Width (mm)" value={form.stick_width} onChangeText={v => set('stick_width', v)} keyboardType="numeric" />
          </View>
        )}

        {currentStep === 'eol' && (
          <View style={styles.fields}>
            <Row label="EOL Included" value={form.is_eol_inc} onChange={v => set('is_eol_inc', v)} />
            <AppInput label="Pack Patterns" value={form.how_many_pack_pattern} onChangeText={v => set('how_many_pack_pattern', v)} keyboardType="numeric" />
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navBar}>
        {step > 0 && (
          <AppButton title={t('common.back')} onPress={() => setStep(s => s - 1)} variant="secondary" style={styles.navBtn} />
        )}
        {isLast ? (
          <AppButton title={t('common.save')} onPress={handleSave} loading={saving} style={[styles.navBtn, { flex: 1 }]} />
        ) : (
          <AppButton title={t('common.next')} onPress={() => setStep(s => s + 1)} style={[styles.navBtn, { flex: 1 }]} />
        )}
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} thumbColor={colors.white} trackColor={{ false: colors.gray300, true: colors.primary }} />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  label: { fontSize: fontSize.base, color: colors.gray700, flex: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  backBtn: { fontSize: fontSize.base, color: colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray900 },
  stepCount: { fontSize: fontSize.sm, color: colors.gray500 },
  stepDots: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingBottom: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray300 },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  dotDone: { backgroundColor: colors.primary },
  stepLabel: { textAlign: 'center', fontSize: fontSize.sm, fontWeight: '600', color: colors.primary, marginBottom: spacing.sm },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  fields: { gap: spacing.md },
  navBar: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray200, backgroundColor: colors.white },
  navBtn: { minWidth: 100 },
});

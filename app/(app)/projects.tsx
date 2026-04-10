import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, Alert,
  StyleSheet, TextInput, RefreshControl, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ProjectsApi, type ProjectDto, type ProjectPayload } from '../../api/projects.api';
import { ExportApi } from '../../api/export.api';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { colors, spacing, fontSize, radius } from '../../theme';

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectDto | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCountry, setCustomerCountry] = useState('');
  const [saving, setSaving] = useState(false);

  const [exportingId, setExportingId] = useState<number | null>(null);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setProjects(await ProjectsApi.list());
    } catch {
      // silent
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void fetchProjects();
  }, [fetchProjects]));

  const openCreate = () => {
    setEditing(null);
    setName(''); setDescription(''); setCustomerName(''); setCustomerCountry('');
    setModalOpen(true);
  };

  const openEdit = (p: ProjectDto) => {
    setEditing(p);
    setName(p.project_name);
    setDescription(p.project_description ?? '');
    setCustomerName(p.customer_name ?? '');
    setCustomerCountry(p.customer_country ?? '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert(t('common.error'), 'Project name required'); return; }
    setSaving(true);
    try {
      const payload: ProjectPayload = {
        project_name: name.trim(),
        project_description: description.trim() || undefined,
        customer_name: customerName.trim() || undefined,
        customer_country: customerCountry.trim() || undefined,
      };
      if (editing) {
        const updated = await ProjectsApi.update(editing.id, payload);
        setProjects(prev => prev.map(p => p.id === editing.id ? updated : p));
        Toast.show({ type: 'success', text1: t('projects.toastUpdated') });
      } else {
        const created = await ProjectsApi.create(payload);
        setProjects(prev => [created, ...prev]);
        Toast.show({ type: 'success', text1: t('projects.toastCreated') });
      }
      setModalOpen(false);
    } catch {
      Toast.show({ type: 'error', text1: t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p: ProjectDto) => {
    Alert.alert(t('projects.confirmDelete'), t('projects.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          try {
            await ProjectsApi.delete(p.id);
            setProjects(prev => prev.filter(x => x.id !== p.id));
            Toast.show({ type: 'success', text1: t('projects.toastDeleted') });
          } catch {
            Toast.show({ type: 'error', text1: t('common.error') });
          }
        },
      },
    ]);
  };

  const handleExport = async (project: ProjectDto, type: 'pdf' | 'excel') => {
    setExportingId(project.id);
    setExportType(type);
    try {
      const response = type === 'pdf'
        ? await ExportApi.downloadPdf(project.id)
        : await ExportApi.downloadExcel(project.id);

      const extension = type === 'pdf' ? 'pdf' : 'xlsx';
      const safeName = project.project_name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safeName}.${extension}`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      const data = response.data as ArrayBuffer;
      const base64 = arrayBufferToBase64(data);
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: fileName,
        });
      } else {
        Alert.alert('Exported', `Saved to: ${fileUri}`);
      }
    } catch {
      Toast.show({ type: 'error', text1: t('projects.exportFailed') });
    } finally {
      setExportingId(null);
      setExportType(null);
    }
  };

  const renderItem = ({ item }: { item: ProjectDto }) => {
    const isExporting = exportingId === item.id;
    return (
      <View style={styles.card}>
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.project_name}</Text>
            {item.customer_name ? <Text style={styles.cardCustomer}>{item.customer_name}</Text> : null}
            {item.customer_country ? <Text style={styles.cardCountry}>{item.customer_country}</Text> : null}
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.product_count}</Text>
            <Text style={styles.badgeLabel}> {t('projects.products')}</Text>
          </View>
        </View>

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.viewBtn]}
            onPress={() => router.push(`/(app)/products?project_id=${item.id}` as never)}
          >
            <Text style={styles.viewBtnText}>👁 {t('nav.products')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.addBtn]}
            onPress={() => router.push(`/(app)/product-form?project_id=${item.id}` as never)}
          >
            <Text style={styles.addBtnText}>+ {t('products.new')}</Text>
          </TouchableOpacity>
        </View>

        {/* Edit / Delete */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => openEdit(item)}>
            <Text style={styles.editBtnText}>✏️ {t('common.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteBtnText}>🗑 {t('common.delete')}</Text>
          </TouchableOpacity>
        </View>

        {/* Export */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.pdfBtn]}
            onPress={() => handleExport(item, 'pdf')}
            disabled={isExporting}
          >
            {isExporting && exportType === 'pdf'
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={styles.exportBtnText}>📄 PDF</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.excelBtn]}
            onPress={() => handleExport(item, 'excel')}
            disabled={isExporting}
          >
            {isExporting && exportType === 'excel'
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={styles.exportBtnText}>📊 Excel</Text>}
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
          <Text style={styles.pageTitle}>{t('projects.title')}</Text>
          <Text style={styles.pageSubtitle}>{projects.length} {t('common.total') ?? 'total'}</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={openCreate}>
          <Text style={styles.newBtnText}>+ {t('projects.new')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            onRefresh={() => { setRefreshing(true); void fetchProjects(); }}
          />
        }
        ListEmptyComponent={
          isLoading
            ? <ActivityIndicator color={colors.accent} style={{ marginTop: 60 }} />
            : (
              <View style={styles.empty}>
                <Text style={{ fontSize: 44, marginBottom: spacing.md }}>📁</Text>
                <Text style={styles.emptyText}>{t('common.noData')}</Text>
              </View>
            )
        }
      />

      {/* Create / Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" />
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editing ? t('common.edit') : t('projects.new')}</Text>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <AppInput label={t('projects.name')} value={name} onChangeText={setName} placeholder="Project name" />
              <AppInput label={t('projects.description')} value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholder="Optional description" />
              <AppInput label={t('projects.customerName')} value={customerName} onChangeText={setCustomerName} placeholder="Customer name" />
              <AppInput label={t('projects.customerCountry')} value={customerCountry} onChangeText={setCustomerCountry} placeholder="Country" />
              <View style={styles.modalActions}>
                <AppButton title={t('common.cancel')} onPress={() => setModalOpen(false)} variant="ghost" style={{ flex: 1 }} />
                <AppButton title={t('common.save')} onPress={handleSave} loading={saving} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
  list: { padding: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardCustomer: { fontSize: fontSize.sm, color: colors.subtext },
  cardCountry: { fontSize: fontSize.xs, color: colors.muted },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.borderAccent },
  badgeText: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '700' },
  badgeLabel: { fontSize: fontSize.xs, color: colors.accent },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  viewBtn: { backgroundColor: colors.accentSoft, borderColor: colors.borderAccent },
  viewBtnText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '600' },
  addBtn: { backgroundColor: colors.accentDark, borderColor: 'transparent' },
  addBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  editBtn: { backgroundColor: colors.surface2, borderColor: colors.border },
  editBtnText: { color: colors.subtext, fontSize: fontSize.sm, fontWeight: '600' },
  deleteBtn: { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '40' },
  deleteBtnText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '600' },
  pdfBtn: { backgroundColor: 'rgba(220,38,38,0.15)', borderColor: 'rgba(220,38,38,0.3)' },
  excelBtn: { backgroundColor: 'rgba(22,163,74,0.15)', borderColor: 'rgba(22,163,74,0.3)' },
  exportBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.muted, fontSize: fontSize.base },
  // Modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  modalCloseBtnText: { fontSize: fontSize.lg, color: colors.accent, fontWeight: '700' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  modalContent: { padding: spacing.lg, gap: spacing.md },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});

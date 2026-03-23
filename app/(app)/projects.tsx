import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, Alert,
  StyleSheet, TextInput, RefreshControl, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
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

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCountry, setCustomerCountry] = useState('');
  const [saving, setSaving] = useState(false);

  // Export loading state: projectId -> 'pdf' | 'excel' | null
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setProjects(await ProjectsApi.list());
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchProjects(); }, [fetchProjects]);

  const openCreate = () => {
    setEditing(null);
    setName(''); setDescription(''); setCustomerName(''); setCustomerCountry('');
    setModalOpen(true);
  };

  const openEdit = (p: ProjectDto) => {
    setEditing(p);
    setName(p.project_name); setDescription(p.project_description ?? '');
    setCustomerName(p.customer_name ?? ''); setCustomerCountry(p.customer_country ?? '');
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
          await ProjectsApi.delete(p.id);
          setProjects(prev => prev.filter(x => x.id !== p.id));
          Toast.show({ type: 'success', text1: t('projects.toastDeleted') });
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

      // Convert arraybuffer to base64
      const data = response.data as ArrayBuffer;
      const base64 = arrayBufferToBase64(data);

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: fileName,
        });
      } else {
        Alert.alert(t('projects.exportSuccess'), `${t('projects.savedTo')}: ${fileUri}`);
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
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.project_name}</Text>
            {item.customer_name ? <Text style={styles.cardSub}>{item.customer_name}</Text> : null}
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.product_count} {t('projects.products')}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <AppButton title={t('nav.products')} onPress={() => router.push(`/(app)/products?project_id=${item.id}`)} style={styles.actionBtn} />
          <AppButton title={t('common.edit')} onPress={() => openEdit(item)} variant="secondary" style={styles.actionBtn} />
          <AppButton title={t('common.delete')} onPress={() => handleDelete(item)} variant="danger" style={styles.actionBtn} />
        </View>
        {/* Export buttons */}
        <View style={styles.exportRow}>
          <TouchableOpacity
            style={[styles.exportBtn, styles.exportPdfBtn]}
            onPress={() => handleExport(item, 'pdf')}
            disabled={isExporting}
          >
            {isExporting && exportType === 'pdf' ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.exportBtnText}>📄 {t('projects.exportPdf')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, styles.exportExcelBtn]}
            onPress={() => handleExport(item, 'excel')}
            disabled={isExporting}
          >
            {isExporting && exportType === 'excel' ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.exportBtnText}>📊 {t('projects.exportExcel')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>{t('projects.title')}</Text>
        <AppButton title={t('projects.new')} onPress={openCreate} style={styles.newBtn} />
      </View>

      <FlatList
        data={projects}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchProjects(); }} />}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>{t('common.noData')}</Text> : null}
      />

      {/* Create / Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>{editing ? t('common.edit') : t('projects.new')}</Text>
              <AppInput label={t('projects.name')} value={name} onChangeText={setName} />
              <AppInput label={t('projects.description')} value={description} onChangeText={setDescription} multiline numberOfLines={3} />
              <AppInput label={t('projects.customerName')} value={customerName} onChangeText={setCustomerName} />
              <AppInput label={t('projects.customerCountry')} value={customerCountry} onChangeText={setCustomerCountry} />
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

// Helper: convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  pageTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray900 },
  newBtn: { paddingVertical: 8, paddingHorizontal: 14 },
  list: { padding: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, borderWidth: 1, borderColor: colors.gray200 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: fontSize.md, fontWeight: '600', color: colors.gray900 },
  cardSub: { fontSize: fontSize.sm, color: colors.gray500 },
  badge: { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: 7, paddingHorizontal: 8 },
  exportRow: { flexDirection: 'row', gap: spacing.sm },
  exportBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  exportPdfBtn: { backgroundColor: '#dc2626' },
  exportExcelBtn: { backgroundColor: '#16a34a' },
  exportBtnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.gray400, marginTop: 60 },
  modal: { flex: 1, backgroundColor: colors.white },
  modalContent: { padding: spacing.lg, gap: spacing.md },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.gray900, marginBottom: spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});

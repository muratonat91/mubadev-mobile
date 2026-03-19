import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { colors, radius, fontSize, spacing } from '../../theme';

interface Option { label: string; value: string | number }

interface Props {
  label?: string;
  value: string | number | undefined;
  options: Option[];
  placeholder?: string;
  onChange: (value: string | number) => void;
  error?: string;
}

export function AppPicker({ label, value, options, placeholder = 'Select...', onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={selected ? styles.selected : styles.placeholder}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={item => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.value === value && styles.optionSelected]}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                >
                  <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: fontSize.sm, fontWeight: '500', color: colors.gray700 },
  trigger: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  triggerError: { borderColor: colors.danger },
  selected: { fontSize: fontSize.base, color: colors.gray900 },
  placeholder: { fontSize: fontSize.base, color: colors.gray400 },
  arrow: { fontSize: fontSize.base, color: colors.gray500 },
  error: { fontSize: fontSize.xs, color: colors.danger },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '50%',
    paddingBottom: spacing.lg,
  },
  option: { paddingHorizontal: spacing.lg, paddingVertical: 14 },
  optionSelected: { backgroundColor: colors.primaryLight },
  optionText: { fontSize: fontSize.base, color: colors.gray800 },
  optionTextSelected: { color: colors.primary, fontWeight: '600' },
});

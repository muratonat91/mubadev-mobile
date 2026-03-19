import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors, radius, fontSize, spacing } from '../../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function AppInput({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.gray400}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: fontSize.sm, fontWeight: '500', color: colors.gray700 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSize.base,
    color: colors.gray900,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.danger },
  error: { fontSize: fontSize.xs, color: colors.danger },
});

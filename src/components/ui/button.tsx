import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../../theme/tokens';

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly secondary?: boolean;
}
export function Button({ label, onPress, disabled = false, secondary = false }: ButtonProps) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary,
      (pressed || disabled) && styles.dim]}>
    <Text style={[styles.label, secondary && styles.secondaryLabel]}>{label}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { minHeight: 48, paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: theme.colors.accent, borderRadius: theme.radius.medium,
    alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: theme.colors.board },
  label: { color: theme.colors.background, fontSize: theme.type.body, fontWeight: '700' },
  secondaryLabel: { color: theme.colors.text },
  dim: { opacity: 0.6 },
});

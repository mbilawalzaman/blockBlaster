import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/tokens';
import { Button } from './button';

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel?: () => void;
}
export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return <Modal visible={open} transparent animationType="none"
    onRequestClose={onCancel ?? (() => undefined)}>
    <View style={styles.overlay} accessibilityViewIsModal>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <Button label={confirmLabel} onPress={onConfirm} />
          {onCancel && <Button secondary label="Keep playing" onPress={onCancel} />}
        </View>
      </ScrollView>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: theme.colors.overlay },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.large },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: theme.spacing.large,
    gap: theme.spacing.medium, borderRadius: theme.radius.large, backgroundColor: theme.colors.surface },
  title: { color: theme.colors.text, fontSize: theme.type.heading, fontWeight: '800' },
  description: { color: theme.colors.muted, fontSize: theme.type.body, lineHeight: 24 },
});

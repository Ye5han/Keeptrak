import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/lib/theme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** An in-app confirm dialog. Works the same on Android, iOS and web, unlike the system alert. */
export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Close">
        <Pressable style={[styles.card, { backgroundColor: colors.card }]} onPress={() => {}} accessibilityRole="alert">
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} accessibilityRole="button" style={styles.action} hitSlop={6}>
              <Text style={{ color: colors.text, fontSize: 16 }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} accessibilityRole="button" style={styles.action} hitSlop={6}>
              <Text style={{ color: colors.danger, fontSize: 16, fontWeight: '600' }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 20, gap: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  message: { fontSize: 15 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginTop: 8 },
  action: { paddingVertical: 6 },
});

/**
 * Centered confirmation dialog — replaces Alert.alert across the app.
 *
 * Before this existed, destructive actions used `Alert.alert` which
 * shows a system-native dialog that breaks the app's design language.
 * This component renders a centered card with the app's typography,
 * colors, and spacing, matching the rest of the UI.
 *
 * Three shapes, one component:
 *
 *   1. Confirmation (default) — two buttons, Cancel + Confirm.
 *      Set `destructive: true` for dangerous actions (red confirm).
 *
 *   2. Info (set `cancelLabel` to undefined and `confirmLabel` to
 *      something like "Got it") — single dismiss button, used for
 *      policy/version/help text.
 *
 *   3. Destructive confirmation (set `destructive: true`) —
 *      confirm button is tinted with colors.error and the label
 *      stands out.
 *
 * NOT a bottom sheet — this is a centered card with a dim overlay.
 * User must choose an action or tap outside (if dismissOnOverlay is
 * true, defaulting to true). For truly blocking actions set
 * dismissOnOverlay=false so the user must make a decision.
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  /** If omitted, the dialog shows only the confirm button (info mode). */
  cancelLabel?: string;
  /** Red/error-tinted confirm button for dangerous actions. */
  destructive?: boolean;
  /** Default true — tap outside to cancel. Set false to require an action. */
  dismissOnOverlay?: boolean;
  onConfirm: () => void;
  /** Required unless `cancelLabel` is omitted. */
  onCancel?: () => void;
}

const DIM_OVERLAY_COLOR = 'rgba(0,0,0,0.5)';

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = false,
  dismissOnOverlay = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colors = useThemeColors();
  const isInfo = !cancelLabel;

  const handleOverlayPress = () => {
    if (!dismissOnOverlay) return;
    // Info dialogs treat overlay tap as confirm (acknowledge).
    // Two-button dialogs treat overlay tap as cancel (safer default).
    if (isInfo) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isInfo ? onConfirm : (onCancel ?? onConfirm)}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: DIM_OVERLAY_COLOR }]}
        onPress={handleOverlayPress}
        accessibilityRole={dismissOnOverlay ? 'button' : undefined}
      >
        <Pressable
          // Inner pressable swallows the tap so content clicks don't
          // bubble to the overlay dismiss handler.
          onPress={() => {}}
          style={[
            styles.card,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <Text
            style={[Typography.titleLarge, { color: colors.onSurface, marginBottom: body ? Spacing.sm : 0 }]}
          >
            {title}
          </Text>
          {body && (
            <Text style={[Typography.body, { color: colors.onSurfaceVariant }]}>
              {body}
            </Text>
          )}

          <View style={[styles.buttonRow, { marginTop: Spacing.lg }]}>
            {!isInfo && cancelLabel && (
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  {
                    borderColor: colors.outlineVariant,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
                accessibilityRole="button"
              >
                <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>
                  {cancelLabel}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: destructive ? colors.error : colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  Typography.titleSmall,
                  {
                    // Destructive button always uses white text for
                    // maximum contrast against the error red, same
                    // as primary buttons use onPrimary.
                    color: destructive ? '#FFFFFF' : colors.onPrimary,
                    fontWeight: '600',
                  },
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  confirmButton: {},
});

/**
 * Shared bottom sheet — the single source of truth for every
 * overlay in Fork & Compass.
 *
 * Props:
 *   visible: boolean
 *   onDismiss: () => void
 *   size?: 'small' | 'medium' | 'full'  (defaults to 'small')
 *   title?: string                       optional header
 *   showCloseButton?: boolean            top-right X for full sheets
 *   dismissOnOverlay?: boolean           defaults to true
 *   disablePanDismiss?: boolean          when true: no drag handle, no swipe-to-dismiss
 *   fullBleed?: boolean                  zero horizontal padding in content area
 *   children: React.ReactNode
 */
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Animated,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useReducedMotion } from '@/utils/motion';

export type BottomSheetSize = 'small' | 'medium' | 'full';

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  size?: BottomSheetSize;
  title?: string;
  showCloseButton?: boolean;
  dismissOnOverlay?: boolean;
  /**
   * When true, swipe-to-dismiss gesture is disabled and the drag handle is hidden.
   * The sheet can only be closed via showCloseButton or dismissOnOverlay.
   * Use this for content-heavy full sheets that should feel like pages.
   */
  disablePanDismiss?: boolean;
  /**
   * When true, content area gets zero horizontal padding so hero
   * images or full-width banners can go edge-to-edge.
   */
  fullBleed?: boolean;
  children: React.ReactNode;
}

const SIZE_FRACTIONS: Record<BottomSheetSize, number> = {
  small: 0.35,
  medium: 0.55,
  full: 0.85,
};

const DIM_OVERLAY_COLOR = 'rgba(0,0,0,0.5)';
const DISMISS_THRESHOLD_PX = 80;
const DISMISS_VELOCITY = 0.5;

export function BottomSheet({
  visible,
  onDismiss,
  size = 'small',
  title,
  showCloseButton = false,
  dismissOnOverlay = true,
  disablePanDismiss = false,
  fullBleed = false,
  children,
}: BottomSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const sheetHeight = screenHeight * SIZE_FRACTIONS[size];

  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : sheetHeight)).current;

  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        translateY.setValue(0);
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 300,
          mass: 1,
        }).start();
      }
    } else {
      translateY.setValue(reduceMotion ? 0 : sheetHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sheetHeight, reduceMotion]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (
        _e: GestureResponderEvent,
        g: PanResponderGestureState,
      ) => {
        return g.dy > 5 && Math.abs(g.dy) > Math.abs(g.dx);
      },
      onPanResponderMove: (_e, g) => {
        if (g.dy >= 0) {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > DISMISS_THRESHOLD_PX || g.vy > DISMISS_VELOCITY) {
          if (reduceMotion) {
            onDismiss();
          } else {
            Animated.timing(translateY, {
              toValue: sheetHeight,
              duration: 180,
              useNativeDriver: true,
            }).start(() => onDismiss());
          }
        } else {
          if (reduceMotion) {
            translateY.setValue(0);
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              damping: 20,
              stiffness: 300,
            }).start();
          }
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: DIM_OVERLAY_COLOR }]}
        onPress={dismissOnOverlay ? onDismiss : undefined}
        accessibilityRole={dismissOnOverlay ? 'button' : undefined}
        accessibilityLabel={dismissOnOverlay ? 'Dismiss' : undefined}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              backgroundColor: colors.surfaceContainerLow,
              paddingBottom: insets.bottom,
              transform: [{ translateY }],
            },
          ]}
          {...(disablePanDismiss ? {} : panResponder.panHandlers)}
        >
          <Pressable
            onPress={() => {}}
            style={styles.sheetInner}
          >
            {/* Drag handle — hidden when disablePanDismiss */}
            {!disablePanDismiss && (
              <View style={styles.dragHandleWrap}>
                <View
                  style={[
                    styles.dragHandle,
                    { backgroundColor: colors.outlineVariant },
                  ]}
                />
              </View>
            )}

            {/* Optional header row (title + close button) */}
            {(title || showCloseButton) && (
              <View style={[styles.header, disablePanDismiss && styles.headerNoDrag]}>
                {title ? (
                  <Text
                    style={[
                      Typography.headline,
                      { color: colors.onSurface, flex: 1 },
                    ]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
                {showCloseButton && (
                  <Pressable
                    onPress={onDismiss}
                    style={[
                      styles.closeButton,
                      { backgroundColor: colors.surfaceContainerHigh },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color={colors.onSurface}
                    />
                  </Pressable>
                )}
              </View>
            )}

            {/* Content area */}
            <View style={[styles.content, fullBleed && styles.contentFullBleed]}>
              {children}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: 'hidden',
  },
  sheetInner: {
    flex: 1,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerNoDrag: {
    paddingTop: Spacing.lg,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  contentFullBleed: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});

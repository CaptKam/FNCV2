/**
 * Shared bottom sheet — the single source of truth for every
 * overlay in Fork & Compass.
 *
 * Why a shared component:
 *   Before this existed, every screen hand-rolled its own sheet
 *   using React Native's <Modal>. The result was 12 sheets that all
 *   had slightly different heights, corner radii, drag handles,
 *   dim overlays, and dismiss behaviors. Fix one → only one sheet
 *   changes. With this component, changes propagate everywhere.
 *
 * Standards enforced:
 *   - size='small'  → 35% of screen height (quick 1-5 option pickers)
 *   - size='medium' → 55% of screen height (6-15 options, forms)
 *   - size='full'   → 85% of screen height (complex forms, grids)
 *   - Corner radius: 24px on top corners only
 *   - Drag handle: 36px wide, 4px tall, outlineVariant color, 12px
 *     top margin (always present regardless of size)
 *   - Background dim: rgba(0,0,0,0.5)
 *   - Swipe down to dismiss (PanResponder threshold: 80px or
 *     velocity > 0.5)
 *   - Tap dim to dismiss (unless dismissOnOverlay=false)
 *   - Spring animation in (damping: 20, stiffness: 300)
 *   - Safe-area padding at the bottom so content above the home
 *     indicator isn't clipped
 *
 * Props:
 *   visible: boolean
 *   onDismiss: () => void
 *   size?: 'small' | 'medium' | 'full'  (defaults to 'small')
 *   title?: string                       optional header
 *   showCloseButton?: boolean            top-right X for full sheets
 *   dismissOnOverlay?: boolean           defaults to true
 *   children: React.ReactNode
 *
 * Usage:
 *   <BottomSheet visible={open} onDismiss={() => setOpen(false)} size="small" title="Pick a day">
 *     <SelectionPill ... />
 *   </BottomSheet>
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
   * When true, content area gets zero horizontal padding so hero
   * images or full-width banners can go edge-to-edge. Use for
   * full-sheet category takeovers. Drag handle and header row are
   * still padded normally.
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
  fullBleed = false,
  children,
}: BottomSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const sheetHeight = screenHeight * SIZE_FRACTIONS[size];

  // Translation for drag-to-dismiss. Starts off-screen (= full
  // sheetHeight) and springs to 0 when the sheet opens. We drag the
  // sheet downward as a delta on top of this.
  //
  // When reduceMotion is true (motion kill-switch flipped on), we
  // skip the spring entirely and snap to 0 on open / sheetHeight on
  // close. Drag-to-dismiss gestures still work because PanResponder
  // sets translateY directly, independent of this effect.
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
      // Pre-position so the NEXT open animates from the bottom again.
      translateY.setValue(reduceMotion ? 0 : sheetHeight);
    }
    // translateY is a ref; sheetHeight changes with size/screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sheetHeight, reduceMotion]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (
        _e: GestureResponderEvent,
        g: PanResponderGestureState,
      ) => {
        // Only capture vertical downward drags. Horizontal gestures
        // and upward swipes pass through to children.
        return g.dy > 5 && Math.abs(g.dy) > Math.abs(g.dx);
      },
      onPanResponderMove: (_e, g) => {
        if (g.dy >= 0) {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > DISMISS_THRESHOLD_PX || g.vy > DISMISS_VELOCITY) {
          // Dismiss. With motion disabled we skip the slide-out
          // animation and just call onDismiss immediately.
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
          // Snap back to open position.
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
      {/* Dim overlay — tap to dismiss if enabled */}
      <Pressable
        style={[styles.overlay, { backgroundColor: DIM_OVERLAY_COLOR }]}
        onPress={dismissOnOverlay ? onDismiss : undefined}
        accessibilityRole={dismissOnOverlay ? 'button' : undefined}
        accessibilityLabel={dismissOnOverlay ? 'Dismiss' : undefined}
      >
        {/* Sheet container — stopPropagation so tapping the content
            doesn't bubble to the overlay and accidentally dismiss. */}
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
          {...panResponder.panHandlers}
        >
          <Pressable
            // Inner pressable swallows the tap so it doesn't reach
            // the overlay. onPress is a no-op on purpose.
            onPress={() => {}}
            style={styles.sheetInner}
          >
            {/* Drag handle — always present */}
            <View style={styles.dragHandleWrap}>
              <View
                style={[
                  styles.dragHandle,
                  { backgroundColor: colors.outlineVariant },
                ]}
              />
            </View>

            {/* Optional header row (title + close button) */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
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
    borderTopLeftRadius: Radius.lg, // 24
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

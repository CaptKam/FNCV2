/**
 * Fork & Compass Design System — the single source of truth.
 *
 * Every visual constant for every reusable element type lives here.
 * Shared components (Checkbox, SelectionPill, BottomSheet, etc.)
 * reference these values. Screen files NEVER hardcode visual
 * properties that this file covers.
 *
 * To change how checkboxes look across the entire app, change the
 * value here. One file, one change, everywhere updates.
 *
 * Color tokens (e.g. 'primary', 'surfaceContainerHigh') are
 * resolved at runtime by useThemeColors(). This file stores the
 * TOKEN NAMES, not the hex values, so dark mode is automatic.
 */

import { Radius } from './radius';
import { Spacing } from './spacing';

export const DESIGN = {
  // ═══════════════════════════════════════════════════════
  // CHECKBOX — components/Checkbox.tsx
  // ═══════════════════════════════════════════════════════
  checkbox: {
    sizes: {
      sm: { box: 20, icon: 12, hitSlop: 8 },
      default: { box: 24, icon: 14, hitSlop: 10 },
      large: { box: 32, icon: 18, hitSlop: 10 },
    },
    borderWidth: 2,
    borderRadius: Radius.full,
    // Colors resolved via useThemeColors at call time:
    uncheckedBorder: 'outlineVariant',
    checkedFill: 'primary',
    checkIconColor: '#FFFFFF',
    haptic: 'light' as const,
  },

  // ═══════════════════════════════════════════════════════
  // SELECTION PILL — components/SelectionPill.tsx
  // ═══════════════════════════════════════════════════════
  pill: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: Radius.full,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    unselected: {
      background: 'surfaceContainerHigh',
      text: 'onSurface',
      border: 'outlineVariant',
    },
    selectedRadio: {
      background: 'primary',
      text: 'onPrimary',
    },
    selectedCheck: {
      background: 'primaryContainer',
      text: 'onPrimaryContainer',
    },
    checkIconSize: 16,
  },

  // ═══════════════════════════════════════════════════════
  // CTA BUTTON — components/SelectionPill.tsx ActionButton
  // ═══════════════════════════════════════════════════════
  ctaButton: {
    primary: {
      height: 52,
      borderRadius: Radius.full,
      background: 'primary',
      text: 'onPrimary',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    secondary: {
      height: 48,
      borderRadius: Radius.full,
      background: 'surfaceContainerHigh',
      text: 'onSurface',
      fontSize: 14,
      fontWeight: '500' as const,
      borderWidth: 1,
      borderColor: 'outlineVariant',
    },
    destructive: {
      height: 52,
      borderRadius: Radius.full,
      background: 'error',
      text: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    ghost: {
      height: 44,
      background: 'transparent',
      text: 'primary',
      fontSize: 14,
      fontWeight: '500' as const,
    },
  },

  // ═══════════════════════════════════════════════════════
  // BOTTOM SHEET — components/BottomSheet.tsx
  // ═══════════════════════════════════════════════════════
  sheet: {
    sizes: {
      small: 0.35,
      medium: 0.55,
      full: 0.85,
    },
    cornerRadius: Radius.lg, // 24
    background: 'surfaceContainerLow',
    dimOverlay: 'rgba(0,0,0,0.5)',
    dragHandle: {
      width: 36,
      height: 4,
      borderRadius: Radius.full,
      color: 'outlineVariant',
      marginTop: 12,
    },
    closeButton: {
      size: 36,
      borderRadius: Radius.full,
      background: 'surfaceContainerHigh',
      iconSize: 20,
    },
    contentPaddingHorizontal: Spacing.lg, // 24
    contentPaddingTop: Spacing.md, // 16
    dismissThresholdPx: 80,
    dismissVelocity: 0.5,
  },

  // ═══════════════════════════════════════════════════════
  // CONFIRM DIALOG — components/ConfirmDialog.tsx
  // ═══════════════════════════════════════════════════════
  confirmDialog: {
    maxWidth: 420,
    padding: Spacing.lg, // 24
    borderRadius: Radius.lg, // 24
    background: 'surfaceContainerHigh',
    dimOverlay: 'rgba(0,0,0,0.5)',
    buttonHeight: 52,
    buttonRadius: Radius.full,
    buttonGap: Spacing.sm, // 8
  },

  // ═══════════════════════════════════════════════════════
  // OVERLAY BUTTON (on images) — constants/icons.ts
  // ═══════════════════════════════════════════════════════
  overlayButton: {
    size: 40,
    iconSize: 20,
    iconColor: '#FFFFFF',
    background: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full,
  },

  // ═══════════════════════════════════════════════════════
  // CLOSE / DISMISS BUTTON (on plain backgrounds)
  // ═══════════════════════════════════════════════════════
  closeButton: {
    size: 36,
    iconName: 'close' as const,
    iconSize: 20,
    iconColor: 'onSurfaceVariant',
    background: 'surfaceContainerHigh',
    borderRadius: Radius.full,
  },

  // ═══════════════════════════════════════════════════════
  // INPUT FIELD — components/StyledInput.tsx
  // ═══════════════════════════════════════════════════════
  input: {
    height: 48,
    borderRadius: Radius.md, // 16
    borderWidth: 1,
    borderColor: 'outlineVariant',
    background: 'surfaceContainerHigh',
    fontSize: 16,
    paddingHorizontal: Spacing.md, // 16
    placeholderColor: 'outline',
    focusBorderColor: 'primary',
  },

  // ═══════════════════════════════════════════════════════
  // CARD — components/Card.tsx
  // ═══════════════════════════════════════════════════════
  card: {
    background: 'surfaceContainerLow',
    borderRadius: Radius.lg, // 24
    padding: Spacing.md, // 16
  },

  // ═══════════════════════════════════════════════════════
  // SECTION HEADER
  // ═══════════════════════════════════════════════════════
  sectionHeader: {
    typography: 'labelLarge', // 12px, 700 weight
    color: 'outline',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: Spacing.sm, // 8
  },

  // ═══════════════════════════════════════════════════════
  // LIST ROW
  // ═══════════════════════════════════════════════════════
  listRow: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md, // 16
  },

  // ═══════════════════════════════════════════════════════
  // IMAGE STANDARD SIZES
  // ═══════════════════════════════════════════════════════
  image: {
    hero: { height: 240, borderRadius: Radius.xl },
    cardLarge: { height: 280, borderRadius: Radius.lg },
    cardSmall: { height: 160, borderRadius: Radius.lg },
    thumbnail: { size: 80, borderRadius: Radius.md },
    thumbnailSmall: { size: 56, borderRadius: Radius.md },
    ingredientCircle: { size: 72, borderRadius: 36 },
    avatar: { size: 36, borderRadius: 18 },
  },

  // ═══════════════════════════════════════════════════════
  // TOAST — context/ToastContext.tsx
  // ═══════════════════════════════════════════════════════
  toast: {
    height: 48,
    borderRadius: Radius.full,
    background: 'inverseSurface',
    text: 'inverseOnSurface',
    fontSize: 14,
    iconSize: 16,
  },

  // ═══════════════════════════════════════════════════════
  // PROGRESS BAR — components/AnimatedProgressBar.tsx
  // ═══════════════════════════════════════════════════════
  progressBar: {
    height: 6,
    borderRadius: 3,
    trackColor: 'surfaceContainerHigh',
    fillColor: 'primary',
  },

  // ═══════════════════════════════════════════════════════
  // DIVIDER
  // ═══════════════════════════════════════════════════════
  divider: {
    height: 1,
    color: 'outlineVariant',
    opacity: 0.3,
  },

  // ═══════════════════════════════════════════════════════
  // BADGE / DOT INDICATOR
  // ═══════════════════════════════════════════════════════
  badge: {
    dot: { size: 6, borderRadius: 3 },
    count: { size: 20, fontSize: 11, fontWeight: '600' as const, borderRadius: 10 },
  },
} as const;

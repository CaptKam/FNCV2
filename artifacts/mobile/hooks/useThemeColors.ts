import colors from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { Glass } from '@/constants/glass';
import { Shadows } from '@/constants/shadows';
import { useThemePreference } from '@/context/ThemeContext';

export function useThemeColors() {
  const { isDark } = useThemePreference();
  const palette = isDark ? colors.dark : colors.light;
  const glass = isDark ? Glass.dark : Glass.light;

  return {
    ...palette,
    isDark,
    radius: Radius,
    spacing: Spacing,
    glass,
    shadows: Shadows,
  };
}

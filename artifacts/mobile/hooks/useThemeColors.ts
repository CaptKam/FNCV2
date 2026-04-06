import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';
import { Radius } from '@/constants/radius';
import { Spacing } from '@/constants/spacing';
import { Glass } from '@/constants/glass';
import { Shadows } from '@/constants/shadows';

export function useThemeColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
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

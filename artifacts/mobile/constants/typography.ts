import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  displayLarge: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 56,
    letterSpacing: -1.12,
  },
  displayMedium: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 40,
    letterSpacing: -0.6,
  },
  display: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 28,
  },
  headlineLarge: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 32,
  },
  headline: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 22,
  },
  title: {
    fontFamily: 'NotoSerif_500Medium',
    fontSize: 18,
  },
  titleMedium: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
  },
  titleSmall: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    lineHeight: 27.2,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  labelLarge: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  labelSmall: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
};

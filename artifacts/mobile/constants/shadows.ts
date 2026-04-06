import { ViewStyle } from 'react-native';

export const Shadows: Record<string, ViewStyle> = {
  ambient: {
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    shadowColor: '#1D1B18',
    elevation: 8,
  },
  subtle: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowColor: '#1D1B18',
    elevation: 4,
  },
  hero: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    shadowColor: '#9A4100',
    elevation: 12,
  },
};

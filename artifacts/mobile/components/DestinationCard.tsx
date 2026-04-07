import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Country } from '@/data/countries';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface DestinationCardProps {
  country: Country;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

export function DestinationCard({ country }: DestinationCardProps) {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - Spacing.page * 2 - Spacing.md) / 2;
  const router = useRouter();
  const scale = useSharedValue(1);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withTiming(1.1, { duration: 700 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 300 }); }}
      onPress={() => router.push(`/country/${country.id}`)}
      style={[styles.card, { width: CARD_WIDTH }]}
    >
      <AnimatedImage
        source={{ uri: country.heroImage }}
        style={[styles.image, imageStyle]}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        style={styles.gradient}
      />
      <View style={styles.textContainer}>
        <Text style={[Typography.labelSmall, { color: 'rgba(255,255,255,0.8)' }]}>
          {country.flag} {country.region}
        </Text>
        <Text style={[Typography.headline, { color: '#FFFFFF', fontSize: 18 }]} numberOfLines={1}>
          {country.name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 320,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  textContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.md,
    right: Spacing.md,
    gap: 4,
  },
});

import { StyleSheet, View, TouchableOpacity, type ViewStyle } from 'react-native';
import { colors, radius, spacing, shadows } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | (ViewStyle | null | false | undefined)[];
  onPress?: () => void;
  noPadding?: boolean;
}

export function Card({ children, style, onPress, noPadding = false }: CardProps) {
  const baseStyle: ViewStyle[] = [styles.card, shadows.sm as ViewStyle];
  if (noPadding) baseStyle.push(styles.noPadding);

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[...baseStyle, style as ViewStyle]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[...baseStyle, style as ViewStyle]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  noPadding: {
    padding: 0,
  },
});

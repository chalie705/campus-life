import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

type ColorKey = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'accent' | 'secondary';

interface StatusBadgeProps {
  label: string;
  color?: ColorKey;
}

export function StatusBadge({ label, color = 'neutral' }: StatusBadgeProps) {
  const c = colors[color];

  return (
    <View style={[styles.badge, { backgroundColor: c[100] }]}>
      <View style={[styles.dot, { backgroundColor: c[600] }]} />
      <Text style={[styles.label, { color: c[700] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});

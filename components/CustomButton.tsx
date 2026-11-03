import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing, shadows } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface CustomButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function CustomButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = false,
}: CustomButtonProps) {
  const variantStyles = {
    primary: { bg: colors.primary[600], text: colors.neutral[0] },
    secondary: { bg: colors.secondary[600], text: colors.neutral[0] },
    outline: { bg: 'transparent', text: colors.primary[700], border: colors.primary[300] },
    ghost: { bg: 'transparent', text: colors.primary[700] },
    danger: { bg: colors.error[600], text: colors.neutral[0] },
  };

  const sizeStyles = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: 14 },
    md: { paddingVertical: 14, paddingHorizontal: spacing.lg, fontSize: 16 },
    lg: { paddingVertical: 18, paddingHorizontal: spacing.xl, fontSize: 18 },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        { backgroundColor: v.bg, borderWidth: variant === 'outline' ? 1.5 : 0, borderColor: 'border' in v ? v.border : undefined },
        s,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        variant !== 'ghost' && shadows.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

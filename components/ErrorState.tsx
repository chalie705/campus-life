import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { colors, spacing } from '@/lib/theme';
import { CustomButton } from './CustomButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <AlertTriangle size={40} color={colors.error[400]} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{message}</Text>
      {onRetry ? (
        <CustomButton
          label="Try Again"
          variant="outline"
          size="sm"
          onPress={onRetry}
          icon={<RefreshCw size={16} color={colors.primary[700]} />}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl * 2,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});

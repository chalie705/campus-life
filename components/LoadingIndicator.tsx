import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { colors } from '@/lib/theme';
import { spacing } from '@/lib/theme';

export function LoadingIndicator({ message }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
});

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { colors } from '@/lib/theme';

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (loading) return;

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, inAuthGroup, router]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="announcement/[id]" options={{ title: 'Announcement', headerShown: true }} />
      <Stack.Screen name="event/[id]" options={{ title: 'Event', headerShown: true }} />
      <Stack.Screen name="club/[id]" options={{ title: 'Club', headerShown: true }} />
      <Stack.Screen name="facility/[id]" options={{ title: 'Facility', headerShown: true }} />
      <Stack.Screen name="request/[id]" options={{ title: 'Request', headerShown: true }} />
      <Stack.Screen name="feedback/[id]" options={{ title: 'Feedback', headerShown: true }} />
      <Stack.Screen name="notification/[id]" options={{ title: 'Notification', headerShown: true }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile', headerShown: true }} />
      <Stack.Screen name="settings" options={{ title: 'Settings', headerShown: true }} />
      <Stack.Screen name="new-request" options={{ title: 'New Request', headerShown: true }} />
      <Stack.Screen name="new-feedback" options={{ title: 'Submit Feedback', headerShown: true }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },
});

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

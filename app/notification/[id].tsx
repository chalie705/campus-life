import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Calendar, Wrench, MessageSquare, AlertTriangle, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/lib/theme';
import { formatDateTime, notificationTypeLabels } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types/database';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';

const iconMap: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  announcement: { icon: Bell, color: colors.primary[600] },
  event: { icon: Calendar, color: colors.secondary[600] },
  service_request: { icon: Wrench, color: colors.accent[600] },
  feedback: { icon: MessageSquare, color: colors.success[600] },
  alert: { icon: AlertTriangle, color: colors.error[600] },
  account: { icon: User, color: colors.neutral[600] },
};

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('notifications').select('*').eq('id', id).maybeSingle();
      if (error) setError(error.message);
      else if (data) {
        setNotification(data as Notification);
        if (!(data as Notification).is_read) {
          await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        }
      } else setError('Notification not found');
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <LoadingIndicator />;
  if (error || !notification) return <ErrorState message={error ?? 'Not found'} onRetry={() => router.back()} />;

  const { icon: Icon, color } = iconMap[notification.type];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
          <Icon size={32} color={color} />
        </View>
        <Text style={styles.typeLabel}>{notificationTypeLabels[notification.type]}</Text>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.date}>{formatDateTime(notification.created_at)}</Text>
        {notification.body ? <Text style={styles.body}>{notification.body}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  backBtn: { padding: spacing.sm },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  iconWrap: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  typeLabel: { fontSize: 12, fontWeight: '700', color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '800', color: colors.neutral[900], marginTop: 4, lineHeight: 30 },
  date: { fontSize: 14, color: colors.neutral[400], marginTop: 4 },
  body: { fontSize: 16, color: colors.neutral[600], lineHeight: 24, marginTop: spacing.lg },
});

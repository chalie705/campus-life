import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pin, Calendar, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, radius } from '@/lib/theme';
import { formatDateTime, announcementPriorityLabels } from '@/lib/utils';
import type { Announcement } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { TouchableOpacity } from 'react-native';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) setError(error.message);
      else if (data) {
        setAnnouncement(data as Announcement);
        // Mark as read
        if (session?.user) {
          await supabase.from('announcement_reads').upsert({
            announcement_id: id,
            user_id: session.user.id,
            read_at: new Date().toISOString(),
          });
        }
      } else {
        setError('Announcement not found');
      }
      setLoading(false);
    }
    load();
  }, [id, session]);

  if (loading) return <LoadingIndicator />;
  if (error || !announcement) return <ErrorState message={error ?? 'Not found'} onRetry={() => router.back()} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {announcement.image_url ? (
          <Image source={{ uri: announcement.image_url }} style={styles.image} />
        ) : null}
        <View style={styles.badges}>
          {announcement.is_pinned ? (
            <View style={styles.pinned}>
              <Pin size={12} color={colors.accent[700]} />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          ) : null}
          {announcement.priority !== 'normal' ? (
            <StatusBadge
              label={announcementPriorityLabels[announcement.priority]}
              color={announcement.priority === 'urgent' ? 'error' : 'warning'}
            />
          ) : null}
          <StatusBadge label={announcement.category} color="primary" />
        </View>
        <Text style={styles.title}>{announcement.title}</Text>
        <View style={styles.meta}>
          <Calendar size={15} color={colors.neutral[400]} />
          <Text style={styles.metaText}>{formatDateTime(announcement.created_at)}</Text>
        </View>
        <Text style={styles.body}>{announcement.body}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  backBtn: { padding: spacing.sm },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  image: { width: '100%', height: 200, borderRadius: radius.lg, marginBottom: spacing.md },
  badges: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginBottom: spacing.sm },
  pinned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pinnedText: { fontSize: 12, fontWeight: '600', color: colors.accent[700] },
  title: { fontSize: 26, fontWeight: '800', color: colors.neutral[900], lineHeight: 32 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, marginBottom: spacing.lg },
  metaText: { fontSize: 14, color: colors.neutral[400] },
  body: { fontSize: 16, color: colors.neutral[700], lineHeight: 24 },
});

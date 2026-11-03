import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, radius } from '@/lib/theme';
import { formatDateTime, formatUpcoming, formatTime } from '@/lib/utils';
import type { CampusEvent } from '@/types/database';
import { CustomButton } from '@/components/CustomButton';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';

type RSVPStatus = 'going' | 'interested' | 'not_going';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [event, setEvent] = useState<CampusEvent | null>(null);
  const [rsvp, setRsvp] = useState<RSVPStatus | null>(null);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      if (error) setError(error.message);
      else if (data) setEvent(data as CampusEvent);
      else setError('Event not found');

      if (session?.user) {
        const { data: rsvpData } = await supabase
          .from('event_rsvps')
          .select('status')
          .eq('event_id', id)
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (rsvpData) setRsvp(rsvpData.status as RSVPStatus);
      }

      const { count } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id)
        .eq('status', 'going');
      setRsvpCount(count ?? 0);

      setLoading(false);
    }
    load();
  }, [id, session]);

  async function updateRSVP(status: RSVPStatus) {
    if (!session?.user) return;
    setUpdating(true);
    if (rsvp === status) {
      await supabase.from('event_rsvps').delete().eq('event_id', id).eq('user_id', session.user.id);
      setRsvp(null);
    } else {
      await supabase
        .from('event_rsvps')
        .upsert({ event_id: id, user_id: session.user.id, status }, { onConflict: 'event_id,user_id' });
      setRsvp(status);
    }

    const { count } = await supabase
      .from('event_rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id)
      .eq('status', 'going');
    setRsvpCount(count ?? 0);
    setUpdating(false);
  }

  if (loading) return <LoadingIndicator />;
  if (error || !event) return <ErrorState message={error ?? 'Not found'} onRetry={() => router.back()} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.image} />
        ) : null}
        <Text style={styles.category}>{event.category.toUpperCase()}</Text>
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.metaList}>
          <View style={styles.metaItem}>
            <Calendar size={18} color={colors.primary[600]} />
            <View>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{formatUpcoming(event.start_time)}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Clock size={18} color={colors.primary[600]} />
            <View>
              <Text style={styles.metaLabel}>Time</Text>
              <Text style={styles.metaValue}>
                {formatTime(event.start_time)}
                {event.end_time ? ` - ${formatTime(event.end_time)}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <MapPin size={18} color={colors.primary[600]} />
            <View>
              <Text style={styles.metaLabel}>Location</Text>
              <Text style={styles.metaValue}>{event.location ?? 'TBD'}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Users size={18} color={colors.primary[600]} />
            <View>
              <Text style={styles.metaLabel}>Attendees</Text>
              <Text style={styles.metaValue}>
                {rsvpCount} going{event.max_attendees ? ` / ${event.max_attendees} max` : ''}
              </Text>
            </View>
          </View>
        </View>

        {event.description ? (
          <View style={styles.descSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        ) : null}

        <View style={styles.rsvpSection}>
          <Text style={styles.sectionTitle}>RSVP</Text>
          <View style={styles.rsvpButtons}>
            <CustomButton
              label="Going"
              variant={rsvp === 'going' ? 'primary' : 'outline'}
              size="md"
              onPress={() => updateRSVP('going')}
              loading={updating}
            />
            <CustomButton
              label="Interested"
              variant={rsvp === 'interested' ? 'secondary' : 'outline'}
              size="md"
              onPress={() => updateRSVP('interested')}
            />
            <CustomButton
              label="Not Going"
              variant={rsvp === 'not_going' ? 'danger' : 'outline'}
              size="md"
              onPress={() => updateRSVP('not_going')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  backBtn: { padding: spacing.sm },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  image: { width: '100%', height: 220, borderRadius: radius.lg, marginBottom: spacing.md },
  category: { fontSize: 12, fontWeight: '700', color: colors.primary[600], letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '800', color: colors.neutral[900], lineHeight: 32, marginTop: 4 },
  metaList: { marginTop: spacing.lg, gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  metaLabel: { fontSize: 12, color: colors.neutral[400], fontWeight: '500' },
  metaValue: { fontSize: 15, color: colors.neutral[800], fontWeight: '600' },
  descSection: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.neutral[900], marginBottom: spacing.sm },
  description: { fontSize: 15, color: colors.neutral[600], lineHeight: 22 },
  rsvpSection: { marginTop: spacing.xl },
  rsvpButtons: { gap: spacing.sm },
});

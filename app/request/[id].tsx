import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, MapPin, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/lib/theme';
import { formatRelative, statusLabels, statusColors, priorityLabels, formatDateTime } from '@/lib/utils';
import type { ServiceRequest, RequestHistory } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('service_requests').select('*').eq('id', id).maybeSingle();
      if (error) setError(error.message);
      else if (data) setRequest(data as ServiceRequest);
      else setError('Request not found');

      const { data: histData } = await supabase
        .from('request_history')
        .select('*')
        .eq('request_id', id)
        .order('created_at', { ascending: false });
      if (histData) setHistory(histData as RequestHistory[]);

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <LoadingIndicator />;
  if (error || !request) return <ErrorState message={error ?? 'Not found'} onRetry={() => router.back()} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statusRow}>
          <StatusBadge label={statusLabels[request.status]} color={statusColors[request.status] as never} />
          <StatusBadge label={`${priorityLabels[request.priority]} Priority`} color={request.priority === 'high' ? 'error' : request.priority === 'medium' ? 'warning' : 'neutral'} />
        </View>
        <Text style={styles.title}>{request.title}</Text>
        <Text style={styles.date}>Submitted {formatRelative(request.created_at)}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{request.description}</Text>
        </View>

        {request.photo_url ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo</Text>
            <Image source={{ uri: request.photo_url }} style={styles.photo} />
          </View>
        ) : null}

        {request.location ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.infoItem}>
              <MapPin size={18} color={colors.primary[600]} />
              <Text style={styles.infoText}>{request.location}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue} style2={undefined}>{request.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Request ID</Text>
            <Text style={styles.detailValue}>{request.id.slice(0, 8)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>{formatDateTime(request.created_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Updated</Text>
            <Text style={styles.detailValue}>{formatDateTime(request.updated_at)}</Text>
          </View>
        </View>

        {request.rating ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  color={star <= request.rating! ? colors.accent[500] : colors.neutral[200]}
                  fill={star <= request.rating! ? colors.accent[500] : 'none'}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status History</Text>
          {history.length > 0 ? (
            <View style={styles.timeline}>
              {history.map((item, idx) => (
                <View key={item.id} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  {idx < history.length - 1 ? <View style={styles.timelineLine} /> : null}
                  <View style={styles.timelineContent}>
                    <StatusBadge label={statusLabels[item.status]} color={statusColors[item.status] as never} />
                    {item.note ? <Text style={styles.timelineNote}>{item.note}</Text> : null}
                    <Text style={styles.timelineDate}>{formatDateTime(item.created_at)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No status updates yet.</Text>
          )}
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
  statusRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: colors.neutral[900] },
  date: { fontSize: 14, color: colors.neutral[400], marginTop: 4 },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.neutral[900], marginBottom: spacing.sm },
  description: { fontSize: 15, color: colors.neutral[600], lineHeight: 22 },
  photo: { width: '100%', height: 200, borderRadius: radius.md },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { fontSize: 15, color: colors.neutral[700] },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  detailLabel: { fontSize: 14, color: colors.neutral[400], fontWeight: '500' },
  detailValue: { fontSize: 14, color: colors.neutral[800], fontWeight: '600' },
  starsRow: { flexDirection: 'row', gap: 4 },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: spacing.md, paddingBottom: spacing.md },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary[600], marginTop: 4 },
  timelineLine: { position: 'absolute', left: 5, top: 16, bottom: -spacing.md, width: 2, backgroundColor: colors.neutral[200] },
  timelineContent: { flex: 1, gap: 4 },
  timelineNote: { fontSize: 14, color: colors.neutral[600], lineHeight: 19 },
  timelineDate: { fontSize: 13, color: colors.neutral[400] },
  emptyText: { fontSize: 14, color: colors.neutral[400] },
});

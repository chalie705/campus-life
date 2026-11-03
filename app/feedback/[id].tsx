import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/lib/theme';
import { formatRelative, formatDateTime, feedbackTypeLabels } from '@/lib/utils';
import type { Feedback, FeedbackResponse } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';

export default function FeedbackDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('feedback').select('*').eq('id', id).maybeSingle();
      if (error) setError(error.message);
      else if (data) setFeedback(data as Feedback);
      else setError('Feedback not found');

      const { data: respData } = await supabase
        .from('feedback_responses')
        .select('*')
        .eq('feedback_id', id)
        .order('created_at', { ascending: true });
      if (respData) setResponses(respData as FeedbackResponse[]);

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <LoadingIndicator />;
  if (error || !feedback) return <ErrorState message={error ?? 'Not found'} onRetry={() => router.back()} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statusRow}>
          <StatusBadge
            label={feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
            color={feedback.status === 'open' ? 'warning' : feedback.status === 'responded' ? 'success' : 'neutral'}
          />
          <StatusBadge label={feedbackTypeLabels[feedback.type]} color="primary" />
        </View>
        <Text style={styles.title}>{feedback.subject}</Text>
        <Text style={styles.date}>Submitted {formatRelative(feedback.created_at)}</Text>

        {feedback.rating ? (
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={18}
                color={star <= feedback.rating! ? colors.accent[500] : colors.neutral[200]}
                fill={star <= feedback.rating! ? colors.accent[500] : 'none'}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message</Text>
          <Text style={styles.description}>{feedback.message}</Text>
        </View>

        {feedback.photo_url ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attached Photo</Text>
            <Image source={{ uri: feedback.photo_url}} style={styles.photo} />
          </View>
        ) : null}

        {feedback.category ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <Text style={styles.infoText}>{feedback.category}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responses ({responses.length})</Text>
          {responses.length > 0 ? (
            <View style={styles.responseList}>
              {responses.map((resp) => (
                <View key={resp.id} style={styles.responseCard}>
                  <View style={styles.responseHeader}>
                    <MessageSquare size={16} color={colors.primary[600]} />
                    <Text style={styles.responseTime}>{formatDateTime(resp.created_at)}</Text>
                  </View>
                  <Text style={styles.responseText}>{resp.message}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No responses yet. Staff will respond soon.</Text>
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
  starsRow: { flexDirection: 'row', gap: 4, marginTop: spacing.sm },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.neutral[900], marginBottom: spacing.sm },
  description: { fontSize: 15, color: colors.neutral[600], lineHeight: 22 },
  photo: { width: '100%', height: 200, borderRadius: radius.md },
  infoText: { fontSize: 15, color: colors.neutral[700], textTransform: 'capitalize' },
  responseList: { gap: spacing.md },
  responseCard: { backgroundColor: colors.primary[50], borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.primary[100] },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  responseTime: { fontSize: 13, color: colors.neutral[400] },
  responseText: { fontSize: 14, color: colors.neutral[700], lineHeight: 20 },
  emptyText: { fontSize: 14, color: colors.neutral[400] },
});

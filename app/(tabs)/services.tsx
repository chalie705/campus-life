import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench, MessageSquare, AlertTriangle, Plus, Phone, Clock, MapPin, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, radius } from '@/lib/theme';
import { formatRelative, statusLabels, statusColors } from '@/lib/utils';
import type { ServiceRequest, EmergencyContact, Feedback } from '@/types/database';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/Card';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { EmptyState } from '@/components/EmptyState';

type ServiceTab = 'requests' | 'feedback' | 'emergency';

export default function ServicesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [tab, setTab] = useState<ServiceTab>('requests');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [emergency, setEmergency] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!session?.user) return;
      setLoading(true);
      const [reqRes, fbRes, emRes] = await Promise.all([
        supabase
          .from('service_requests')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('feedback')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase.from('emergency_contacts').select('*'),
      ]);
      if (reqRes.data) setRequests(reqRes.data as ServiceRequest[]);
      if (fbRes.data) setFeedback(fbRes.data as Feedback[]);
      if (emRes.data) setEmergency(emRes.data as EmergencyContact[]);
      setLoading(false);
    }
    loadData();
  }, [session]);

  const callPhone = (phone: string) => {
    if (Platform.OS === 'web') {
      window.open(`tel:${phone}`);
    } else {
      Linking.openURL(`tel:${phone}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <TouchableOpacity
          onPress={() => {
            if (tab === 'requests') router.push('/new-request' as never);
            else if (tab === 'feedback') router.push('/new-feedback' as never);
          }}
          style={styles.addButton}
        >
          <Plus size={22} color={colors.neutral[0]} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <ServiceTabBtn
          label="My Requests"
          icon={Wrench}
          active={tab === 'requests'}
          onPress={() => setTab('requests')}
          count={requests.length}
        />
        <ServiceTabBtn
          label="My Feedback"
          icon={MessageSquare}
          active={tab === 'feedback'}
          onPress={() => setTab('feedback')}
          count={feedback.length}
        />
        <ServiceTabBtn
          label="Emergency"
          icon={AlertTriangle}
          active={tab === 'emergency'}
          onPress={() => setTab('emergency')}
        />
      </View>

      {loading ? (
        <LoadingIndicator />
      ) : tab === 'requests' ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/request/${item.id}` as never)} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <StatusBadge label={statusLabels[item.status]} color={statusColors[item.status] as never} />
                <Text style={styles.requestDate}>{formatRelative(item.created_at)}</Text>
              </View>
              <Text style={styles.requestTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.requestDesc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.requestFooter}>
                <Text style={styles.requestCategory}>{item.category}</Text>
                <ChevronRight size={18} color={colors.neutral[300]} />
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Wrench}
              title="No service requests"
              message="Tap + to submit a new request."
              action={
                <TouchableOpacity
                  onPress={() => router.push('/new-request' as never)}
                  style={styles.emptyAction}
                >
                  <Text style={styles.emptyActionText}>New Request</Text>
                </TouchableOpacity>
              }
            />
          }
        />
      ) : tab === 'feedback' ? (
        <FlatList
          data={feedback}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/feedback/${item.id}` as never)} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <StatusBadge
                  label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  color={item.status === 'open' ? 'warning' : item.status === 'responded' ? 'success' : 'neutral'}
                />
                <Text style={styles.requestDate}>{formatRelative(item.created_at)}</Text>
              </View>
              <Text style={styles.requestTitle} numberOfLines={1}>{item.subject}</Text>
              <Text style={styles.requestDesc} numberOfLines={2}>{item.message}</Text>
              <View style={styles.requestFooter}>
                <Text style={styles.requestCategory}>{item.type}</Text>
                <ChevronRight size={18} color={colors.neutral[300]} />
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={MessageSquare}
              title="No feedback submitted"
              message="Tap + to share your feedback."
              action={
                <TouchableOpacity
                  onPress={() => router.push('/new-feedback' as never)}
                  style={styles.emptyAction}
                >
                  <Text style={styles.emptyActionText}>Submit Feedback</Text>
                </TouchableOpacity>
              }
            />
          }
        />
      ) : (
        <FlatList
          data={emergency}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.emergencyCard}>
              <View style={styles.emergencyHeader}>
                <View style={styles.emergencyInfo}>
                  <View style={styles.emergencyIconWrap}>
                    <Phone size={20} color={colors.error[600]} />
                  </View>
                  <View>
                    <Text style={styles.emergencyName}>{item.name}</Text>
                    <Text style={styles.emergencyPhone}>{item.phone}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => callPhone(item.phone)}
                  style={styles.callBtn}
                  activeOpacity={0.8}
                >
                  <Phone size={20} color={colors.neutral[0]} />
                </TouchableOpacity>
              </View>
              {item.description ? (
                <Text style={styles.emergencyDesc}>{item.description}</Text>
              ) : null}
              <View style={styles.emergencyMeta}>
                {item.available_24h ? (
                  <View style={styles.emergencyMetaItem}>
                    <Clock size={13} color={colors.success[600]} />
                    <Text style={[styles.emergencyMetaText, { color: colors.success[600] }]}>24/7</Text>
                  </View>
                ) : null}
                {item.location ? (
                  <View style={styles.emergencyMetaItem}>
                    <MapPin size={13} color={colors.neutral[400]} />
                    <Text style={styles.emergencyMetaText}>{item.location}</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          )}
          ListEmptyComponent={<EmptyState icon={AlertTriangle} title="No emergency contacts" />}
        />
      )}
    </SafeAreaView>
  );
}

function ServiceTabBtn({
  label,
  icon: Icon,
  active,
  onPress,
  count,
}: {
  label: string;
  icon: typeof Wrench;
  active: boolean;
  onPress: () => void;
  count?: number;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.serviceTab, active && styles.serviceTabActive]} activeOpacity={0.7}>
      <Icon size={18} color={active ? colors.neutral[0] : colors.neutral[500]} />
      <Text style={[styles.serviceTabText, active && styles.serviceTabTextActive]}>{label}</Text>
      {count != null ? (
        <View style={[styles.serviceCount, active ? styles.serviceCountActive : null]}>
          <Text style={[styles.serviceCountText, active && styles.serviceCountTextActive]}>{count}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  serviceTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
  },
  serviceTabActive: {
    backgroundColor: colors.primary[600],
  },
  serviceTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  serviceTabTextActive: {
    color: colors.neutral[0],
  },
  serviceCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  serviceCountActive: {
    backgroundColor: colors.neutral[0],
  },
  serviceCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  serviceCountTextActive: {
    color: colors.primary[700],
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  requestCard: {
    gap: spacing.xs,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestDate: {
    fontSize: 13,
    color: colors.neutral[400],
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  requestDesc: {
    fontSize: 14,
    color: colors.neutral[500],
    lineHeight: 19,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  requestCategory: {
    fontSize: 13,
    color: colors.neutral[400],
    textTransform: 'capitalize',
  },
  emptyAction: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.primary[600],
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[0],
  },
  // Emergency
  emergencyCard: {
    gap: spacing.sm,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emergencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  emergencyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  emergencyPhone: {
    fontSize: 15,
    color: colors.neutral[500],
    marginTop: 2,
  },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyDesc: {
    fontSize: 14,
    color: colors.neutral[500],
    lineHeight: 19,
  },
  emergencyMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  emergencyMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emergencyMetaText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[400],
  },
});

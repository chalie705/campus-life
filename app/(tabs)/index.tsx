import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, FlatList, Dimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Bell, AlertTriangle, Wrench, MessageSquare, Map, ChevronRight, GraduationCap } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@/lib/hooks';
import { colors, spacing, radius } from '@/lib/theme';
import { isFacilityOpen, formatUpcoming } from '@/lib/utils';
import type { Announcement, CampusEvent, Club, Facility } from '@/types/database';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { EventCard } from '@/components/EventCard';
import { ClubCard } from '@/components/ClubCard';
import { FacilityCard } from '@/components/FacilityCard';
import { SectionHeader } from '@/components/SectionHeader';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

const { width } = Dimensions.get('window');

const quickActions = [
  { icon: AlertTriangle, label: 'Emergency', color: colors.error[600], bg: colors.error[50], route: '/(tabs)/services' },
  { icon: Wrench, label: 'Request', color: colors.accent[600], bg: colors.accent[50], route: '/new-request' },
  { icon: MessageSquare, label: 'Feedback', color: colors.secondary[600], bg: colors.secondary[50], route: '/new-feedback' },
  { icon: Map, label: 'Campus Map', color: colors.primary[600], bg: colors.primary[50], route: '/(tabs)/explore' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const announcements = useQuery<Announcement[]>(async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6);
    return { data, error };
  });

  const events = useQuery<CampusEvent[]>(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(6);
    return { data, error };
  });

  const clubs = useQuery<Club[]>(async () => {
    const { data, error } = await supabase.from('clubs').select('*').limit(4);
    return { data, error };
  });

  const facilities = useQuery<Facility[]>(async () => {
    const { data, error } = await supabase.from('facilities').select('*').limit(6);
    return { data, error };
  });

  useEffect(() => {
    async function fetchUnread() {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    }
    fetchUnread();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      announcements.refetch(),
      events.refetch(),
      clubs.refetch(),
      facilities.refetch(),
    ]);
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[600]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <GraduationCap size={28} color={colors.neutral[0]} strokeWidth={1.5} />
            </View>
            <View>
              <Text style={styles.uniName}>Campus Life</Text>
              <Text style={styles.greeting}>
                {greeting()}, {profile?.full_name?.split(' ')[0] || 'Student'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.bellWrap}
          >
            <Bell size={22} color={colors.neutral[700]} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} activeOpacity={0.8}>
          <View style={styles.searchBar}>
            <Search size={20} color={colors.neutral[400]} />
            <Text style={styles.searchPlaceholder}>Search campus...</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.label}
                style={styles.quickAction}
                onPress={() => router.push(action.route as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickIcon, { backgroundColor: action.bg }]}>
                  <Icon size={24} color={action.color} />
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Priority Announcements */}
        <View style={styles.section}>
          <SectionHeader title="Announcements" onViewAll={() => router.push('/announcement/[id]' as never)} />
          {announcements.loading ? (
            <LoadingIndicator />
          ) : announcements.error ? (
            <ErrorState message={announcements.error} onRetry={announcements.refetch} />
          ) : announcements.data && announcements.data.length > 0 ? (
            <FlatList
              data={announcements.data}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={{ marginRight: spacing.md }}>
                  <AnnouncementCard
                    announcement={item}
                    onPress={() => router.push(`/announcement/${item.id}` as never)}
                    compact
                  />
                </View>
              )}
            />
          ) : (
            <EmptyState icon={Search} title="No announcements yet" message="Check back later for updates." />
          )}
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <SectionHeader title="Upcoming Events" onViewAll={() => router.push('/event/[id]' as never)} />
          {events.loading ? (
            <LoadingIndicator />
          ) : events.error ? (
            <ErrorState message={events.error} onRetry={events.refetch} />
          ) : events.data && events.data.length > 0 ? (
            <FlatList
              data={events.data}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={{ marginRight: spacing.md }}>
                  <EventCard event={item} onPress={() => router.push(`/event/${item.id}` as never)} compact />
                </View>
              )}
            />
          ) : (
            <EmptyState icon={Search} title="No upcoming events" />
          )}
        </View>

        {/* Featured Clubs */}
        <View style={styles.section}>
          <SectionHeader title="Featured Clubs" onViewAll={() => router.push('/club/[id]' as never)} />
          {clubs.loading ? (
            <LoadingIndicator />
          ) : clubs.data && clubs.data.length > 0 ? (
            <FlatList
              data={clubs.data}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={{ width: 260, marginRight: spacing.md }}>
                  <ClubCard club={item} onPress={() => router.push(`/club/${item.id}` as never)} />
                </View>
              )}
            />
          ) : (
            <EmptyState icon={Search} title="No clubs available" />
          )}
        </View>

        {/* Open Now Facilities */}
        <View style={styles.section}>
          <SectionHeader title="Open Now" />
          {facilities.loading ? (
            <LoadingIndicator />
          ) : facilities.data && facilities.data.length > 0 ? (
            <View style={styles.facilityList}>
              {facilities.data
                .filter((f) => isFacilityOpen(f))
                .slice(0, 3)
                .map((facility) => (
                  <FacilityCard
                    key={facility.id}
                    facility={facility}
                    onPress={() => router.push(`/facility/${facility.id}` as never)}
                  />
                ))}
            </View>
          ) : (
            <EmptyState icon={Search} title="No facilities available" />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  uniName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  greeting: {
    fontSize: 14,
    color: colors.neutral[500],
    marginTop: 2,
  },
  bellWrap: {
    padding: spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error[600],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[0],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  searchPlaceholder: {
    fontSize: 16,
    color: colors.neutral[400],
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  section: {
    marginBottom: spacing.xl,
  },
  facilityList: {
    gap: spacing.md,
  },
});

import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell, Settings, LogOut, ChevronRight, Calendar, Users, Wrench, MessageSquare, Search, CheckCheck,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, radius } from '@/lib/theme';
import { formatRelative } from '@/lib/utils';
import type { Notification as Notif, NotificationType } from '@/types/database';
import { ProfileHeader } from '@/components/ProfileHeader';
import { NotificationCard } from '@/components/NotificationCard';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { FilterChips } from '@/components/FilterChips';
import { SearchBar } from '@/components/SearchBar';

const notifFilters = [
  { label: 'All', value: 'all' },
  { label: 'Announcements', value: 'announcement' },
  { label: 'Events', value: 'event' },
  { label: 'Requests', value: 'service_request' },
  { label: 'Feedback', value: 'feedback' },
  { label: 'Alerts', value: 'alert' },
  { label: 'Account', value: 'account' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { session, profile, signOut, refreshProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    if (!session?.user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data as Notif[]) ?? []);
    setLoading(false);
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  }

  async function markAllRead() {
    if (!session?.user) return;
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unread.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const filteredNotifs = notifications.filter((n) => {
    const matchesFilter = filter === 'all' || n.type === filter;
    const matchesSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const myStats = [
    { icon: Calendar, label: 'My Events', route: '/event/[id]', count: 0 },
    { icon: Users, label: 'My Clubs', route: '/club/[id]', count: 0 },
    { icon: Wrench, label: 'My Requests', route: '/request/[id]', count: 0 },
    { icon: MessageSquare, label: 'My Feedback', route: '/feedback/[id]', count: 0 },
  ];

  const accountItems = [
    { icon: Bell, label: 'Notifications', color: colors.primary[600], bg: colors.primary[50], route: null },
    { icon: Settings, label: 'Settings', color: colors.neutral[600], bg: colors.neutral[100], route: '/settings' },
    { icon: Search, label: 'Help & Support', color: colors.secondary[600], bg: colors.secondary[50], route: null },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {profile ? <ProfileHeader profile={profile} /> : <LoadingIndicator />}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {myStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <TouchableOpacity
                key={stat.label}
                style={styles.statItem}
                onPress={() => router.push(stat.route as never)}
                activeOpacity={0.7}
              >
                <View style={styles.statIcon}>
                  <Icon size={22} color={colors.primary[600]} />
                </View>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notifications section */}
        <View style={styles.section}>
          <View style={styles.notifHeader}>
            <View style={styles.notifTitleWrap}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              {unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
              <CheckCheck size={16} color={colors.primary[600]} />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.notifSearch}>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Search notifications..." />
          </View>

          <View style={styles.notifFilterRow}>
            <FilterChips
              options={notifFilters}
              selected={filter}
              onSelect={setFilter}
            />
          </View>

          {loading ? (
            <LoadingIndicator />
          ) : filteredNotifs.length > 0 ? (
            <View style={styles.notifList}>
              {filteredNotifs.slice(0, 10).map((notif) => (
                <NotificationCard
                  key={notif.id}
                  notification={notif}
                  onPress={() => {
                    if (!notif.is_read) markAsRead(notif.id);
                    router.push(`/notification/${notif.id}` as never);
                  }}
                />
              ))}
            </View>
          ) : (
            <EmptyState icon={Bell} title="No notifications" message="You're all caught up!" />
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuList}>
            {accountItems.map((item) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={styles.menuItem}
                  onPress={() => item.route && router.push(item.route as never)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                    <Icon size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <ChevronRight size={18} color={colors.neutral[300]} />
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/edit-profile' as never)}
              activeOpacity={0.6}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary[50] }]}>
                <Settings size={20} color={colors.secondary[600]} />
              </View>
              <Text style={styles.menuLabel}>Edit Profile</Text>
              <ChevronRight size={18} color={colors.neutral[300]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={() => setShowLogout(true)}
              activeOpacity={0.6}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.error[50] }]}>
                <LogOut size={20} color={colors.error[600]} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.error[600] }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ConfirmationDialog
        visible={showLogout}
        title="Logout"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Logout"
        danger
        onConfirm={() => {
          setShowLogout(false);
          signOut();
        }}
        onCancel={() => setShowLogout(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
    textAlign: 'center',
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing.sm,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  notifTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error[600],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[0],
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[600],
  },
  notifSearch: {
    marginBottom: spacing.sm,
  },
  notifFilterRow: {
    marginBottom: spacing.sm,
  },
  notifList: {
    gap: spacing.md,
  },
  // Menu
  menuList: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
    borderRadius: radius.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  logoutItem: {
    marginTop: 2,
  },
});

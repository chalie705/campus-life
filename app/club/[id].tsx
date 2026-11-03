import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, MapPin, Calendar, ArrowLeft, UserPlus, UserCheck } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, radius } from '@/lib/theme';
import type { Club } from '@/types/database';
import { CustomButton } from '@/components/CustomButton';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('clubs').select('*').eq('id', id).maybeSingle();
      if (error) setError(error.message);
      else if (data) setClub(data as Club);
      else setError('Club not found');

      const { count } = await supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', id);
      setMemberCount(count ?? 0);

      if (session?.user) {
        const { data: memberData } = await supabase
          .from('club_members')
          .select('id')
          .eq('club_id', id)
          .eq('user_id', session.user.id)
          .maybeSingle();
        setIsMember(!!memberData);
      }
      setLoading(false);
    }
    load();
  }, [id, session]);

  async function toggleMembership() {
    if (!session?.user) return;
    setJoining(true);
    if (isMember) {
      await supabase.from('club_members').delete().eq('club_id', id).eq('user_id', session.user.id);
      setIsMember(false);
      setMemberCount((c) => Math.max(0, c - 1));
    } else {
      await supabase
        .from('club_members')
        .insert({ club_id: id, user_id: session.user.id, role: 'member' });
      setIsMember(true);
      setMemberCount((c) => c + 1);
    }
    setJoining(false);
  }

  if (loading) return <LoadingIndicator />;
  if (error || !club) return <ErrorState message={error ?? 'Not found'} onRetry={() => router.back()} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          {club.logo_url ? (
            <Image source={{ uri: club.logo_url }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.logoFallback]}>
              <Text style={styles.logoText}>{club.name.slice(0, 2).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.category}>{club.category.toUpperCase()}</Text>
            <Text style={styles.name}>{club.name}</Text>
            <Text style={styles.memberCount}>{memberCount} members</Text>
          </View>
        </View>

        <CustomButton
          label={isMember ? 'Leave Club' : 'Join Club'}
          variant={isMember ? 'outline' : 'primary'}
          size="lg"
          fullWidth
          onPress={toggleMembership}
          loading={joining}
          icon={isMember ? <UserCheck size={18} color={colors.neutral[700]} /> : <UserPlus size={18} color={colors.neutral[0]} />}
        />

        {club.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{club.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Info</Text>
          {club.meeting_day ? (
            <View style={styles.infoItem}>
              <Calendar size={18} color={colors.primary[600]} />
              <Text style={styles.infoText}>Every {club.meeting_day}</Text>
            </View>
          ) : null}
          {club.meeting_time ? (
            <View style={styles.infoItem}>
              <Users size={18} color={colors.primary[600]} />
              <Text style={styles.infoText}>At {club.meeting_time}</Text>
            </View>
          ) : null}
          {club.location ? (
            <View style={styles.infoItem}>
              <MapPin size={18} color={colors.primary[600]} />
              <Text style={styles.infoText}>{club.location}</Text>
            </View>
          ) : null}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  logo: { width: 72, height: 72, borderRadius: 18 },
  logoFallback: { backgroundColor: colors.primary[600], alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 26, fontWeight: '800', color: colors.neutral[0] },
  headerInfo: { flex: 1 },
  category: { fontSize: 12, fontWeight: '700', color: colors.primary[600], letterSpacing: 0.5 },
  name: { fontSize: 24, fontWeight: '800', color: colors.neutral[900], marginTop: 4 },
  memberCount: { fontSize: 14, color: colors.neutral[500], marginTop: 2 },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.neutral[900], marginBottom: spacing.sm },
  description: { fontSize: 15, color: colors.neutral[600], lineHeight: 22 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  infoText: { fontSize: 15, color: colors.neutral[700] },
});

import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, Phone, ArrowLeft, Navigation } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/lib/theme';
import { isFacilityOpen } from '@/lib/utils';
import type { Facility } from '@/types/database';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';

export default function FacilityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('facilities').select('*').eq('id', id).maybeSingle();
      if (error) setError(error.message);
      else if (data) setFacility(data as Facility);
      else setError('Facility not found');
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <LoadingIndicator />;
  if (error || !facility) return <ErrorState message={error ?? 'Not found'} onRetry={() => router.back()} />;

  const open = isFacilityOpen(facility);

  const callPhone = () => {
    if (facility.phone) {
      const url = Platform.OS === 'web' ? `tel:${facility.phone}` : `tel:${facility.phone}`;
      Linking.openURL(url);
    }
  };

  const getDirections = () => {
    if (facility.latitude && facility.longitude) {
      const url = Platform.OS === 'web'
        ? `https://maps.google.com/?q=${facility.latitude},${facility.longitude}`
        : `maps://?q=${facility.latitude},${facility.longitude}`;
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {facility.image_url ? (
          <Image source={{ uri: facility.image_url }} style={styles.image} />
        ) : null}

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.category}>{facility.category.toUpperCase()}</Text>
            <Text style={styles.name}>{facility.name}</Text>
          </View>
          <View style={[styles.statusBadge, open ? styles.openBadge : styles.closedBadge]}>
            <View style={[styles.statusDot, open ? styles.dotOpen : styles.dotClosed]} />
            <Text style={[styles.statusText, open ? styles.openText : styles.closedText]}>
              {open ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        {facility.description ? (
          <Text style={styles.description}>{facility.description}</Text>
        ) : null}

        <View style={styles.infoList}>
          {facility.building ? (
            <View style={styles.infoItem}>
              <MapPin size={18} color={colors.primary[600]} />
              <View>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>
                  {facility.building}{facility.floor ? `, Floor ${facility.floor}` : ''}
                </Text>
              </View>
            </View>
          ) : null}
          {facility.opening_time ? (
            <View style={styles.infoItem}>
              <Clock size={18} color={colors.primary[600]} />
              <View>
                <Text style={styles.infoLabel}>Hours</Text>
                <Text style={styles.infoValue}>
                  {facility.opening_time.slice(0, 5)} - {facility.closing_time?.slice(0, 5)}
                  {facility.is_open_weekends ? ' (Open weekends)' : ' (Weekdays only)'}
                </Text>
              </View>
            </View>
          ) : null}
          {facility.phone ? (
            <View style={styles.infoItem}>
              <Phone size={18} color={colors.primary[600]} />
              <View>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{facility.phone}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          {facility.phone ? (
            <TouchableOpacity onPress={callPhone} style={styles.actionBtn} activeOpacity={0.8}>
              <Phone size={20} color={colors.neutral[0]} />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
          ) : null}
          {facility.latitude ? (
            <TouchableOpacity onPress={getDirections} style={[styles.actionBtn, styles.directionBtn]} activeOpacity={0.8}>
              <Navigation size={20} color={colors.neutral[0]} />
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>
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
  image: { width: '100%', height: 220, borderRadius: radius.lg, marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  category: { fontSize: 12, fontWeight: '700', color: colors.primary[600], letterSpacing: 0.5 },
  name: { fontSize: 24, fontWeight: '800', color: colors.neutral[900], marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  openBadge: { backgroundColor: colors.success[50] },
  closedBadge: { backgroundColor: colors.error[50] },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotOpen: { backgroundColor: colors.success[500] },
  dotClosed: { backgroundColor: colors.error[500] },
  statusText: { fontSize: 13, fontWeight: '600' },
  openText: { color: colors.success[700] },
  closedText: { color: colors.error[700] },
  description: { fontSize: 15, color: colors.neutral[600], lineHeight: 22, marginTop: spacing.md },
  infoList: { marginTop: spacing.lg, gap: spacing.md },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoLabel: { fontSize: 12, color: colors.neutral[400], fontWeight: '500' },
  infoValue: { fontSize: 15, color: colors.neutral[800], fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary[600], paddingVertical: 14, borderRadius: radius.md },
  directionBtn: { backgroundColor: colors.secondary[600] },
  actionText: { fontSize: 15, fontWeight: '600', color: colors.neutral[0] },
});

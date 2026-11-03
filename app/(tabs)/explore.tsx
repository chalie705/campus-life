import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, List, LayoutGrid, Navigation } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/lib/theme';
import { isFacilityOpen } from '@/lib/utils';
import type { Facility, Club } from '@/types/database';
import { SearchBar } from '@/components/SearchBar';
import { FilterChips } from '@/components/FilterChips';
import { FacilityCard } from '@/components/FacilityCard';
import { ClubCard } from '@/components/ClubCard';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

const facilityCategories = [
  { label: 'All', value: 'all' },
  { label: 'Library', value: 'library' },
  { label: 'Cafeteria', value: 'cafeteria' },
  { label: 'Health', value: 'health' },
  { label: 'Lab', value: 'laboratory' },
  { label: 'Sports', value: 'sports' },
  { label: 'Admin', value: 'administration' },
  { label: 'Emergency', value: 'emergency' },
];

const clubCategories = [
  { label: 'All', value: 'all' },
  { label: 'Technology', value: 'technology' },
  { label: 'Academic', value: 'academic' },
  { label: 'Arts', value: 'arts' },
  { label: 'Sports', value: 'sports' },
  { label: 'Community', value: 'community' },
  { label: 'Cultural', value: 'cultural' },
];

type ViewMode = 'directory' | 'map';
type Tab = 'facilities' | 'clubs';

export default function ExploreScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('facilities');
  const [search, setSearch] = useState('');
  const [facilityCategory, setFacilityCategory] = useState('all');
  const [clubCategory, setClubCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('directory');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      const [facRes, clubRes] = await Promise.all([
        supabase.from('facilities').select('*'),
        supabase.from('clubs').select('*'),
      ]);
      if (facRes.error || clubRes.error) {
        setError(facRes.error?.message || clubRes.error?.message || 'Failed to load data');
      } else {
        setFacilities(facRes.data as Facility[]);
        setClubs(clubRes.data as Club[]);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch =
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = facilityCategory === 'all' || f.category === facilityCategory;
      return matchesSearch && matchesCategory;
    });
  }, [facilities, search, facilityCategory]);

  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = clubCategory === 'all' || c.category === clubCategory;
      return matchesSearch && matchesCategory;
    });
  }, [clubs, search, clubCategory]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Campus</Text>
        {tab === 'facilities' ? (
          <View style={styles.viewToggle}>
            <TouchableOpacity
              onPress={() => setViewMode('directory')}
              style={[styles.toggleBtn, viewMode === 'directory' && styles.toggleActive]}
            >
              <List size={18} color={viewMode === 'directory' ? colors.neutral[0] : colors.neutral[500]} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('map')}
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleActive]}
            >
              <MapPin size={18} color={viewMode === 'map' ? colors.neutral[0] : colors.neutral[500]} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={tab === 'facilities' ? 'Search facilities...' : 'Search clubs...'}
        />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setTab('facilities')}
          style={[styles.tab, tab === 'facilities' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'facilities' && styles.tabTextActive]}>Facilities</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('clubs')}
          style={[styles.tab, tab === 'clubs' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'clubs' && styles.tabTextActive]}>Clubs</Text>
        </TouchableOpacity>
      </View>

      {tab === 'facilities' ? (
        <View style={styles.chipsWrap}>
          <FilterChips
            options={facilityCategories}
            selected={facilityCategory}
            onSelect={setFacilityCategory}
          />
        </View>
      ) : (
        <View style={styles.chipsWrap}>
          <FilterChips options={clubCategories} selected={clubCategory} onSelect={setClubCategory} />
        </View>
      )}

      {loading ? (
        <LoadingIndicator />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <View style={styles.content}>
          {tab === 'facilities' ? (
            viewMode === 'directory' ? (
              <FlatList
                data={filteredFacilities}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <FacilityCard
                    facility={item}
                    onPress={() => router.push(`/facility/${item.id}` as never)}
                  />
                )}
                ListEmptyComponent={
                  <EmptyState
                    icon={MapPin}
                    title="No facilities found"
                    message="Try adjusting your search or filters."
                  />
                }
              />
            ) : (
              <FacilityMap facilities={filteredFacilities} onSelect={(id) => router.push(`/facility/${id}` as never)} />
            )
          ) : (
            <FlatList
              data={filteredClubs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <ClubCard club={item} onPress={() => router.push(`/club/${item.id}` as never)} />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon={LayoutGrid}
                  title="No clubs found"
                  message="Try adjusting your search or filters."
                />
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function FacilityMap({
  facilities,
  onSelect,
}: {
  facilities: Facility[];
  onSelect: (id: string) => void;
}) {
  const openFacilities = facilities.filter((f) => isFacilityOpen(f));
  return (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapPinWrap}>
          <MapPin size={64} color={colors.primary[600]} strokeWidth={1.5} />
          <Text style={styles.mapTitle}>Campus Map</Text>
          <Text style={styles.mapSubtitle}>
            {facilities.length} facilities • {openFacilities.length} open now
          </Text>
        </View>
      </View>
      <View style={styles.mapList}>
        <FlatList
          data={facilities}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mapScrollList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelect(item.id)}
              style={[
                styles.mapCard,
                isFacilityOpen(item) ? styles.mapCardOpen : styles.mapCardClosed,
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.mapCardLeft}>
                <Text style={styles.mapCardName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.mapCardMeta}>
                  <View
                    style={[
                      styles.mapDot,
                      isFacilityOpen(item) ? styles.mapDotOpen : styles.mapDotClosed,
                    ]}
                  />
                  <Text style={styles.mapCardStatus}>{isFacilityOpen(item) ? 'Open' : 'Closed'}</Text>
                  {item.building ? <Text style={styles.mapCardBuilding}>• {item.building}</Text> : null}
                </View>
              </View>
              <Navigation size={18} color={colors.primary[600]} />
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[200],
    borderRadius: radius.sm,
    padding: 2,
  },
  toggleBtn: {
    padding: 8,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: colors.primary[600],
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
  },
  tabActive: {
    backgroundColor: colors.primary[600],
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  tabTextActive: {
    color: colors.neutral[0],
  },
  chipsWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  // Map view
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  mapPinWrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  mapTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[700],
    marginTop: spacing.sm,
  },
  mapSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  mapList: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? spacing.lg : spacing.xl,
    left: 0,
    right: 0,
  },
  mapScrollList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minWidth: 280,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapCardOpen: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success[500],
  },
  mapCardClosed: {
    borderLeftWidth: 3,
    borderLeftColor: colors.error[400],
  },
  mapCardLeft: {
    flex: 1,
  },
  mapCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  mapCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mapDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mapDotOpen: {
    backgroundColor: colors.success[500],
  },
  mapDotClosed: {
    backgroundColor: colors.error[400],
  },
  mapCardStatus: {
    fontSize: 13,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  mapCardBuilding: {
    fontSize: 13,
    color: colors.neutral[400],
  },
});

import { Image, StyleSheet, Text, View } from 'react-native';
import { MapPin, Clock, Phone, ChevronRight } from 'lucide-react-native';
import { Card } from './Card';
import { colors, spacing } from '@/lib/theme';
import { isFacilityOpen } from '@/lib/utils';
import type { Facility } from '@/types/database';

interface FacilityCardProps {
  facility: Facility;
  onPress: () => void;
}

const categoryIcons: Record<string, string> = {
  library: 'Library',
  cafeteria: 'Coffee',
  health: 'HeartPulse',
  laboratory: 'FlaskConical',
  sports: 'Dumbbell',
  administration: 'Building2',
  emergency: 'ShieldAlert',
};

export function FacilityCard({ facility, onPress }: FacilityCardProps) {
  const open = isFacilityOpen(facility);

  return (
    <Card onPress={onPress}>
      <View style={styles.content}>
        {facility.image_url ? (
          <Image source={{ uri: facility.image_url }} style={styles.image} />
        ) : null}
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.category}>{facility.category}</Text>
            <View style={[styles.status, open ? styles.open : styles.closed]}>
              <View style={[styles.statusDot, open ? styles.dotOpen : styles.dotClosed]} />
              <Text style={[styles.statusText, open ? styles.statusTextOpen : styles.statusTextClosed]}>
                {open ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>{facility.name}</Text>
          {facility.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {facility.description}
            </Text>
          ) : null}
          <View style={styles.meta}>
            {facility.building ? (
              <View style={styles.metaItem}>
                <MapPin size={14} color={colors.neutral[400]} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {facility.building}{facility.floor ? `, Floor ${facility.floor}` : ''}
                </Text>
              </View>
            ) : null}
            {facility.opening_time ? (
              <View style={styles.metaItem}>
                <Clock size={14} color={colors.neutral[400]} />
                <Text style={styles.metaText}>
                  {facility.opening_time.slice(0, 5)} - {facility.closing_time?.slice(0, 5)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <ChevronRight size={20} color={colors.neutral[300]} style={styles.chevron} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[600],
    textTransform: 'capitalize',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  open: {
    backgroundColor: colors.success[50],
  },
  closed: {
    backgroundColor: colors.error[50],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOpen: {
    backgroundColor: colors.success[500],
  },
  dotClosed: {
    backgroundColor: colors.error[500],
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextOpen: {
    color: colors.success[700],
  },
  statusTextClosed: {
    color: colors.error[700],
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  description: {
    fontSize: 13,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  meta: {
    gap: 3,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.neutral[500],
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});

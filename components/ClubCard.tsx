import { Image, StyleSheet, Text, View } from 'react-native';
import { Users, MapPin } from 'lucide-react-native';
import { Card } from './Card';
import { colors, spacing } from '@/lib/theme';
import type { Club } from '@/types/database';

interface ClubCardProps {
  club: Club;
  onPress: () => void;
}

export function ClubCard({ club, onPress }: ClubCardProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        {club.logo_url ? (
          <Image source={{ uri: club.logo_url }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoFallback]}>
            <Text style={styles.logoText}>
              {club.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.category}>{club.category}</Text>
          <Text style={styles.name} numberOfLines={1}>{club.name}</Text>
        </View>
        {club.is_member ? (
          <View style={styles.memberBadge}>
            <Text style={styles.memberText}>Joined</Text>
          </View>
        ) : null}
      </View>
      {club.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {club.description}
        </Text>
      ) : null}
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Users size={14} color={colors.neutral[400]} />
          <Text style={styles.metaText}>
            {club.member_count != null ? `${club.member_count} members` : 'Members'}
          </Text>
        </View>
        {club.location ? (
          <View style={styles.metaItem}>
            <MapPin size={14} color={colors.neutral[400]} />
            <Text style={styles.metaText} numberOfLines={1}>{club.location}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  logoFallback: {
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[0],
  },
  headerInfo: {
    flex: 1,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[600],
    textTransform: 'capitalize',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 2,
  },
  memberBadge: {
    backgroundColor: colors.success[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  memberText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success[700],
  },
  description: {
    fontSize: 14,
    color: colors.neutral[500],
    lineHeight: 19,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.neutral[400],
  },
});

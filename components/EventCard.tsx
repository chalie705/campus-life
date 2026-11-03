import { Image, StyleSheet, Text, View } from 'react-native';
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react-native';
import { Card } from './Card';
import { colors, spacing } from '@/lib/theme';
import { formatUpcoming, formatTime } from '@/lib/utils';
import type { CampusEvent } from '@/types/database';

interface EventCardProps {
  event: CampusEvent;
  onPress: () => void;
  rsvpStatus?: string | null;
  compact?: boolean;
}

export function EventCard({ event, onPress, rsvpStatus, compact = false }: EventCardProps) {
  return (
    <Card onPress={onPress} style={[styles.card, compact ? styles.compact : null]}>
      {event.image_url ? (
        <View style={styles.imageWrap}>
          <Image source={{ uri: event.image_url }} style={styles.image} />
          <View style={styles.dateOverlay}>
            <Text style={styles.dateMonth}>
              {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}
            </Text>
            <Text style={styles.dateDay}>
              {new Date(event.start_time).getDate()}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={styles.content}>
        <Text style={styles.category}>{event.category.toUpperCase()}</Text>
        <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
          {event.title}
        </Text>
        {!compact ? (
          <Text style={styles.description} numberOfLines={2}>
            {event.description ?? ''}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={colors.neutral[400]} />
            <Text style={styles.metaText}>{formatUpcoming(event.start_time)}</Text>
          </View>
          <View style={styles.metaItem}>
            <MapPin size={14} color={colors.neutral[400]} />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.location ?? 'TBD'}
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          {rsvpStatus ? (
            <View style={styles.rsvpBadge}>
              <Users size={14} color={colors.primary[700]} />
              <Text style={styles.rsvpText}>{rsvpStatus.charAt(0).toUpperCase() + rsvpStatus.slice(1)}</Text>
            </View>
          ) : (
            <View style={styles.rsvpBadge}>
              <Users size={14} color={colors.neutral[500]} />
              <Text style={styles.rsvpText}>
                {event.rsvp_count ? `${event.rsvp_count} going` : 'No RSVPs yet'}
              </Text>
            </View>
          )}
          <ChevronRight size={18} color={colors.neutral[400]} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  compact: {
    width: 260,
  },
  imageWrap: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 12,
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.neutral[0],
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignItems: 'center',
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[700],
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  content: {
    gap: spacing.xs,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[600],
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    lineHeight: 21,
  },
  description: {
    fontSize: 13,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  meta: {
    gap: 4,
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
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  rsvpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rsvpText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[600],
  },
});

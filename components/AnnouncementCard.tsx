import { Image, StyleSheet, Text, View } from 'react-native';
import { Pin, ChevronRight } from 'lucide-react-native';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { colors, spacing } from '@/lib/theme';
import { formatRelative, announcementPriorityLabels } from '@/lib/utils';
import type { Announcement, AnnouncementPriority } from '@/types/database';

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress: () => void;
  isRead?: boolean;
  compact?: boolean;
}

export function AnnouncementCard({
  announcement,
  onPress,
  isRead = true,
  compact = false,
}: AnnouncementCardProps) {
  const priorityColors: Record<AnnouncementPriority, 'warning' | 'error' | 'neutral'> = {
    normal: 'neutral',
    high: 'warning',
    urgent: 'error',
  };

  return (
    <Card onPress={onPress} style={[styles.card, compact ? styles.compact : null]}>
      {announcement.image_url ? (
        <Image source={{ uri: announcement.image_url }} style={styles.image} />
      ) : null}
      <View style={styles.header}>
        <View style={styles.badges}>
          {announcement.is_pinned ? (
            <View style={styles.pinned}>
              <Pin size={12} color={colors.accent[700]} />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          ) : null}
          {announcement.priority !== 'normal' ? (
            <StatusBadge
              label={announcementPriorityLabels[announcement.priority]}
              color={priorityColors[announcement.priority]}
            />
          ) : null}
        </View>
        {!isRead ? <View style={styles.unreadDot} /> : null}
      </View>
      <Text style={styles.title} numberOfLines={compact ? 2 : 3}>
        {announcement.title}
      </Text>
      {!compact ? (
        <Text style={styles.body} numberOfLines={2}>
          {announcement.body}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.date}>{formatRelative(announcement.created_at)}</Text>
        <ChevronRight size={18} color={colors.neutral[400]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  compact: {
    width: 280,
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  pinned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent[700],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.neutral[900],
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 13,
    color: colors.neutral[400],
  },
});

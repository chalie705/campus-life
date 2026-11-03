import { StyleSheet, Text, View } from 'react-native';
import { Bell, Calendar, Wrench, MessageSquare, AlertTriangle, User } from 'lucide-react-native';
import { Card } from './Card';
import { colors, spacing } from '@/lib/theme';
import { formatRelative } from '@/lib/utils';
import type { Notification as NotificationType, NotificationType as NotifType } from '@/types/database';

interface NotificationCardProps {
  notification: NotificationType;
  onPress: () => void;
}

const iconMap: Record<NotifType, { icon: typeof Bell; color: string }> = {
  announcement: { icon: Bell, color: colors.primary[600] },
  event: { icon: Calendar, color: colors.secondary[600] },
  service_request: { icon: Wrench, color: colors.accent[600] },
  feedback: { icon: MessageSquare, color: colors.success[600] },
  alert: { icon: AlertTriangle, color: colors.error[600] },
  account: { icon: User, color: colors.neutral[600] },
};

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const { icon: Icon, color } = iconMap[notification.type];

  return (
    <Card onPress={onPress} style={[styles.card, !notification.is_read ? styles.unread : null]}>
      <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        {notification.body ? (
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        ) : null}
        <Text style={styles.time}>{formatRelative(notification.created_at)}</Text>
      </View>
      {!notification.is_read ? <View style={styles.dot} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  unread: {
    backgroundColor: colors.primary[50],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  body: {
    fontSize: 14,
    color: colors.neutral[500],
    lineHeight: 19,
  },
  time: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
    marginTop: 6,
  },
});

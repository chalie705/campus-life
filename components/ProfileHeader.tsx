import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';
import type { Profile } from '@/types/database';

interface ProfileHeaderProps {
  profile: Profile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const roleColors: Record<string, string> = {
    student: colors.primary[100],
    faculty: colors.secondary[100],
    staff: colors.accent[100],
    admin: colors.error[100],
    guest: colors.neutral[200],
  };
  const roleTextColors: Record<string, string> = {
    student: colors.primary[700],
    faculty: colors.secondary[700],
    staff: colors.accent[700],
    admin: colors.error[700],
    guest: colors.neutral[600],
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>
              {(profile.full_name || profile.email || '?')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.name}>{profile.full_name || 'Unnamed User'}</Text>
      <View style={[styles.roleBadge, { backgroundColor: roleColors[profile.role] || colors.neutral[100] }]}>
        <Text style={[styles.roleText, { color: roleTextColors[profile.role] || colors.neutral[600] }]}>
          {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
        </Text>
      </View>
      {profile.department ? (
        <Text style={styles.department}>{profile.department.name}</Text>
      ) : null}
      {profile.university_id ? (
        <Text style={styles.uniId}>ID: {profile.university_id}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatarWrap: {},
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarFallback: {
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.neutral[0],
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: spacing.md,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  department: {
    fontSize: 15,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  uniId: {
    fontSize: 13,
    color: colors.neutral[400],
    marginTop: 2,
  },
});

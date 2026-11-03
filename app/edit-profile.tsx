import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, radius } from '@/lib/theme';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import type { Department } from '@/types/database';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [universityId, setUniversityId] = useState(profile?.university_id ?? '');
  const [departmentId, setDepartmentId] = useState<string | null>(profile?.department_id ?? null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('departments').select('*').then(({ data }) => {
      if (data) setDepartments(data as Department[]);
    });
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        university_id: universityId.trim() || null,
        department_id: departmentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
    setSaving(false);
    if (error) setError(error.message);
    else {
      await refreshProfile();
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>
                    {(profile?.full_name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.cameraBtn}>
                    <Camera size={18} color={colors.neutral[0]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.emailText}>{profile?.email}</Text>
          </View>

          <CustomInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            autoCapitalize="words"
            error={error}
          />
          <CustomInput
            label="University ID"
            value={universityId}
            onChangeText={setUniversityId}
            placeholder="e.g. STU2026001"
          />
          <CustomInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1-555-0100"
            keyboardType="phone-pad"
          />
          <CustomInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell others about yourself..."
            multiline
            numberOfLines={3}
          />
          <Text style={styles.label}>Department</Text>
          <View style={styles.deptGrid}>
            {departments.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                onPress={() => setDepartmentId(dept.id === departmentId ? null : dept.id)}
                style={[styles.deptChip, dept.id === departmentId ? styles.deptChipActive : null]}
              >
                <Text style={[styles.deptChipText, dept.id === departmentId ? styles.deptChipTextActive : null]}>
                  {dept.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: spacing.lg }} />
          <CustomButton label="Save Changes" onPress={handleSave} loading={saving} fullWidth size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.sm },
  backBtn: { padding: spacing.sm },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.neutral[900] },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarWrap: { position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { backgroundColor: colors.primary[600], alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 36, fontWeight: '800', color: colors.neutral[0] },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary[700], alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.neutral[0] },
  emailText: { fontSize: 14, color: colors.neutral[400], marginTop: spacing.sm },
  label: { fontSize: 14, fontWeight: '600', color: colors.neutral[700], marginTop: spacing.md, marginBottom: spacing.xs },
  deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  deptChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.neutral[100], borderWidth: 1, borderColor: colors.neutral[200] },
  deptChipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  deptChipText: { fontSize: 13, fontWeight: '600', color: colors.neutral[600] },
  deptChipTextActive: { color: colors.neutral[0] },
});

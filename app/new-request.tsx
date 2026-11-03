import { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, radius } from '@/lib/theme';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import { FilterChips } from '@/components/FilterChips';

const categories = [
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'IT Support', value: 'it' },
  { label: 'Administrative', value: 'administrative' },
  { label: 'Academic', value: 'academic' },
  { label: 'Facilities', value: 'facilities' },
  { label: 'Other', value: 'other' },
];

const priorities = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

export default function NewRequestScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('maintenance');
  const [priority, setPriority] = useState('medium');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in title and description.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from('service_requests').insert({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      location: location.trim() || null,
      user_id: session?.user.id,
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Service Request</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <CustomInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Brief summary of the issue"
            error={error}
          />
          <CustomInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in detail..."
            multiline
            numberOfLines={4}
          />
          <Text style={styles.label}>Category</Text>
          <FilterChips options={categories} selected={category} onSelect={setCategory} />
          <Text style={styles.label}>Priority</Text>
          <FilterChips options={priorities} selected={priority} onSelect={setPriority} />
          <View style={{ height: spacing.md }} />
          <CustomInput
            label="Location (optional)"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Building A, Room 201"
          />
          <View style={styles.photoPlaceholder}>
            <Camera size={24} color={colors.neutral[400]} />
            <Text style={styles.photoText}>Add photo (optional)</Text>
          </View>
          <View style={{ height: spacing.lg }} />
          <CustomButton label="Submit Request" onPress={handleSubmit} loading={submitting} fullWidth size="lg" />
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
  label: { fontSize: 14, fontWeight: '600', color: colors.neutral[700], marginTop: spacing.md, marginBottom: spacing.xs },
  photoPlaceholder: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: colors.neutral[300], borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: spacing.lg, marginTop: spacing.md, backgroundColor: colors.neutral[0] },
  photoText: { fontSize: 14, color: colors.neutral[400] },
});

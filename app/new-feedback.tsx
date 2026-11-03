import { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, radius } from '@/lib/theme';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import { FilterChips } from '@/components/FilterChips';

const types = [
  { label: 'Feedback', value: 'feedback' },
  { label: 'Complaint', value: 'complaint' },
  { label: 'Suggestion', value: 'suggestion' },
];

const categories = [
  { label: 'Academic', value: 'academic' },
  { label: 'Facilities', value: 'facilities' },
  { label: 'Services', value: 'services' },
  { label: 'Staff', value: 'staff' },
  { label: 'Other', value: 'other' },
];

export default function NewFeedbackScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [type, setType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('other');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in subject and message.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from('feedback').insert({
      type,
      subject: subject.trim(),
      message: message.trim(),
      category,
      rating: rating || null,
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
        <Text style={styles.headerTitle}>Submit Feedback</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Type</Text>
          <FilterChips options={types} selected={type} onSelect={setType} />
          <CustomInput
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief subject"
            error={error}
          />
          <CustomInput
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="Share your feedback..."
            multiline
            numberOfLines={5}
          />
          <Text style={styles.label}>Category</Text>
          <FilterChips options={categories} selected={category} onSelect={setCategory} />
          <Text style={styles.label}>Rating (optional)</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star === rating ? 0 : star)}>
                <Star
                  size={32}
                  color={star <= rating ? colors.accent[500] : colors.neutral[300]}
                  fill={star <= rating ? colors.accent[500] : 'none'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.photoPlaceholder}>
            <Camera size={24} color={colors.neutral[400]} />
            <Text style={styles.photoText}>Add photo evidence (optional)</Text>
          </View>
          <View style={{ height: spacing.lg }} />
          <CustomButton label="Submit Feedback" onPress={handleSubmit} loading={submitting} fullWidth size="lg" />
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
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  photoPlaceholder: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: colors.neutral[300], borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: spacing.lg, marginTop: spacing.md, backgroundColor: colors.neutral[0] },
  photoText: { fontSize: 14, color: colors.neutral[400] },
});

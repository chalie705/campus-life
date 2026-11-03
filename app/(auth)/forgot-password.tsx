import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Mail, ArrowLeft, GraduationCap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CustomButton } from '@/components/CustomButton';
import { CustomInput } from '@/components/CustomInput';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/lib/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.neutral[700]} />
          </TouchableOpacity>
          <View style={styles.logoWrap}>
            <GraduationCap size={48} color={colors.neutral[0]} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>We'll send a reset link to your email</Text>
        </View>

        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              Password reset link sent! Check your email and follow the instructions to reset your password.
            </Text>
            <CustomButton
              label="Back to Login"
              variant="primary"
              size="md"
              onPress={() => router.replace('/(auth)/login')}
              fullWidth
            />
          </View>
        ) : (
          <View style={styles.form}>
            <CustomInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@university.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={20} color={colors.neutral[400]} />}
              error={error}
            />
            <CustomButton label="Send Reset Link" onPress={handleReset} loading={loading} fullWidth size="lg" />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: spacing.sm,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: 15,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  form: {
    backgroundColor: colors.neutral[0],
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  successBox: {
    backgroundColor: colors.success[50],
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  successText: {
    fontSize: 15,
    color: colors.success[700],
    lineHeight: 22,
  },
});

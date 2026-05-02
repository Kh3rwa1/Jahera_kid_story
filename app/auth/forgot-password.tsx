import { BORDER_RADIUS, FONT_SIZES, FONTS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { account } from '@/lib/appwrite';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const styles = useStyles();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRecovery = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      Alert.alert('Email required', 'Please enter a valid email address.');
      return;
    }

    try {
      setIsLoading(true);
      const redirectUrl = Linking.createURL('/auth/login');
      await account.createRecovery(normalizedEmail, redirectUrl);

      Alert.alert(
        'Check your inbox',
        'If an account exists for this email, we sent password reset instructions.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch {
      // Privacy-safe: do not reveal whether an account exists.
      Alert.alert(
        'Check your inbox',
        'If an account exists for this email, we sent password reset instructions.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={COLORS.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + SPACING.xl,
              paddingBottom: insets.bottom + SPACING.xl,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backButton,
              { backgroundColor: COLORS.cardBackground },
            ]}
            hitSlop={12}
          >
            <ArrowLeft size={22} color={COLORS.text.primary} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={COLORS.gradients.primary}
                style={styles.iconCircle}
              >
                <Mail size={34} color="#FFFFFF" strokeWidth={2.3} />
              </LinearGradient>
            </View>

            <Text style={[styles.title, { color: COLORS.text.primary }]}>
              Reset Password
            </Text>

            <Text style={[styles.subtitle, { color: COLORS.text.secondary }]}>
              Enter your email and we’ll send instructions to recover your
              account.
            </Text>

            <View
              style={[
                styles.inputGroup,
                {
                  backgroundColor: COLORS.cardBackground,
                  borderColor: COLORS.text.light + '30',
                },
              ]}
            >
              <Mail size={20} color={COLORS.text.light} />
              <TextInput
                style={[styles.input, { color: COLORS.text.primary }]}
                placeholder="Email address"
                placeholderTextColor={COLORS.text.light}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={handleSendRecovery}
              />
            </View>

            <TouchableOpacity
              onPress={handleSendRecovery}
              disabled={isLoading}
              activeOpacity={0.88}
              style={styles.ctaTouchable}
            >
              <LinearGradient
                colors={
                  isLoading
                    ? ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.4)']
                    : COLORS.gradients.primary
                }
                style={styles.ctaButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.ctaText}>Send Reset Link</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        kav: {
          flex: 1,
        },
        scroll: {
          flexGrow: 1,
          paddingHorizontal: SPACING.xl,
        },
        backButton: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.xl,
        },
        content: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: SPACING.lg,
        },
        iconWrap: {
          marginBottom: SPACING.sm,
        },
        iconCircle: {
          width: 88,
          height: 88,
          borderRadius: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          fontSize: 32,
          fontFamily: FONTS.extrabold,
          textAlign: 'center',
          letterSpacing: -0.6,
        },
        subtitle: {
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.medium,
          lineHeight: 22,
          textAlign: 'center',
          maxWidth: 320,
          marginBottom: SPACING.md,
        },
        inputGroup: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: BORDER_RADIUS.xl,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          gap: SPACING.md,
          borderWidth: 1,
        },
        input: {
          flex: 1,
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.medium,
          paddingVertical: SPACING.sm,
        },
        ctaTouchable: {
          width: '100%',
          marginTop: SPACING.sm,
        },
        ctaButton: {
          minHeight: 58,
          borderRadius: BORDER_RADIUS.pill,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: SPACING.xl,
        },
        ctaText: {
          color: '#FFFFFF',
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.bold,
        },
      }),
    [],
  );

import { BrandVideoBackground } from '@/components/BrandVideoBackground';
import { BORDER_RADIUS, FONT_SIZES, FONTS, SPACING } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from 'lucide-react-native';
import { useState } from 'react';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function Register() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const { signUp, signInWithGoogle } = useAuth();
  const C = currentTheme.colors;
  const styles = useStyles();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signUp(email.trim(), password, name.trim() || undefined);
      router.replace('/onboarding/consent');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (
        msg.includes('already registered') ||
        msg.includes('User already registered') ||
        msg.includes('already exists')
      ) {
        setError('An account with this email already exists. Try signing in.');
      } else if (
        msg.includes('Password should be') ||
        msg.includes('password')
      ) {
        setError('Password must be at least 6 characters.');
      } else if (msg.includes('valid email') || msg.includes('email')) {
        setError('Please enter a valid email address.');
      } else if (msg) {
        setError(msg);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <BrandVideoBackground
        videoId="onboarding_video"
        fallbackSource={require('@/assets/jahera.mp4')}
        overlayOpacity={0.25}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={C.primaryDark} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(100).springify()}
            style={styles.hero}
          >
            <View style={[styles.iconCircle, { shadowColor: C.primary }]}>
              <LinearGradient
                colors={[C.primary, C.primaryDark]}
                style={styles.iconGradient}
              >
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 60,
                    borderWidth: 3,
                    borderColor: '#FFFFFF',
                  }}
                  contentFit="cover"
                />
              </LinearGradient>
            </View>
            <Text style={[styles.title, { color: '#FFFFFF' }]}>
              Create account
            </Text>
            <Text style={[styles.subtitle, { color: '#E2E8F0' }]}>
              Start your child's adventure today
            </Text>
          </Animated.View>

          {/* Google Sign Up */}
          <Animated.View entering={FadeInUp.delay(500).springify()}>
            <TouchableOpacity
              style={[styles.googleButton]}
              onPress={async () => {
                try {
                  setIsLoading(true);
                  setError('');
                  await signInWithGoogle();
                  router.replace('/(tabs)');
                } catch (err: unknown) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'Google sign-in failed',
                  );
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <Text style={{ fontSize: 20 }}>G</Text>
                <Text style={styles.googleButtonText}>
                  Continue with Google
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.form}
          >
            <View style={styles.inputGroup}>
              <User size={20} color={C.text.light} strokeWidth={2} />
              <TextInput
                style={[styles.input, { color: C.text.primary }]}
                placeholder="Your name (optional)"
                placeholderTextColor={C.text.light}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Mail size={20} color={C.text.light} strokeWidth={2} />
              <TextInput
                style={[styles.input, { color: C.text.primary }]}
                placeholder="Email address"
                placeholderTextColor={C.text.light}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Lock size={20} color={C.text.light} strokeWidth={2} />
              <TextInput
                style={[styles.input, { color: C.text.primary }]}
                placeholder="Password (6+ characters)"
                placeholderTextColor={C.text.light}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showPassword ? (
                  <EyeOff size={20} color={C.text.light} strokeWidth={2} />
                ) : (
                  <Eye size={20} color={C.text.light} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>

            {error && (
              <Animated.Text
                entering={FadeInDown.springify()}
                style={[styles.errorText, { color: C.error }]}
              >
                {error}
              </Animated.Text>
            )}

            <TouchableOpacity
              onPress={handleRegister}
              activeOpacity={0.88}
              disabled={isLoading}
            >
              <LinearGradient
                colors={
                  isLoading
                    ? ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.4)']
                    : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.95)']
                }
                style={styles.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color={C.primaryDark} size="small" />
                ) : (
                  <>
                    <Text style={[styles.ctaText, { color: C.primaryDark }]}>
                      Create Account
                    </Text>
                    <ArrowRight
                      size={20}
                      color={C.primaryDark}
                      strokeWidth={2.5}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.termsText, { color: '#CBD5E1' }]}>
              By creating an account you agree to our Terms of Service and
              Privacy Policy.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={styles.footer}
          >
            <Text style={[styles.footerText, { color: '#F1F5F9' }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={[styles.linkText, { color: C.primary }]}>
                Sign in
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    kav: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.xl,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.xl,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    hero: {
      alignItems: 'center',
      marginBottom: SPACING.xxxl,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      overflow: 'hidden',
      marginBottom: SPACING.xl,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: Platform.OS === 'android' ? 0 : 14,
    },
    iconGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 32,
      fontFamily: FONTS.extrabold,
      letterSpacing: -0.5,
      marginBottom: SPACING.sm,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 10,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      textAlign: 'center',
      lineHeight: 22,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    form: {
      gap: SPACING.md,
      marginBottom: SPACING.xl,
    },
    inputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: BORDER_RADIUS.xl,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      gap: SPACING.md,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.5)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    input: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      paddingVertical: SPACING.sm,
    },
    errorText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.semibold,
      textAlign: 'center',
      marginTop: SPACING.xs,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.xl,
      borderRadius: BORDER_RADIUS.pill,
      marginTop: SPACING.sm,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.7)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      minHeight: 58,
    },
    ctaText: {
      color: '#FFFFFF',
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      letterSpacing: 0.3,
    },
    termsText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.medium,
      textAlign: 'center',
      lineHeight: 18,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: SPACING.sm,
    },
    footerText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    linkText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.bold,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    googleButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    googleButtonText: {
      color: '#333333',
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dividerText: {
      color: 'rgba(255,255,255,0.5)',
      marginHorizontal: 12,
      fontSize: 14,
    },
  });
};

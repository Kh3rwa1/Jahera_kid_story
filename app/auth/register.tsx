import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const { signUp } = useAuth();
  const COLORS = currentTheme.colors;
  const styles = useStyles(COLORS, insets);

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
      router.replace('/onboarding/language-selection');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('already registered') || msg.includes('User already registered') || msg.includes('already exists')) {
        setError('An account with this email already exists. Try signing in.');
      } else if (msg.includes('Password should be') || msg.includes('password')) {
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
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: COLORS.cardBackground }]}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={COLORS.text.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.hero}>
            <View style={[styles.iconCircle, { shadowColor: COLORS.primary }]}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.iconGradient}>
                <Image 
                  source={require('@/assets/images/icon.png')}
                  style={{ width: '100%', height: '100%', borderRadius: 60, borderWidth: 3, borderColor: '#FFFFFF' }}
                  resizeMode="cover"
                />
              </LinearGradient>
            </View>
            <Text style={[styles.title, { color: COLORS.text.primary }]}>Create account</Text>
            <Text style={[styles.subtitle, { color: COLORS.text.secondary }]}>
              Start your child's adventure today
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
            <View style={[styles.inputGroup, { backgroundColor: COLORS.cardBackground }]}>
              <User size={20} color={COLORS.text.light} strokeWidth={2} />
              <TextInput
                style={[styles.input, { color: COLORS.text.primary }]}
                placeholder="Your name (optional)"
                placeholderTextColor={COLORS.text.light}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: COLORS.cardBackground }]}>
              <Mail size={20} color={COLORS.text.light} strokeWidth={2} />
              <TextInput
                style={[styles.input, { color: COLORS.text.primary }]}
                placeholder="Email address"
                placeholderTextColor={COLORS.text.light}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: COLORS.cardBackground }]}>
              <Lock size={20} color={COLORS.text.light} strokeWidth={2} />
              <TextInput
                style={[styles.input, { color: COLORS.text.primary }]}
                placeholder="Password (6+ characters)"
                placeholderTextColor={COLORS.text.light}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {showPassword
                  ? <EyeOff size={20} color={COLORS.text.light} strokeWidth={2} />
                  : <Eye size={20} color={COLORS.text.light} strokeWidth={2} />
                }
              </TouchableOpacity>
            </View>

            {error && (
              <Animated.Text entering={FadeInDown.springify()} style={[styles.errorText, { color: COLORS.error }]}>
                {error}
              </Animated.Text>
            )}

            <TouchableOpacity onPress={handleRegister} activeOpacity={0.88} disabled={isLoading}>
              <LinearGradient
                colors={isLoading ? [COLORS.text.light, COLORS.text.light] : [COLORS.primary, COLORS.primaryDark]}
                style={styles.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : (
                    <>
                      <Text style={styles.ctaText}>Create Account</Text>
                      <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                    </>
                  )
                }
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.termsText, { color: COLORS.text.light }]}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.footer}>
            <Text style={[styles.footerText, { color: COLORS.text.secondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={[styles.linkText, { color: COLORS.primary }]}>Sign in</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (COLORS: any, insets: any) => {
  return useMemo(() => StyleSheet.create({
    root: { flex: 1 },
    kav: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: SPACING.xl,
      paddingTop: insets.top + SPACING.xl,
      paddingBottom: insets.bottom + SPACING.xl,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.xl,
      ...SHADOWS.sm,
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
      elevation: 14,
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
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      textAlign: 'center',
      lineHeight: 22,
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
      ...SHADOWS.sm,
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
      ...SHADOWS.xl,
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
    },
    linkText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.bold,
    },
  }), [COLORS, insets]);
};

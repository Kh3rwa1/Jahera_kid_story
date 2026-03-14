import { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const { signIn } = useAuth();
  const themeColors = currentTheme.colors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Invalid credentials') || msg.includes('user_invalid_credentials') || msg.includes('401')) {
        setError('Incorrect email or password. Please try again.');
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
      <LinearGradient colors={themeColors.backgroundGradient} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACING.xxxl, paddingBottom: insets.bottom + SPACING.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.hero}>
            <View style={[styles.iconCircle, { shadowColor: themeColors.primary }]}>
              <LinearGradient colors={[themeColors.primary, themeColors.primaryDark]} style={styles.iconGradient}>
                <Sparkles size={36} color="#FFFFFF" strokeWidth={1.8} />
              </LinearGradient>
            </View>
            <Text style={[styles.title, { color: themeColors.text.primary }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
              Sign in to continue your adventures
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
            <View style={[styles.inputGroup, { backgroundColor: themeColors.cardBackground }]}>
              <Mail size={20} color={themeColors.text.light} strokeWidth={2} />
              <TextInput
                style={[styles.input, { color: themeColors.text.primary }]}
                placeholder="Email address"
                placeholderTextColor={themeColors.text.light}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: themeColors.cardBackground }]}>
              <Lock size={20} color={themeColors.text.light} strokeWidth={2} />
              <TextInput
                style={[styles.input, { color: themeColors.text.primary }]}
                placeholder="Password"
                placeholderTextColor={themeColors.text.light}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {showPassword
                  ? <EyeOff size={20} color={themeColors.text.light} strokeWidth={2} />
                  : <Eye size={20} color={themeColors.text.light} strokeWidth={2} />
                }
              </TouchableOpacity>
            </View>

            {error && (
              <Animated.Text entering={FadeInDown.springify()} style={[styles.errorText, { color: themeColors.error }]}>
                {error}
              </Animated.Text>
            )}

            <TouchableOpacity onPress={handleLogin} activeOpacity={0.88} disabled={isLoading}>
              <LinearGradient
                colors={isLoading ? [themeColors.text.light, themeColors.text.light] : [themeColors.primary, themeColors.primaryDark]}
                style={styles.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : (
                    <>
                      <Text style={styles.ctaText}>Sign In</Text>
                      <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                    </>
                  )
                }
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.footer}>
            <Text style={[styles.footerText, { color: themeColors.text.secondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={[styles.linkText, { color: themeColors.primary }]}>Sign up</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  linkText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
});

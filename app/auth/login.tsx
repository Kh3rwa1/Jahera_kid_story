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
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandVideoBackground } from '@/components/BrandVideoBackground';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const { signIn } = useAuth();
  const COLORS = currentTheme.colors;
  const styles = useStyles(COLORS, insets);

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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <BrandVideoBackground videoId="onboarding_video" fallbackSource={require('@/assets/jahera.mp4')} overlayOpacity={0.25} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            <Text style={[styles.title, { color: '#FFFFFF' }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: '#E2E8F0' }]}>
              Sign in to continue your adventures
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
            <View style={styles.inputGroup}>
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

            <View style={styles.inputGroup}>
              <Lock size={20} color={COLORS.text.light} strokeWidth={2} />
              <TextInput
                style={[styles.input, { color: COLORS.text.primary }]}
                placeholder="Password"
                placeholderTextColor={COLORS.text.light}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

            <TouchableOpacity onPress={handleLogin} activeOpacity={0.88} disabled={isLoading}>
              <LinearGradient
                colors={isLoading ? ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.4)'] : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.95)']}
                style={styles.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading
                  ? <ActivityIndicator color={COLORS.primaryDark} size="small" />
                  : (
                    <>
                      <Text style={[styles.ctaText, { color: COLORS.primaryDark }]}>Sign In</Text>
                      <ArrowRight size={20} color={COLORS.primaryDark} strokeWidth={2.5} />
                    </>
                  )
                }
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

           <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.footer}>
            <Text style={[styles.footerText, { color: '#F1F5F9' }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={[styles.linkText, { color: COLORS.primary }]}>Sign up</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (COLORS: any, insets: any) => {
  return useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    kav: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: SPACING.xl,
      justifyContent: 'center',
      paddingTop: insets.top + SPACING.xxxl,
      paddingBottom: insets.bottom + SPACING.xl,
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
      color: COLORS.primaryDark,
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
  }), [COLORS, insets]);
};

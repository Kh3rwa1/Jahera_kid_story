import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { User, ArrowLeft, ChevronRight, Check, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function KidName() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [name, setName] = useState('');

  const handleContinue = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/onboarding/family-members',
      params: { languages: params.languages as string, kidName: trimmedName },
    });
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const canContinue = name.trim().length >= 2;
  const showFeedback = name.trim().length > 0;
  const charsNeeded = Math.max(0, 2 - name.trim().length);
  const progressWidth = (2 / 4) * 100;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        {/* Hero zone */}
        <LinearGradient
          colors={[themeColors.primary, themeColors.primaryDark]}
          style={[styles.hero, { paddingTop: insets.top + SPACING.lg }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Back + Progress */}
          <View style={styles.heroTop}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.progressTrack}>
              <Animated.View
                entering={FadeInDown.delay(100)}
                style={[styles.progressFill, { width: `${progressWidth}%` }]}
              />
            </View>
            <Text style={styles.stepLabelText}>2 / 4</Text>
          </View>

          {/* Icon */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.iconZone}>
            <View style={styles.iconCircle}>
              <User size={36} color="#FFFFFF" strokeWidth={1.8} />
            </View>
            {/* Decorative sparkles */}
            <View style={[styles.sparkle, { top: -8, right: -8 }]}>
              <Sparkles size={16} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            </View>
            <View style={[styles.sparkle, { bottom: -4, left: -10 }]}>
              <Sparkles size={12} color="rgba(255,255,255,0.5)" strokeWidth={2} />
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.heroTitle}>
            What's your{'\n'}child's name?
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(240).springify()} style={styles.heroSubtitle}>
            We'll create magical stories starring them
          </Animated.Text>
        </LinearGradient>

        {/* Content zone */}
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.inputWrapper}>
            <View style={[styles.inputCard, { backgroundColor: themeColors.cardBackground }]}>
              <TextInput
                style={[styles.input, { color: themeColors.text.primary }]}
                placeholder="Enter name here..."
                placeholderTextColor={themeColors.text.light}
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={handleContinue}
              />
              {canContinue && (
                <Animated.View entering={ZoomIn.springify()} style={[styles.inputCheck, { backgroundColor: themeColors.primary }]}>
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                </Animated.View>
              )}
            </View>

            {showFeedback && (
              <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.feedbackRow}>
                <View style={[
                  styles.feedbackBadge,
                  { backgroundColor: canContinue ? themeColors.primary + '12' : themeColors.warning + '12' },
                ]}>
                  <Text style={[
                    styles.feedbackText,
                    { color: canContinue ? themeColors.primary : themeColors.warning },
                  ]}>
                    {canContinue
                      ? `${name.trim()} is a wonderful name!`
                      : `${charsNeeded} more character${charsNeeded > 1 ? 's' : ''} needed`}
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Hint text */}
          <Animated.Text
            entering={FadeInDown.delay(340).springify()}
            style={[styles.hint, { color: themeColors.text.light }]}
          >
            This is used to personalize every story
          </Animated.Text>
        </View>

        {/* Footer */}
        <Animated.View
          entering={FadeInUp.delay(320).springify()}
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <TouchableOpacity onPress={handleContinue} disabled={!canContinue} activeOpacity={0.88}>
            <LinearGradient
              colors={canContinue ? [themeColors.primary, themeColors.primaryDark] : ['#D1D5DB', '#D1D5DB']}
              style={styles.ctaButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.ctaText}>
                {canContinue ? 'Next Step' : 'Enter a name to continue'}
              </Text>
              {canContinue && <ChevronRight size={22} color="#FFFFFF" strokeWidth={2.5} />}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  kav: { flex: 1 },
  hero: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    alignItems: 'center',
  },
  heroTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  stepLabelText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.75)',
  },
  iconZone: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  sparkle: {
    position: 'absolute',
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl,
  },
  inputWrapper: {
    marginBottom: SPACING.lg,
  },
  inputCard: {
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.md,
    ...SHADOWS.md,
    marginBottom: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    fontSize: 30,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  inputCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  feedbackRow: {
    alignItems: 'center',
  },
  feedbackBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
  },
  feedbackText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
  },
  hint: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    backgroundColor: '#F8F9FA',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.pill,
    ...SHADOWS.xl,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },
});

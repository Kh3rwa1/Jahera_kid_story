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
import { User, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEP_DOTS = [false, true, false, false];

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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={themeColors.backgroundGradient} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backBtn, { backgroundColor: themeColors.cardBackground }]}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={themeColors.text.primary} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={[styles.iconCircle, { shadowColor: themeColors.primary }]}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.primaryDark]}
              style={styles.iconGradient}
            >
              <User size={32} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            What's your{'\n'}child's name?
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            We'll create magical stories starring them
          </Text>

          {/* Step dots */}
          <View style={styles.stepRow}>
            {STEP_DOTS.map((active, i) => (
              <View
                key={i}
                style={[
                  styles.stepDot,
                  active
                    ? [styles.stepDotActive, { backgroundColor: themeColors.primary }]
                    : { backgroundColor: themeColors.primary + '25', width: 8 },
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Input area */}
        <View style={styles.inputArea}>
          <Animated.View entering={FadeInDown.delay(220).springify()}>
            <View style={[styles.inputCard, { backgroundColor: themeColors.cardBackground, shadowColor: themeColors.primary }]}>
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
            </View>

            {showFeedback && (
              <Animated.View entering={ZoomIn.springify()} style={styles.feedbackRow}>
                <View style={[
                  styles.feedbackBadge,
                  { backgroundColor: canContinue ? themeColors.primary + '15' : themeColors.warning + '15' }
                ]}>
                  <Text style={[
                    styles.feedbackText,
                    { color: canContinue ? themeColors.primary : themeColors.warning }
                  ]}>
                    {canContinue
                      ? `${name.trim()} is a great name!`
                      : `${charsNeeded} more character${charsNeeded > 1 ? 's' : ''} needed`}
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View
          entering={FadeInUp.delay(320).springify()}
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <TouchableOpacity onPress={handleContinue} disabled={!canContinue} activeOpacity={0.88}>
            <LinearGradient
              colors={canContinue ? [themeColors.primary, themeColors.primaryDark] : [themeColors.text.light + 'AA', themeColors.text.light + 'AA']}
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
  root: { flex: 1 },
  kav: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
    ...SHADOWS.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
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
    fontSize: 30,
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  stepRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  stepDotActive: {
    width: 24,
  },
  inputArea: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  inputCard: {
    borderRadius: BORDER_RADIUS.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: SPACING.lg,
  },
  input: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    fontSize: 28,
    fontFamily: FONTS.bold,
    textAlign: 'center',
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
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl - 2,
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

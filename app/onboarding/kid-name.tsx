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
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
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
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/onboarding/family-members',
      params: { languages: params.languages as string, kidName: trimmedName },
    });
  };

  const handleBack = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const canContinue = name.trim().length >= 2;
  const showFeedback = name.trim().length > 0;
  const charsNeeded = Math.max(0, 2 - name.trim().length);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <LinearGradient
          colors={['#0F0F1A', '#1A0826', '#0A1628']}
          style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={20} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.progressTrack}>
              <Animated.View
                entering={FadeInDown.delay(100)}
                style={[styles.progressFill, { width: '50%', backgroundColor: themeColors.primary }]}
              />
            </View>
            <Text style={styles.stepBadge}>2 / 4</Text>
          </View>

          <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.iconZone}>
            <View style={[styles.iconOuter, { borderColor: themeColors.primary + '40' }]}>
              <LinearGradient
                colors={[themeColors.primary, themeColors.primaryDark]}
                style={styles.iconCircle}
              >
                <User size={30} color="#FFFFFF" strokeWidth={1.8} />
              </LinearGradient>
            </View>
            <View style={styles.sparkleTop}>
              <Sparkles size={14} color={themeColors.primary + 'CC'} strokeWidth={2} />
            </View>
            <View style={styles.sparkleBottom}>
              <Sparkles size={10} color='rgba(255,255,255,0.4)' strokeWidth={2} />
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(250).springify()} style={styles.headerTitle}>
            What's your{'\n'}child's name?
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300).springify()} style={styles.headerSubtitle}>
            They'll star in every story we create
          </Animated.Text>
        </LinearGradient>

        <View style={styles.body}>
          <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.inputSection}>
            <View style={[styles.inputCard, { borderColor: canContinue ? themeColors.primary : '#E8E8F0' }]}>
              <TextInput
                style={[styles.input, { color: '#1A1A2E' }]}
                placeholder="Type a name..."
                placeholderTextColor="#C4C4D4"
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={handleContinue}
              />
              {canContinue && (
                <Animated.View entering={ZoomIn.springify()} style={[styles.checkBadge, { backgroundColor: themeColors.primary }]}>
                  <Check size={15} color="#FFFFFF" strokeWidth={3} />
                </Animated.View>
              )}
            </View>

            {showFeedback && (
              <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.feedbackWrap}>
                <View style={[
                  styles.feedbackChip,
                  {
                    backgroundColor: canContinue ? themeColors.primary + '10' : '#FFF8E6',
                    borderColor: canContinue ? themeColors.primary + '30' : '#F59E0B30',
                  },
                ]}>
                  <Text style={[
                    styles.feedbackText,
                    { color: canContinue ? themeColors.primary : '#B45309' },
                  ]}>
                    {canContinue
                      ? `${name.trim()} sounds wonderful!`
                      : `${charsNeeded} more character${charsNeeded > 1 ? 's' : ''} needed`}
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(400).springify()} style={styles.hint}>
            This name will appear throughout all stories
          </Animated.Text>
        </View>

        <Animated.View
          entering={FadeInUp.delay(340).springify()}
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <TouchableOpacity onPress={handleContinue} disabled={!canContinue} activeOpacity={0.88}>
            <LinearGradient
              colors={canContinue ? [themeColors.primary, themeColors.primaryDark] : ['#E5E7EB', '#E5E7EB']}
              style={styles.ctaBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.ctaBtnText, !canContinue && { color: '#9CA3AF' }]}>
                {canContinue ? 'Continue' : 'Enter a name first'}
              </Text>
              {canContinue && <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },
  kav: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    alignItems: 'center',
  },
  headerTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepBadge: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  iconZone: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  iconOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  sparkleTop: { position: 'absolute', top: -4, right: -4 },
  sparkleBottom: { position: 'absolute', bottom: -2, left: -6 },
  headerTitle: {
    fontSize: 28,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.8,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl,
  },
  inputSection: { marginBottom: SPACING.md },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    paddingRight: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    fontSize: 32,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  checkBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackWrap: { alignItems: 'center' },
  feedbackChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
  },
  hint: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: '#B0B0C0',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    backgroundColor: '#F7F8FA',
    borderTopWidth: 1,
    borderTopColor: '#EEEEF2',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
});

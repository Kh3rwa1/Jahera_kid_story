import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withRepeat,
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { User, ArrowLeft, Heart, Star, Sparkles } from 'lucide-react-native';

export default function KidName() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [name, setName] = useState('');

  // Floating animations
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);

  useEffect(() => {
    float1.value = withRepeat(
      withSequence(
        withSpring(-10, { damping: 3 }),
        withSpring(0, { damping: 3 })
      ),
      -1,
      false
    );
    float2.value = withRepeat(
      withSequence(
        withSpring(-15, { damping: 3 }),
        withSpring(0, { damping: 3 })
      ),
      -1,
      false
    );
    float3.value = withRepeat(
      withSequence(
        withSpring(-12, { damping: 3 }),
        withSpring(0, { damping: 3 })
      ),
      -1,
      false
    );
  }, []);

  const float1Style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: float1.value }],
      opacity: interpolate(float1.value, [-10, 0], [0.4, 0.7]),
    };
  });

  const float2Style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: float2.value }],
      opacity: interpolate(float2.value, [-15, 0], [0.4, 0.7]),
    };
  });

  const float3Style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: float3.value }],
      opacity: interpolate(float3.value, [-12, 0], [0.4, 0.7]),
    };
  });

  const handleContinue = async () => {
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('✨ Name Required', "Please enter your child's name to continue.", [
        { text: 'OK' },
      ]);
      return;
    }

    if (trimmedName.length < 2) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('🌟 Almost There!', 'Name must be at least 2 characters long.', [{ text: 'OK' }]);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/onboarding/family-members',
      params: {
        languages: params.languages as string,
        kidName: trimmedName,
      },
    });
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <LinearGradient colors={themeColors.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>

        {/* Floating decorative elements */}
        <Animated.View style={[styles.floatingElement, { top: '10%', left: '12%' }, float1Style]}>
          <Heart size={28} color={themeColors.primary} strokeWidth={2} />
        </Animated.View>
        <Animated.View style={[styles.floatingElement, { top: '15%', right: '10%' }, float2Style]}>
          <Star size={24} color={themeColors.primary} strokeWidth={2} />
        </Animated.View>
        <Animated.View style={[styles.floatingElement, { top: '25%', left: '8%' }, float3Style]}>
          <Sparkles size={22} color={themeColors.primary} strokeWidth={2} />
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: themeColors.cardBackground }]}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={themeColors.text.primary} strokeWidth={2} />
          </TouchableOpacity>

          <LinearGradient
            colors={[themeColors.primary + '25', themeColors.primary + '15']}
            style={styles.iconBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <User size={40} color={themeColors.primary} strokeWidth={2.5} />
          </LinearGradient>

          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            What's your child's name? ✨
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            We'll create magical stories starring them!
          </Text>
        </Animated.View>

        {/* Input Section */}
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputContainer}>
            <LinearGradient
              colors={name.length >= 2
                ? [themeColors.primary + '10', themeColors.primary + '05']
                : [themeColors.cardBackground, themeColors.cardBackground]
              }
              style={styles.inputWrapper}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
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
            </LinearGradient>
            {name.length > 0 && (
              <Animated.View entering={FadeInDown.springify()} style={styles.feedbackContainer}>
                <Text style={[styles.feedbackText, { color: themeColors.primary }]}>
                  {name.length < 2
                    ? `${2 - name.length} more character${2 - name.length > 1 ? 's' : ''} needed`
                    : `✓ Perfect! ${name} will love these stories! 🎉`
                  }
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Enhanced Progress indicator */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: themeColors.text.secondary }]}>
                Your Progress
              </Text>
              <Text style={[styles.progressStep, { color: themeColors.primary }]}>
                Step 2 of 4
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: themeColors.primary + '20' }]}>
              <LinearGradient
                colors={themeColors.gradients.primary}
                style={[styles.progressFill, { width: '50%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <View style={styles.progressDots}>
              <View style={[styles.dot, styles.dotCompleted, { backgroundColor: themeColors.primary }]} />
              <View style={[styles.dot, styles.dotCompleted, { backgroundColor: themeColors.primary }]} />
              <View style={[styles.dot, { backgroundColor: themeColors.primary + '30' }]} />
              <View style={[styles.dot, { backgroundColor: themeColors.primary + '30' }]} />
            </View>
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.footer}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={name.trim().length < 2}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={name.trim().length < 2
                ? [themeColors.text.light, themeColors.text.light]
                : themeColors.gradients.primary
              }
              style={styles.continueButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.continueButtonText}>
                {name.trim().length < 2 ? 'Enter a name to continue' : 'Next Step →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  floatingElement: {
    position: 'absolute',
    zIndex: 0,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xl,
    zIndex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  title: {
    fontSize: 34,
    fontFamily: FONTS.extrabold,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    lineHeight: 26,
    fontFamily: FONTS.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    zIndex: 1,
  },
  inputContainer: {
    marginBottom: SPACING.xxl,
  },
  inputWrapper: {
    borderRadius: BORDER_RADIUS.xl,
    padding: 3,
    ...SHADOWS.md,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    fontSize: 26,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  feedbackContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    textAlign: 'center',
  },
  progressContainer: {
    gap: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
  },
  progressStep: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
  progressBar: {
    height: 10,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotCompleted: {
    ...SHADOWS.sm,
  },
  footer: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + 10,
    zIndex: 1,
  },
  continueButton: {
    paddingVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    ...SHADOWS.xl,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
});

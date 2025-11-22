import { useState } from 'react';
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
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { User, ArrowLeft } from 'lucide-react-native';

export default function KidName() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const [name, setName] = useState('');

  const handleContinue = async () => {
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Name Required', "Please enter your child's name to continue.", [
        { text: 'OK' },
      ]);
      return;
    }

    if (trimmedName.length < 2) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Invalid Name', 'Name must be at least 2 characters long.', [{ text: 'OK' }]);
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
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={24} color={COLORS.text.primary} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.iconBadge}>
            <User size={32} color="#7FD8BE" strokeWidth={2.5} />
          </View>

          <Text style={styles.title}>What's your child's name?</Text>
          <Text style={styles.subtitle}>
            We'll personalize magical stories just for them ✨
          </Text>
        </Animated.View>

        {/* Input Section */}
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter name here..."
              placeholderTextColor={COLORS.text.light}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={handleContinue}
            />
            {name.length > 0 && (
              <Animated.View entering={FadeInDown.springify()} style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {name.length < 2 ? `${2 - name.length} more character${2 - name.length > 1 ? 's' : ''}` : '✓ Looks great!'}
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Progress indicator */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#7FD8BE', '#66C3A8']}
                style={[styles.progressFill, { width: '25%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressText}>Step 2 of 4</Text>
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
                ? [COLORS.text.light, COLORS.text.light]
                : ['#7FD8BE', '#66C3A8']
              }
              style={styles.continueButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.continueButtonText}>
                {name.trim().length < 2 ? 'Enter a name' : 'Continue →'}
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
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(127, 216, 190, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    lineHeight: 22,
    fontWeight: FONT_WEIGHTS.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    fontSize: 22,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
    borderWidth: 2,
    borderColor: 'rgba(127, 216, 190, 0.3)',
    ...SHADOWS.md,
  },
  characterCount: {
    marginTop: SPACING.md,
    alignItems: 'flex-end',
  },
  characterCountText: {
    fontSize: FONT_SIZES.sm,
    color: '#7FD8BE',
    fontWeight: FONT_WEIGHTS.semibold,
  },
  progressContainer: {
    gap: SPACING.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(127, 216, 190, 0.2)',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    color: '#7FD8BE',
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + 10,
  },
  continueButton: {
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.colored,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.3,
  },
});

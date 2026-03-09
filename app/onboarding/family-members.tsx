import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Users, ArrowLeft, Plus } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, { FadeInDown, FadeInUp, FadeOutUp, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function FamilyMembers() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [emptyNameHint, setEmptyNameHint] = useState(false);

  const addFamilyMember = async () => {
    const trimmedName = currentName.trim();

    if (!trimmedName.length) {
      setEmptyNameHint(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => setEmptyNameHint(false), 1200);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFamilyMembers([...familyMembers, trimmedName]);
    setCurrentName('');
    setEmptyNameHint(false);
  };

  const removeFamilyMember = async (index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/onboarding/friends',
      params: {
        languages: params.languages as string,
        kidName: params.kidName as string,
        familyMembers: JSON.stringify(familyMembers),
      },
    });
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/onboarding/friends',
      params: {
        languages: params.languages as string,
        kidName: params.kidName as string,
        familyMembers: JSON.stringify([]),
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
            <Users size={40} color={themeColors.primary} strokeWidth={2.5} />
          </LinearGradient>

          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            Add Family Members 👨‍👩‍👧‍👦
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            Who should join {params.kidName} in the adventures?
          </Text>
        </Animated.View>

        {/* Input Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <LinearGradient
              colors={[themeColors.cardBackground, themeColors.cardBackground]}
              style={styles.inputWrapper}
            >
              <TextInput
                style={[styles.input, { color: themeColors.text.primary }]}
                placeholder="Type a family member name..."
                placeholderTextColor={themeColors.text.light}
                value={currentName}
                onChangeText={(value) => {
                  setCurrentName(value);
                  if (emptyNameHint && value.trim().length > 0) {
                    setEmptyNameHint(false);
                  }
                }}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={addFamilyMember}
              />
            </LinearGradient>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: currentName.trim().length === 0 ? themeColors.text.light : themeColors.primary }
              ]}
              onPress={addFamilyMember}
              activeOpacity={0.7}
            >
              <Plus size={24} color="#FFFFFF" strokeWidth={3} />
            </TouchableOpacity>
          </View>
          {emptyNameHint ? (
            <Animated.Text entering={FadeInDown.springify()} style={[styles.inputHint, { color: themeColors.warning }]}>
              Type a name first!
            </Animated.Text>
          ) : null}
        </Animated.View>

        {/* List */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {familyMembers.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.emptyState}>
              <LinearGradient
                colors={[themeColors.primary + '15', themeColors.primary + '08']}
                style={styles.emptyIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
              </LinearGradient>
              <Text style={[styles.emptyStateText, { color: themeColors.text.primary }]}>
                No family members yet
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: themeColors.text.secondary }]}>
                Add parents, siblings, or grandparents! 💝
              </Text>
            </Animated.View>
          ) : (
            familyMembers.map((member, index) => (
              <Animated.View
                key={index}
                entering={ZoomIn.delay(index * 50).springify()}
                exiting={FadeOutUp.springify()}
              >
                <LinearGradient
                  colors={themeColors.gradients.primary}
                  style={styles.memberCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.memberIconContainer}>
                    <Text style={styles.memberIcon}>
                      {index % 4 === 0 ? '👨' : index % 4 === 1 ? '👩' : index % 4 === 2 ? '👧' : '👦'}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>{member}</Text>
                  <TouchableOpacity
                    onPress={() => removeFamilyMember(index)}
                    style={styles.removeButton}
                    activeOpacity={0.7}
                  >
                    <X size={18} color="#FF5252" strokeWidth={3} />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            ))
          )}
        </ScrollView>

        {/* Progress */}
        <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: themeColors.text.secondary }]}>
              Your Progress
            </Text>
            <Text style={[styles.progressStep, { color: themeColors.primary }]}>
              Step 3 of 4
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: themeColors.primary + '20' }]}>
            <LinearGradient
              colors={themeColors.gradients.primary}
              style={[styles.progressFill, { width: '75%' }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <View style={styles.progressDots}>
            <View style={[styles.dot, styles.dotCompleted, { backgroundColor: themeColors.primary }]} />
            <View style={[styles.dot, styles.dotCompleted, { backgroundColor: themeColors.primary }]} />
            <View style={[styles.dot, styles.dotCompleted, { backgroundColor: themeColors.primary }]} />
            <View style={[styles.dot, { backgroundColor: themeColors.primary + '30' }]} />
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.footer}>
          <TouchableOpacity
            onPress={handleSkip}
            style={[styles.skipButton, { backgroundColor: themeColors.cardBackground }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipButtonText, { color: themeColors.text.secondary }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.9} style={{ flex: 1 }}>
            <LinearGradient
              colors={themeColors.gradients.primary}
              style={styles.continueButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.continueButtonText}>
                Next Step →
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
    paddingBottom: SPACING.md,
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
  inputHint: {
    marginTop: SPACING.sm,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
  },
  inputSection: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
  },
  input: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
  },
  listContent: {
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 1.5,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  emptyIcon: {
    fontSize: 50,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  memberIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
    ...SHADOWS.sm,
  },
  memberIcon: {
    fontSize: 24,
  },
  memberName: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  progressContainer: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
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
    flexDirection: 'row',
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + 10,
    gap: SPACING.md,
  },
  skipButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  skipButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
  },
  continueButton: {
    paddingVertical: SPACING.lg,
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

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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, UserPlus, ArrowLeft, Plus, Sparkles, PartyPopper } from 'lucide-react-native';
import { profileService, languageService, familyMemberService, friendService } from '@/services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, { FadeInDown, FadeInUp, FadeOutUp, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function Friends() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [friends, setFriends] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [emptyNameHint, setEmptyNameHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addFriend = async () => {
    const trimmedName = currentName.trim();

    if (!trimmedName.length) {
      setEmptyNameHint(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => setEmptyNameHint(false), 1200);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFriends([...friends, trimmedName]);
    setCurrentName('');
    setEmptyNameHint(false);
  };

  const removeFriend = async (index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFriends(friends.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const languages = JSON.parse(params.languages as string);
      const kidName = params.kidName as string;
      const familyMembers = JSON.parse((params.familyMembers as string) || '[]');

      const primaryLanguage = languages[0]?.code || 'en';
      const profile = await profileService.create(kidName, primaryLanguage);

      if (!profile) {
        Alert.alert('❌ Error', 'Failed to create profile. Please try again.');
        setIsLoading(false);
        return;
      }

      await Promise.all([
        ...languages.map((lang: { code: string; name: string }) =>
          languageService.add(profile.id, lang.code, lang.name)
        ),
        ...familyMembers.map((name: string) => familyMemberService.add(profile.id, name)),
        ...friends.map(name => friendService.add(profile.id, name)),
      ]);

      await AsyncStorage.setItem('profileId', profile.id);

      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('❌ Error', 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    handleComplete();
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
            disabled={isLoading}
          >
            <ArrowLeft size={24} color={themeColors.text.primary} strokeWidth={2} />
          </TouchableOpacity>

          <LinearGradient
            colors={[themeColors.primary + '25', themeColors.primary + '15']}
            style={styles.iconBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <UserPlus size={40} color={themeColors.primary} strokeWidth={2.5} />
          </LinearGradient>

          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            Add Friends! 👫
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            Who are {params.kidName}'s awesome friends?
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
                placeholder="Enter friend's name..."
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
                onSubmitEditing={addFriend}
                editable={!isLoading}
              />
            </LinearGradient>
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: (currentName.trim().length === 0 || isLoading)
                    ? themeColors.text.light
                    : themeColors.primary
                }
              ]}
              onPress={addFriend}
              disabled={isLoading}
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
          {friends.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.emptyState}>
              <LinearGradient
                colors={[themeColors.primary + '15', themeColors.primary + '08']}
                style={styles.emptyIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.emptyIcon}>👫</Text>
              </LinearGradient>
              <Text style={[styles.emptyStateText, { color: themeColors.text.primary }]}>
                No friends added yet
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: themeColors.text.secondary }]}>
                Add friends to make stories more fun! 🎉
              </Text>
            </Animated.View>
          ) : (
            friends.map((friend, index) => (
              <Animated.View
                key={index}
                entering={ZoomIn.delay(index * 50).springify()}
                exiting={FadeOutUp.springify()}
              >
                <LinearGradient
                  colors={themeColors.gradients.primary}
                  style={styles.friendCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.friendIconContainer}>
                    <Text style={styles.friendIcon}>
                      {index % 6 === 0 ? '🧒' : index % 6 === 1 ? '👦' : index % 6 === 2 ? '👧' : index % 6 === 3 ? '🧑' : index % 6 === 4 ? '👶' : '🧓'}
                    </Text>
                  </View>
                  <Text style={styles.friendName}>{friend}</Text>
                  <TouchableOpacity
                    onPress={() => removeFriend(index)}
                    style={styles.removeButton}
                    activeOpacity={0.7}
                    disabled={isLoading}
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
              Almost Done!
            </Text>
            <Text style={[styles.progressStep, { color: themeColors.success }]}>
              Step 4 of 4 🎉
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: themeColors.success + '20' }]}>
            <LinearGradient
              colors={[themeColors.success, themeColors.successLight]}
              style={[styles.progressFill, { width: '100%' }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <View style={styles.progressDots}>
            <View style={[styles.dot, styles.dotCompleted, { backgroundColor: themeColors.success }]} />
            <View style={[styles.dot, styles.dotCompleted, { backgroundColor: themeColors.success }]} />
            <View style={[styles.dot, styles.dotCompleted, { backgroundColor: themeColors.success }]} />
            <View style={[styles.dot, styles.dotCompleted, { backgroundColor: themeColors.success }]} />
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.footer}>
          <TouchableOpacity
            onPress={handleSkip}
            style={[styles.skipButton, { backgroundColor: themeColors.cardBackground }]}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Text style={[styles.skipButtonText, { color: themeColors.text.secondary }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleComplete}
            activeOpacity={0.9}
            style={{ flex: 1 }}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading
                ? [themeColors.text.light, themeColors.text.light]
                : [themeColors.success, themeColors.successLight]
              }
              style={styles.completeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.completeButtonContent}>
                  <Text style={styles.completeButtonText}>Start Adventures</Text>
                  <Sparkles size={20} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              )}
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
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  friendIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
    ...SHADOWS.sm,
  },
  friendIcon: {
    fontSize: 24,
  },
  friendName: {
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
  completeButton: {
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xl,
  },
  completeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
});

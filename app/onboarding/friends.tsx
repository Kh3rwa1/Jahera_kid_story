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
import { X, UserPlus, ArrowLeft, Plus, Sparkles } from 'lucide-react-native';
import { profileService, languageService, familyMemberService, friendService } from '@/services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import Animated, { FadeInDown, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function Friends() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [friends, setFriends] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addFriend = async () => {
    const trimmedName = currentName.trim();

    if (trimmedName.length > 0) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setFriends([...friends, trimmedName]);
      setCurrentName('');
    }
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
        Alert.alert('Error', 'Failed to create profile. Please try again.');
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
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <ArrowLeft size={24} color={COLORS.text.primary} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.iconBadge}>
            <UserPlus size={32} color={COLORS.primary} strokeWidth={2.5} />
          </View>

          <Text style={styles.title}>Add Friends</Text>
          <Text style={styles.subtitle}>
            Who are {params.kidName}'s awesome friends?
          </Text>
        </Animated.View>

        {/* Input Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter friend's name..."
              placeholderTextColor={COLORS.text.light}
              value={currentName}
              onChangeText={setCurrentName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={addFriend}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                (currentName.trim().length === 0 || isLoading) && styles.addButtonDisabled,
              ]}
              onPress={addFriend}
              disabled={currentName.trim().length === 0 || isLoading}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* List */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {friends.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>👫</Text>
              </View>
              <Text style={styles.emptyStateText}>No friends added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add friends to join the adventures
              </Text>
            </Animated.View>
          ) : (
            friends.map((friend, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 50).springify()}
                exiting={FadeOutUp.springify()}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#FFFBF5']}
                  style={styles.friendCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.friendIconContainer}>
                    <Text style={styles.friendIcon}>👤</Text>
                  </View>
                  <Text style={styles.friendName}>{friend}</Text>
                  <TouchableOpacity
                    onPress={() => removeFriend(index)}
                    style={styles.removeButton}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <X size={18} color={COLORS.error} strokeWidth={2.5} />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            ))
          )}
        </ScrollView>

        {/* Progress */}
        <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>Step 4 of 4 - Almost there! 🎉</Text>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.footer}>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleComplete}
            activeOpacity={0.9}
            style={{ flex: 1 }}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading
                ? [COLORS.text.light, COLORS.text.light]
                : [COLORS.success, COLORS.successLight]
              }
              style={styles.completeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.completeButtonText}>Complete Setup</Text>
                  <Sparkles size={18} color="#FFFFFF" strokeWidth={2.5} />
                </>
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
    backgroundColor: 'rgba(255, 102, 52, 0.1)',
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
  inputSection: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    ...SHADOWS.sm,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.text.light,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
  },
  listContent: {
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(255, 102, 52, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  friendIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 102, 52, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  friendIcon: {
    fontSize: 20,
  },
  friendName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
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
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  skipButtonText: {
    color: COLORS.text.secondary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  completeButton: {
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.3,
  },
});

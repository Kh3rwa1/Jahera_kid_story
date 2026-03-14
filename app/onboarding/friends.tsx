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
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, UserPlus, ArrowLeft, Plus, Sparkles } from 'lucide-react-native';
import { profileService, languageService, familyMemberService, friendService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, { FadeInDown, FadeInUp, FadeOutUp, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEP_DOTS = [false, false, false, true];
const FRIEND_EMOJIS = ['🧒', '👦', '👧', '🧑', '👶', '🧓'];

export default function Friends() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const { loadProfile } = useApp();
  const themeColors = currentTheme.colors;
  const [friends, setFriends] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addFriend = async () => {
    const trimmed = currentName.trim();
    if (!trimmed.length) {
      setShake(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => setShake(false), 600);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFriends([...friends, trimmed]);
    setCurrentName('');
  };

  const removeFriend = async (index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFriends(friends.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (!user) {
      setErrorMsg('You must be signed in to create a profile.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const languages = JSON.parse(params.languages as string);
      const kidName = params.kidName as string;
      const familyMembers = JSON.parse((params.familyMembers as string) || '[]');
      const primaryLanguage = languages[0]?.code || 'en';
      const profile = await profileService.create(user.id, kidName, primaryLanguage);
      if (!profile) {
        setErrorMsg('Failed to create profile. Please try again.');
        setIsLoading(false);
        return;
      }
      await Promise.all([
        ...languages.map((lang: { code: string; name: string }) =>
          languageService.add(profile.$id, lang.code, lang.name)
        ),
        ...familyMembers.map((name: string) => familyMemberService.add(profile.$id, name)),
        ...friends.map(name => friendService.add(profile.$id, name)),
      ]);
      await loadProfile();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={themeColors.backgroundGradient} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backBtn, { backgroundColor: themeColors.cardBackground }]}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <ArrowLeft size={20} color={themeColors.text.primary} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={[styles.iconCircle, { shadowColor: themeColors.success }]}>
            <LinearGradient
              colors={[themeColors.success, themeColors.successLight]}
              style={styles.iconGradient}
            >
              <UserPlus size={32} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            Add Friends
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            Who are {params.kidName}'s awesome friends?
          </Text>

          {/* Step dots — all filled on last step */}
          <View style={styles.stepRow}>
            {STEP_DOTS.map((active, i) => (
              <View
                key={i}
                style={[
                  styles.stepDot,
                  active
                    ? [styles.stepDotActive, { backgroundColor: themeColors.success }]
                    : { backgroundColor: themeColors.success + '35', width: 8 },
                ]}
              />
            ))}
          </View>

          {/* Final step badge */}
          <View style={[styles.finalBadge, { backgroundColor: themeColors.success + '18' }]}>
            <Text style={[styles.finalBadgeText, { color: themeColors.success }]}>
              Last step — almost done!
            </Text>
          </View>
        </Animated.View>

        {/* Input row */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.inputSection}>
          <View style={[
            styles.inputCard,
            { backgroundColor: themeColors.cardBackground, shadowColor: themeColors.success },
            shake && { borderColor: themeColors.warning, borderWidth: 1.5 },
          ]}>
            <TextInput
              style={[styles.input, { color: themeColors.text.primary }]}
              placeholder="Enter a friend's name..."
              placeholderTextColor={themeColors.text.light}
              value={currentName}
              onChangeText={setCurrentName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={addFriend}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={addFriend}
              style={[styles.addBtn, { backgroundColor: currentName.trim().length > 0 ? themeColors.success : themeColors.success + '40' }]}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={3} />
            </TouchableOpacity>
          </View>
          {errorMsg && (
            <Animated.Text entering={FadeInDown.springify()} style={[styles.errorText, { color: themeColors.error }]}>
              {errorMsg}
            </Animated.Text>
          )}
        </Animated.View>

        {/* Friends list */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {friends.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: themeColors.success + '12' }]}>
                <Text style={styles.emptyIcon}>👫</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: themeColors.text.primary }]}>No friends added yet</Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.text.secondary }]}>
                You can skip this step if you'd like
              </Text>
            </Animated.View>
          ) : (
            friends.map((friend, index) => (
              <Animated.View
                key={`${friend}-${index}`}
                entering={ZoomIn.delay(index * 40).springify()}
                exiting={FadeOutUp.duration(200)}
              >
                <View style={[styles.friendCard, { backgroundColor: themeColors.cardBackground, shadowColor: themeColors.success }]}>
                  <View style={[styles.friendEmojiBadge, { backgroundColor: themeColors.success + '15' }]}>
                    <Text style={styles.friendEmoji}>
                      {FRIEND_EMOJIS[index % FRIEND_EMOJIS.length]}
                    </Text>
                  </View>
                  <Text style={[styles.friendName, { color: themeColors.text.primary }]} numberOfLines={1}>
                    {friend}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFriend(index)}
                    style={[styles.removeBtn, { backgroundColor: themeColors.error + '18' }]}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <X size={15} color={themeColors.error} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))
          )}
        </ScrollView>

        {/* Footer */}
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <TouchableOpacity
            onPress={handleComplete}
            style={[styles.skipBtn, { backgroundColor: themeColors.cardBackground }]}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Text style={[styles.skipText, { color: themeColors.text.secondary }]}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleComplete}
            activeOpacity={0.88}
            style={{ flex: 1 }}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? [themeColors.text.light, themeColors.text.light] : [themeColors.success, themeColors.successLight]}
              style={styles.ctaButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.ctaText}>Start Adventures</Text>
                  <Sparkles size={20} color="#FFFFFF" strokeWidth={2.5} />
                </>
              )}
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
    paddingBottom: SPACING.lg,
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
    marginBottom: SPACING.md,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  stepDotActive: {
    width: 24,
  },
  finalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
  },
  finalBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
  inputSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    paddingRight: SPACING.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: SPACING.sm,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl * 2,
    gap: SPACING.sm,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyIcon: { fontSize: 44 },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  friendEmojiBadge: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendEmoji: { fontSize: 22 },
  friendName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.md,
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  skipText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
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

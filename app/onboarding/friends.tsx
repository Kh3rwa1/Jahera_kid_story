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

  const successColor = themeColors.success;
  const successLight = themeColors.successLight;

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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        {/* Hero zone */}
        <LinearGradient
          colors={[successColor, successLight]}
          style={[styles.hero, { paddingTop: insets.top + SPACING.lg }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroTop}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backBtn}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.stepLabelText}>4 / 4</Text>
          </View>

          {/* Overlapping friend emojis scene */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.emojiScene}>
            <View style={[styles.emojiCircle, styles.emojiCircleMid]}>
              <Text style={styles.emojiMid}>👦</Text>
            </View>
            <View style={[styles.emojiCircle, styles.emojiCircleLarge, styles.emojiOverlapLeft]}>
              <Text style={styles.emojiLarge}>👧</Text>
            </View>
            <View style={[styles.emojiCircle, styles.emojiCircleMid, styles.emojiOverlapLeft]}>
              <Text style={styles.emojiMid}>🧒</Text>
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.heroTitle}>
            Add Friends
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(240).springify()} style={styles.heroSubtitle}>
            Who are {params.kidName}'s awesome friends?
          </Animated.Text>

          {/* Final step badge */}
          <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.finalBadge}>
            <Sparkles size={12} color="rgba(255,255,255,0.9)" strokeWidth={2} />
            <Text style={styles.finalBadgeText}>Last step — almost done!</Text>
          </Animated.View>
        </LinearGradient>

        {/* Input row */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputSection}>
          <View style={[
            styles.inputCard,
            { backgroundColor: themeColors.cardBackground },
            shake && { borderColor: themeColors.warning, borderWidth: 2 },
          ]}>
            <View style={[styles.inputIcon, { backgroundColor: successColor + '12' }]}>
              <UserPlus size={18} color={successColor} strokeWidth={2} />
            </View>
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
            <TouchableOpacity onPress={addFriend} activeOpacity={0.8} disabled={isLoading}>
              <LinearGradient
                colors={currentName.trim().length > 0
                  ? [successColor, successLight]
                  : [successColor + '40', successColor + '40']}
                style={styles.addBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Plus size={20} color="#FFFFFF" strokeWidth={3} />
              </LinearGradient>
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
            <Animated.View entering={FadeInDown.delay(340).springify()} style={styles.emptyState}>
              <View style={styles.emptyIconRow}>
                <View style={[styles.emptyDot, { backgroundColor: successColor + '10' }]}>
                  <Text style={styles.emptyDotEmoji}>👦</Text>
                </View>
                <View style={[styles.emptyDot, styles.emptyDotLarge, { backgroundColor: successColor + '18' }]}>
                  <Text style={styles.emptyDotEmojiLarge}>👫</Text>
                </View>
                <View style={[styles.emptyDot, { backgroundColor: successColor + '10' }]}>
                  <Text style={styles.emptyDotEmoji}>👧</Text>
                </View>
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
                <View style={[styles.friendCard, { backgroundColor: themeColors.cardBackground }]}>
                  <View style={[styles.friendAccent, { backgroundColor: successColor }]} />
                  <View style={[styles.friendEmojiBadge, { backgroundColor: successColor + '12' }]}>
                    <Text style={styles.friendEmoji}>
                      {FRIEND_EMOJIS[index % FRIEND_EMOJIS.length]}
                    </Text>
                  </View>
                  <Text style={[styles.friendName, { color: themeColors.text.primary }]} numberOfLines={1}>
                    {friend}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFriend(index)}
                    style={[styles.removeBtn, { backgroundColor: themeColors.error + '12' }]}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <X size={14} color={themeColors.error} strokeWidth={2.5} />
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
            activeOpacity={0.88}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#D1D5DB', '#D1D5DB'] : [successColor, successLight]}
              style={styles.ctaButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.ctaText}>
                    {friends.length > 0 ? `Start Adventures (${friends.length} friends)` : 'Start Adventures'}
                  </Text>
                  <Sparkles size={20} color="#FFFFFF" strokeWidth={2.5} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleComplete}
            activeOpacity={0.7}
            style={styles.skipLink}
            disabled={isLoading}
          >
            <Text style={[styles.skipText, { color: themeColors.text.light }]}>Skip this step</Text>
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
    paddingBottom: SPACING.xxl,
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
  emojiScene: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emojiCircle: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emojiCircleLarge: { width: 64, height: 64 },
  emojiCircleMid: { width: 52, height: 52 },
  emojiOverlapLeft: { marginLeft: -14 },
  emojiLarge: { fontSize: 30 },
  emojiMid: { fontSize: 24 },
  heroTitle: {
    fontSize: 26,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  finalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
  },
  finalBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.3,
  },
  inputSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.sm,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.sm,
  },
  emptyIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDotLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginHorizontal: -8,
    zIndex: 1,
  },
  emptyDotEmoji: { fontSize: 22 },
  emptyDotEmojiLarge: { fontSize: 30 },
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
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
    paddingVertical: SPACING.md,
    paddingRight: SPACING.md,
  },
  friendAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  friendEmojiBadge: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendEmoji: { fontSize: 24 },
  friendName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
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
  skipLink: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  skipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
});

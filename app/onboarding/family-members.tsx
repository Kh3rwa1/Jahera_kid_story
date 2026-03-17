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
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Users, ArrowLeft, Plus, ChevronRight } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, { FadeInDown, FadeInUp, FadeOutUp, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MEMBER_EMOJIS = ['👨', '👩', '👧', '👦', '👴', '👵'];

export default function FamilyMembers() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [shake, setShake] = useState(false);

  const addFamilyMember = async () => {
    const trimmed = currentName.trim();
    if (!trimmed.length) {
      setShake(true);
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => setShake(false), 600);
      return;
    }
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFamilyMembers([...familyMembers, trimmed]);
    setCurrentName('');
  };

  const removeFamilyMember = async (index: number) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const progressWidth = (3 / 4) * 100;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <LinearGradient
          colors={['#0F0F1A', '#1A0826', '#0A1628']}
          style={[styles.hero, { paddingTop: insets.top + SPACING.lg }]}
        >
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.progressTrack}>
              <Animated.View
                entering={FadeInDown.delay(100)}
                style={[styles.progressFill, { width: `${progressWidth}%`, backgroundColor: themeColors.primary }]}
              />
            </View>
            <Text style={styles.stepLabelText}>3 / 4</Text>
          </View>

          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.emojiScene}>
            <View style={[styles.emojiCircle, styles.emojiCircleLarge]}>
              <Text style={styles.emojiLarge}>👨</Text>
            </View>
            <View style={[styles.emojiCircle, styles.emojiCircleMid, styles.emojiOverlapLeft]}>
              <Text style={styles.emojiMid}>👩</Text>
            </View>
            <View style={[styles.emojiCircle, styles.emojiCircleSmall, styles.emojiOverlapRight]}>
              <Text style={styles.emojiSmall}>👧</Text>
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.heroTitle}>
            Add Family{'\n'}Members
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(240).springify()} style={styles.heroSubtitle}>
            Who joins {params.kidName} on adventures?
          </Animated.Text>
        </LinearGradient>

        {/* Input row */}
        <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.inputSection}>
          <View style={[
            styles.inputCard,
            { backgroundColor: themeColors.cardBackground },
            shake && { borderColor: themeColors.warning, borderWidth: 2 },
          ]}>
            <View style={[styles.inputIcon, { backgroundColor: themeColors.primary + '12' }]}>
              <Users size={18} color={themeColors.primary} strokeWidth={2} />
            </View>
            <TextInput
              style={[styles.input, { color: themeColors.text.primary }]}
              placeholder="Type a family member's name..."
              placeholderTextColor={themeColors.text.light}
              value={currentName}
              onChangeText={setCurrentName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={addFamilyMember}
            />
            <TouchableOpacity
              onPress={addFamilyMember}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={currentName.trim().length > 0
                  ? [themeColors.primary, themeColors.primaryDark]
                  : [themeColors.primary + '40', themeColors.primary + '40']}
                style={styles.addBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Plus size={20} color="#FFFFFF" strokeWidth={3} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Members list */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {familyMembers.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.emptyState}>
              <View style={[styles.emptyIconRow]}>
                <View style={[styles.emptyDot, { backgroundColor: themeColors.primary + '10' }]}>
                  <Text style={styles.emptyDotEmoji}>👴</Text>
                </View>
                <View style={[styles.emptyDot, styles.emptyDotLarge, { backgroundColor: themeColors.primary + '18' }]}>
                  <Text style={styles.emptyDotEmojiLarge}>👨‍👩‍👧‍👦</Text>
                </View>
                <View style={[styles.emptyDot, { backgroundColor: themeColors.primary + '10' }]}>
                  <Text style={styles.emptyDotEmoji}>👵</Text>
                </View>
              </View>
              <Text style={[styles.emptyTitle, { color: themeColors.text.primary }]}>No family members yet</Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.text.secondary }]}>
                Add parents, siblings, or grandparents
              </Text>
            </Animated.View>
          ) : (
            familyMembers.map((member, index) => (
              <Animated.View
                key={`${member}-${index}`}
                entering={ZoomIn.delay(index * 40).springify()}
                exiting={FadeOutUp.duration(200)}
              >
                <View style={[styles.memberCard, { backgroundColor: themeColors.cardBackground }]}>
                  <View style={[styles.memberAccent, { backgroundColor: themeColors.primary }]} />
                  <View style={[styles.memberEmojiBadge, { backgroundColor: themeColors.primary + '12' }]}>
                    <Text style={styles.memberEmoji}>
                      {MEMBER_EMOJIS[index % MEMBER_EMOJIS.length]}
                    </Text>
                  </View>
                  <Text style={[styles.memberName, { color: themeColors.text.primary }]} numberOfLines={1}>
                    {member}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFamilyMember(index)}
                    style={[styles.removeBtn, { backgroundColor: themeColors.error + '12' }]}
                    activeOpacity={0.7}
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
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.88}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.primaryDark]}
              style={styles.ctaButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.ctaText}>
                {familyMembers.length > 0 ? `Next Step (${familyMembers.length} added)` : 'Next Step'}
              </Text>
              <ChevronRight size={22} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipLink}>
            <Text style={[styles.skipText, { color: themeColors.text.light }]}>Skip this step</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },
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
  stepLabelText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  emojiCircleLarge: { width: 60, height: 60 },
  emojiCircleMid: { width: 56, height: 56 },
  emojiCircleSmall: { width: 48, height: 48 },
  emojiOverlapLeft: { marginLeft: -12, zIndex: 1 },
  emojiOverlapRight: { marginLeft: -12, zIndex: 0 },
  emojiLarge: { fontSize: 28 },
  emojiMid: { fontSize: 24 },
  emojiSmall: { fontSize: 20 },
  heroTitle: {
    fontSize: 28,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.8,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
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
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
    paddingVertical: SPACING.md,
    paddingRight: SPACING.md,
  },
  memberAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  memberEmojiBadge: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberEmoji: { fontSize: 24 },
  memberName: {
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
    backgroundColor: '#F7F8FA',
    borderTopWidth: 1,
    borderTopColor: '#EEEEF2',
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

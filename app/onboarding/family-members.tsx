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

const STEP_DOTS = [false, false, true, false];
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => setShake(false), 600);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFamilyMembers([...familyMembers, trimmed]);
    setCurrentName('');
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
          >
            <ArrowLeft size={20} color={themeColors.text.primary} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={[styles.iconCircle, { shadowColor: themeColors.primary }]}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.primaryDark]}
              style={styles.iconGradient}
            >
              <Users size={32} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            Add Family{'\n'}Members
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            Who joins {params.kidName} on adventures?
          </Text>

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

        {/* Input row */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.inputSection}>
          <View style={[
            styles.inputCard,
            { backgroundColor: themeColors.cardBackground, shadowColor: themeColors.primary },
            shake && { borderColor: themeColors.warning, borderWidth: 1.5 },
          ]}>
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
              style={[styles.addBtn, { backgroundColor: currentName.trim().length > 0 ? themeColors.primary : themeColors.primary + '40' }]}
              activeOpacity={0.8}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Members list */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {familyMembers.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: themeColors.primary + '12' }]}>
                <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
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
                <View style={[styles.memberCard, { backgroundColor: themeColors.cardBackground, shadowColor: themeColors.primary }]}>
                  <View style={[styles.memberEmojiBadge, { backgroundColor: themeColors.primary + '15' }]}>
                    <Text style={styles.memberEmoji}>
                      {MEMBER_EMOJIS[index % MEMBER_EMOJIS.length]}
                    </Text>
                  </View>
                  <Text style={[styles.memberName, { color: themeColors.text.primary }]} numberOfLines={1}>
                    {member}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFamilyMember(index)}
                    style={[styles.removeBtn, { backgroundColor: themeColors.error + '18' }]}
                    activeOpacity={0.7}
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
            onPress={handleSkip}
            style={[styles.skipBtn, { backgroundColor: themeColors.cardBackground }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipText, { color: themeColors.text.secondary }]}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.88} style={{ flex: 1 }}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.primaryDark]}
              style={styles.ctaButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.ctaText}>Next Step</Text>
              <ChevronRight size={22} color="#FFFFFF" strokeWidth={2.5} />
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
  memberCard: {
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
  memberEmojiBadge: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberEmoji: { fontSize: 22 },
  memberName: {
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

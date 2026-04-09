import { BORDER_RADIUS,FONTS,SHADOWS,SPACING } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { profileService } from '@/services/database';
import { getLanguageFlag } from '@/utils/languageUtils';
import { constantTimeEqual,hashPin,PinRateLimiter } from '@/utils/pinSecurity';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
ArrowLeft,
Award,
BookOpen,
Crown,
Eye,
EyeOff,
Flame,
Lock,
Shield,
Star,
Target,
TrendingUp
} from 'lucide-react-native';
import { useMemo,useState } from 'react';
import {
Alert,
ScrollView,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
useWindowDimensions,
View
} from 'react-native';
import Animated,{ FadeInDown,FadeInUp } from 'react-native-reanimated';
import { SafeAreaView,useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_PIN_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // SHA-256 for '1234'
const limiter = new PinRateLimiter(5, 60_000);

export default function ParentDashboard() {
  const router = useRouter();
  const { width: winWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const styles = useStyles();
  const { profile, stories, quizAttempts, subscription, streak } = useApp();

  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const savedPin = profile?.parent_pin || DEFAULT_PIN_HASH;

  const handleUnlock = async () => {
    if (limiter.isLocked()) {
      setPinError(`Too many attempts. Try again in ${limiter.getRemainingLockoutSeconds()}s`);
      return;
    }

    const inputHash = await hashPin(pin);
    if (constantTimeEqual(inputHash, savedPin)) {
      setUnlocked(true);
      setPinError('');
      limiter.recordSuccess();
    } else {
      limiter.recordFailure();
      const remaining = limiter.getAttemptsRemaining();
      setPinError(remaining > 0 
        ? `Incorrect PIN. ${remaining} attempts remaining.`
        : `Too many attempts. Locked for 1 minute.`
      );
      setPin('');
    }
  };

  const handleSavePin = async () => {
    if (newPin.length < 4) {
      Alert.alert('PIN too short', 'PIN must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('PINs do not match', 'Please make sure both PINs are the same.');
      return;
    }
    if (!profile) return;

    const hashed = await hashPin(newPin);
    await profileService.update(profile.id, { parent_pin: hashed });
    setIsSettingPin(false);
    setNewPin('');
    setConfirmPin('');
    Alert.alert('PIN Updated', 'Your parent PIN has been saved securely.');
  };

  const stats = useMemo(() => {
    const totalQuizzes = quizAttempts.length;
    const perfectScores = quizAttempts.filter(a => a.score === a.total_questions).length;
    const avgScore = totalQuizzes > 0
      ? Math.round(quizAttempts.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / totalQuizzes)
      : 0;
    const thisWeek = stories.filter(s => {
      const storyDate = new Date(s.generated_at || s.created_at);
      const now = new Date().getTime();
      const weekAgo = now - 7 * 86400000;
      return storyDate.getTime() > weekAgo;
    }).length;

    const storiesByLanguage = stories.reduce((acc, s) => {
      acc[s.language_code] = (acc[s.language_code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLanguage = Object.entries(storiesByLanguage).sort((a, b) => b[1] - a[1])[0];

    return { totalQuizzes, perfectScores, avgScore, thisWeek, storiesByLanguage, topLanguage };
  }, [stories, quizAttempts]);

  const recentActivity = useMemo(() => {
    return stories.slice(0, 7).map(story => {
      const attempt = quizAttempts.find(a => a.story_id === story.id);
      return { story, attempt };
    });
  }, [stories, quizAttempts]);

  if (!unlocked) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: COLORS.cardBackground, top: insets.top + (SPACING.sm || 12) }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={COLORS.text.primary} />
        </TouchableOpacity>

        <View style={styles.lockScreen}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.lockIconWrap}>
            <LinearGradient
              colors={COLORS.gradients.primary}
              style={styles.lockIconCircle}
            >
              <Shield size={40} color="#FFFFFF" strokeWidth={1.5} />
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.lockContent}>
            <Text style={[styles.lockTitle, { color: COLORS.text.primary }]}>Parent Dashboard</Text>
            <Text style={[styles.lockSubtitle, { color: COLORS.text.secondary }]}>
              Enter your parent PIN to view detailed learning stats
            </Text>

            <View style={[styles.pinInputWrap, { backgroundColor: COLORS.cardBackground, borderColor: pinError ? COLORS.error : COLORS.text.light + '30' }]}>
              <Lock size={18} color={COLORS.text.light} />
              <TextInput
                style={[styles.pinInput, { color: COLORS.text.primary }]}
                placeholder="Enter PIN"
                placeholderTextColor={COLORS.text.light}
                value={pin}
                onChangeText={setPin}
                secureTextEntry={!showPin}
                keyboardType="numeric"
                maxLength={8}
                onSubmitEditing={handleUnlock}
              />
              <TouchableOpacity onPress={() => setShowPin(v => !v)}>
                {showPin
                  ? <EyeOff size={18} color={COLORS.text.light} />
                  : <Eye size={18} color={COLORS.text.light} />
                }
              </TouchableOpacity>
            </View>

            {pinError ? (
              <Text style={[styles.pinError, { color: COLORS.error }]}>{pinError}</Text>
            ) : null}

            <TouchableOpacity onPress={handleUnlock} activeOpacity={0.9}>
              <LinearGradient
                colors={COLORS.gradients.primary}
                style={[styles.unlockButton, { width: Math.min(winWidth * 0.8, 300) }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.unlockButtonText}>Unlock</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.defaultPinHint, { color: COLORS.text.light }]}>
              Default PIN: 1234
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + (SPACING.sm || 12) }]}>
        <TouchableOpacity
          style={[styles.backBtnHeader, { backgroundColor: COLORS.cardBackground }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: COLORS.text.primary }]}>Parent Dashboard</Text>
          <Text style={[styles.headerSub, { color: COLORS.text.secondary }]}>
            {profile?.kid_name}'s learning overview
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.pinBtn, { backgroundColor: COLORS.cardBackground }]}
          onPress={() => setIsSettingPin(v => !v)}
        >
          <Lock size={18} color={COLORS.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {subscription && (
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <LinearGradient
              colors={subscription.plan !== 'free' ? COLORS.gradients.sunset : COLORS.gradients.primary}
              style={styles.subscriptionBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={24} color="#FFFFFF" />
              <View style={styles.subscriptionBannerContent}>
                <Text style={styles.subscriptionBannerTitle}>
                  {subscription.plan === 'free' ? 'Free Plan' :
                   subscription.plan === 'pro' ? 'Pro Plan' : 'Family Plan'}
                </Text>
                <Text style={styles.subscriptionBannerSub}>
                  {subscription.plan === 'free'
                    ? `${subscription.stories_remaining} stories remaining this month`
                    : 'Unlimited stories every month'}
                </Text>
              </View>
              {subscription.plan === 'free' && (
                <TouchableOpacity
                  onPress={() => router.push('/paywall')}
                  style={styles.upgradeBannerBtn}
                >
                  <Text style={styles.upgradeBannerBtnText}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </Animated.View>
        )}

          <Animated.View
            entering={FadeInDown.delay(120).springify()}
            style={[styles.statsGrid, { flexWrap: winWidth < 400 ? 'wrap' : 'nowrap' }]}
          >
            <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground, minWidth: winWidth < 400 ? '46%' : 0 }]}>
            <View style={[styles.statIconWrap, { backgroundColor: COLORS.primary + '15' }]}>
              <BookOpen size={20} color={COLORS.primary} />
            </View>
            <Text style={[styles.statValue, { color: COLORS.text.primary }]}>{stories.length}</Text>
            <Text style={[styles.statLabel, { color: COLORS.text.secondary }]}>Total Stories</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F59E0B15' }]}>
              <Flame size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: COLORS.text.primary }]}>
              {streak?.current_streak || 0}
            </Text>
            <Text style={[styles.statLabel, { color: COLORS.text.secondary }]}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIconWrap, { backgroundColor: COLORS.success + '15' }]}>
              <Award size={20} color={COLORS.success} />
            </View>
            <Text style={[styles.statValue, { color: COLORS.text.primary }]}>{stats.totalQuizzes}</Text>
            <Text style={[styles.statLabel, { color: COLORS.text.secondary }]}>Quizzes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIconWrap, { backgroundColor: COLORS.info + '15' }]}>
              <Target size={20} color={COLORS.info} />
            </View>
            <Text style={[styles.statValue, { color: COLORS.text.primary }]}>{stats.avgScore}%</Text>
            <Text style={[styles.statLabel, { color: COLORS.text.secondary }]}>Avg Score</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>This Week</Text>
          <View style={[styles.weekCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={styles.weekRow}>
              <View style={[styles.weekIconWrap, { backgroundColor: COLORS.primary + '12' }]}>
                <BookOpen size={18} color={COLORS.primary} />
              </View>
              <View style={styles.weekInfo}>
                <Text style={[styles.weekLabel, { color: COLORS.text.primary }]}>Stories Read</Text>
                <View style={[styles.weekProgress, { backgroundColor: COLORS.text.light + '20' }]}>
                  <View style={[styles.weekProgressFill, {
                    backgroundColor: COLORS.primary,
                    width: `${Math.min(100, (stats.thisWeek / 7) * 100)}%`,
                  }]} />
                </View>
              </View>
              <Text style={[styles.weekCount, { color: COLORS.text.primary }]}>{stats.thisWeek}</Text>
            </View>
            <View style={styles.weekRow}>
              <View style={[styles.weekIconWrap, { backgroundColor: COLORS.success + '12' }]}>
                <Star size={18} color={COLORS.success} />
              </View>
              <View style={styles.weekInfo}>
                <Text style={[styles.weekLabel, { color: COLORS.text.primary }]}>Perfect Scores</Text>
                <View style={[styles.weekProgress, { backgroundColor: COLORS.text.light + '20' }]}>
                  <View style={[styles.weekProgressFill, {
                    backgroundColor: COLORS.success,
                    width: `${stats.totalQuizzes > 0 ? (stats.perfectScores / stats.totalQuizzes) * 100 : 0}%`,
                  }]} />
                </View>
              </View>
              <Text style={[styles.weekCount, { color: COLORS.text.primary }]}>{stats.perfectScores}</Text>
            </View>
            {streak && (
              <View style={styles.weekRow}>
                <View style={[styles.weekIconWrap, { backgroundColor: '#F59E0B12' }]}>
                  <TrendingUp size={18} color="#F59E0B" />
                </View>
                <View style={styles.weekInfo}>
                  <Text style={[styles.weekLabel, { color: COLORS.text.primary }]}>Longest Streak</Text>
                  <View style={[styles.weekProgress, { backgroundColor: COLORS.text.light + '20' }]}>
                    <View style={[styles.weekProgressFill, {
                      backgroundColor: '#F59E0B',
                      width: `${Math.min(100, (streak.longest_streak / 30) * 100)}%`,
                    }]} />
                  </View>
                </View>
                <Text style={[styles.weekCount, { color: COLORS.text.primary }]}>
                  {streak.longest_streak}d
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {profile?.languages && profile.languages.length > 0 && (
          <Animated.View entering={FadeInUp.delay(240).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Languages Practiced</Text>
            <View style={[styles.languagesCard, { backgroundColor: COLORS.cardBackground }]}>
              {profile.languages.map((lang, idx) => {
                const count = stats.storiesByLanguage[lang.language_code] || 0;
                const counts = Object.values(stats.storiesByLanguage);
                const maxCount = counts.length > 0 ? Math.max(1, ...counts) : 1;
                return (
                  <View key={lang.id} style={[styles.langRow, idx > 0 && { borderTopWidth: 1, borderTopColor: COLORS.text.light + '15' }]}>
                    <Text style={styles.langFlag}>{getLanguageFlag(lang.language_code)}</Text>
                    <View style={styles.langInfo}>
                      <Text style={[styles.langName, { color: COLORS.text.primary }]}>{lang.language_name}</Text>
                      <View style={[styles.langBar, { backgroundColor: COLORS.text.light + '20' }]}>
                        <View style={[styles.langBarFill, {
                          backgroundColor: COLORS.primary,
                          width: `${Math.max(5, (count / maxCount) * 100)}%`,
                        }]} />
                      </View>
                    </View>
                    <Text style={[styles.langCount, { color: COLORS.text.secondary }]}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {recentActivity.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Recent Activity</Text>
            <View style={styles.activityList}>
              {recentActivity.map(({ story, attempt }) => (
                <View
                  key={story.id}
                  style={[styles.activityRow, { backgroundColor: COLORS.cardBackground }]}
                >
                  <View style={[styles.activityEmoji]}>
                    <Text style={styles.activityEmojiText}>
                      {story.theme === 'space' ? '🚀' :
                       story.theme === 'fantasy' ? '🐉' :
                       story.theme === 'animals' ? '🦁' :
                       story.theme === 'ocean' ? '🌊' :
                       story.theme === 'superheroes' ? '🦸' :
                       story.theme === 'science' ? '🔬' : '📖'}
                    </Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityTitle, { color: COLORS.text.primary }]} numberOfLines={1}>
                      {story.title}
                    </Text>
                    <View style={styles.activityMeta}>
                      <Text style={styles.activityFlag}>{getLanguageFlag(story.language_code)}</Text>
                      {attempt && (
                        <Text style={[styles.activityScore, {
                          color: attempt.score === attempt.total_questions ? COLORS.success : COLORS.text.secondary,
                        }]}>
                          {Math.round((attempt.score / attempt.total_questions) * 100)}%
                        </Text>
                      )}
                    </View>
                  </View>
                  {attempt?.score === attempt?.total_questions && (
                    <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {isSettingPin && (
          <Animated.View entering={FadeInUp.springify()} style={[styles.section, styles.pinSection]}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Change Parent PIN</Text>
            <View style={[styles.pinFormCard, { backgroundColor: COLORS.cardBackground }]}>
              <TextInput
                style={[styles.pinFormInput, { color: COLORS.text.primary, borderColor: COLORS.text.light + '40' }]}
                placeholder="New PIN (4+ digits)"
                placeholderTextColor={COLORS.text.light}
                value={newPin}
                onChangeText={setNewPin}
                secureTextEntry
                keyboardType="numeric"
                maxLength={8}
              />
              <TextInput
                style={[styles.pinFormInput, { color: COLORS.text.primary, borderColor: COLORS.text.light + '40' }]}
                placeholder="Confirm PIN"
                placeholderTextColor={COLORS.text.light}
                value={confirmPin}
                onChangeText={setConfirmPin}
                secureTextEntry
                keyboardType="numeric"
                maxLength={8}
              />
              <TouchableOpacity onPress={handleSavePin} activeOpacity={0.8}>
                <View style={[styles.savePinBtn, { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.savePinBtnText}>Save PIN</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center', ...SHADOWS.xs,
      position: 'absolute', left: SPACING.xl, zIndex: 10,
    },
    backBtnHeader: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center', ...SHADOWS.xs,
    },
    headerText: { flex: 1 },
    headerTitle: { fontSize: 20, fontFamily: FONTS.bold },
    headerSub: { fontSize: 13, fontFamily: FONTS.medium },
    pinBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center', ...SHADOWS.xs,
    },
    scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
    subscriptionBanner: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
      padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl, marginBottom: SPACING.xl, ...SHADOWS.md,
    },
    subscriptionBannerContent: { flex: 1 },
    subscriptionBannerTitle: { fontSize: 15, fontFamily: FONTS.bold, color: '#FFFFFF' },
    subscriptionBannerSub: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.85)' },
    upgradeBannerBtn: {
      backgroundColor: 'rgba(255,255,255,0.25)',
      paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.pill,
    },
    upgradeBannerBtnText: { fontSize: 12, fontFamily: FONTS.bold, color: '#FFFFFF' },
    statsGrid: {
      flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xxl,
    },
    statCard: {
      flex: 1, alignItems: 'center', paddingVertical: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg, gap: 4, ...SHADOWS.xs,
    },
    statIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 18, fontFamily: FONTS.bold },
    statLabel: { fontSize: 10, fontFamily: FONTS.medium, textAlign: 'center' },
    section: { marginBottom: SPACING.xxl },
    sectionTitle: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: SPACING.md },
    weekCard: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, gap: SPACING.md, ...SHADOWS.sm },
    weekRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    weekIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    weekInfo: { flex: 1, gap: 6 },
    weekLabel: { fontSize: 13, fontFamily: FONTS.medium },
    weekProgress: { height: 4, borderRadius: 2, overflow: 'hidden' },
    weekProgressFill: { height: '100%', borderRadius: 2 },
    weekCount: { fontSize: 16, fontFamily: FONTS.bold, minWidth: 32, textAlign: 'right' },
    languagesCard: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, ...SHADOWS.sm },
    langRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
    langFlag: { fontSize: 20 },
    langInfo: { flex: 1, gap: 6 },
    langName: { fontSize: 14, fontFamily: FONTS.semibold },
    langBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
    langBarFill: { height: '100%', borderRadius: 2 },
    langCount: { fontSize: 14, fontFamily: FONTS.semibold, minWidth: 24, textAlign: 'right' },
    activityList: { gap: SPACING.sm },
    activityRow: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
      padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, ...SHADOWS.xs,
    },
    activityEmoji: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    activityEmojiText: { fontSize: 22 },
    activityInfo: { flex: 1, gap: 2 },
    activityTitle: { fontSize: 14, fontFamily: FONTS.semibold },
    activityMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    activityFlag: { fontSize: 14 },
    activityScore: { fontSize: 12, fontFamily: FONTS.bold },
    pinSection: { marginTop: SPACING.md },
    pinFormCard: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, gap: SPACING.md, ...SHADOWS.sm },
    pinFormInput: {
      borderWidth: 1.5, borderRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
      fontSize: 16, fontFamily: FONTS.medium,
    },
    savePinBtn: {
      alignItems: 'center', paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
    },
    savePinBtnText: { fontSize: 15, fontFamily: FONTS.bold, color: '#FFFFFF' },
    lockScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
    lockIconWrap: { marginBottom: SPACING.xxl },
    lockIconCircle: {
      width: 96, height: 96, borderRadius: 48,
      alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg,
    },
    lockContent: { width: '100%', maxWidth: 340, alignItems: 'center', gap: SPACING.lg },
    lockTitle: { fontSize: 26, fontFamily: FONTS.bold, textAlign: 'center' },
    lockSubtitle: { fontSize: 15, fontFamily: FONTS.medium, textAlign: 'center', lineHeight: 22 },
    pinInputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
      width: '100%', borderWidth: 1.5, borderRadius: BORDER_RADIUS.xl,
      paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    },
    pinInput: { flex: 1, fontSize: 18, fontFamily: FONTS.semibold, letterSpacing: 4 },
    pinError: { fontSize: 13, fontFamily: FONTS.medium },
    unlockButton: {
      alignItems: 'center', justifyContent: 'center',
      paddingVertical: SPACING.xl, borderRadius: BORDER_RADIUS.pill, ...SHADOWS.md,
    },
    unlockButtonText: { fontSize: 16, fontFamily: FONTS.bold, color: '#FFFFFF' },
    defaultPinHint: { fontSize: 12, fontFamily: FONTS.medium },
  });
};

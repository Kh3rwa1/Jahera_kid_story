import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES, MAX_LANGUAGES, Language } from '@/constants/languages';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Globe as Globe2, ChevronRight, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LanguageSelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

  const ring1 = useSharedValue(1);
  const ring2 = useSharedValue(1);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    ring1.value = withRepeat(
      withSequence(withTiming(1.5, { duration: 2200 }), withTiming(1, { duration: 2200 })),
      -1, true
    );
    ring2.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(1.3, { duration: 2600 }), withTiming(1, { duration: 1400 })),
      -1, true
    );
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1.value }],
    opacity: interpolate(ring1.value, [1, 1.5], [0.22, 0]),
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2.value }],
    opacity: interpolate(ring2.value, [1, 1.3], [0.3, 0]),
  }));
  const btnAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const toggleLanguage = async (language: Language) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isSelected = selectedLanguages.some(l => l.code === language.code);
    if (isSelected) {
      setSelectedLanguages(selectedLanguages.filter(l => l.code !== language.code));
    } else {
      if (selectedLanguages.length >= MAX_LANGUAGES) {
        if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const handleContinue = async () => {
    if (selectedLanguages.length === 0) {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    btnScale.value = withSequence(withSpring(0.95, { damping: 12 }), withSpring(1, { damping: 12 }));
    setTimeout(() => {
      router.push({
        pathname: '/onboarding/kid-name',
        params: { languages: JSON.stringify(selectedLanguages.map(l => ({ code: l.code, name: l.name }))) },
      });
    }, 80);
  };

  const canContinue = selectedLanguages.length > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#0F0F1A', '#1A0826', '#0A1628']}
        style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}
      >
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <Animated.View
              entering={FadeInDown.delay(100)}
              style={[styles.progressFill, { width: '25%', backgroundColor: themeColors.primary }]}
            />
          </View>
          <Text style={styles.stepBadge}>1 / 4</Text>
        </View>

        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.iconZone}>
          <Animated.View style={[styles.ring, ring1Style, { borderColor: themeColors.primary + '60' }]} />
          <Animated.View style={[styles.ring, styles.ringInner, ring2Style, { borderColor: themeColors.primary + '80' }]} />
          <LinearGradient
            colors={[themeColors.primary, themeColors.primaryDark]}
            style={styles.iconCircle}
          >
            <Globe2 size={32} color="#FFFFFF" strokeWidth={1.8} />
          </LinearGradient>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(260).springify()} style={styles.headerTitle}>
          Choose Your Languages
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(310).springify()} style={styles.headerSubtitle}>
          Stories will be crafted in the languages{'\n'}your child loves most
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(360).springify()} style={styles.selectionRow}>
          {Array.from({ length: MAX_LANGUAGES }).map((_, i) => {
            const filled = i < selectedLanguages.length;
            return (
              <View
                key={i}
                style={[
                  styles.selDot,
                  filled
                    ? { backgroundColor: themeColors.primary }
                    : { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
                ]}
              >
                {filled && <Check size={10} color="#FFFFFF" strokeWidth={3.5} />}
              </View>
            );
          })}
          <Text style={styles.selText}>
            {selectedLanguages.length === 0
              ? 'Select up to 3'
              : selectedLanguages.length === 1
                ? '1 selected'
                : `${selectedLanguages.length} selected`}
          </Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {SUPPORTED_LANGUAGES.map((language, index) => {
          const isSelected = selectedLanguages.some(l => l.code === language.code);
          return (
            <Animated.View
              key={language.code}
              entering={FadeInDown.delay(60 + index * 35).springify()}
            >
              <TouchableOpacity
                onPress={() => toggleLanguage(language)}
                activeOpacity={0.75}
              >
                <View style={[
                  styles.langCard,
                  isSelected
                    ? { backgroundColor: themeColors.primary + '10', borderColor: themeColors.primary, borderWidth: 1.5 }
                    : { backgroundColor: '#FFFFFF', borderColor: '#F0F0F5', borderWidth: 1 },
                ]}>
                  {isSelected && (
                    <View style={[styles.cardBar, { backgroundColor: themeColors.primary }]} />
                  )}
                  <View style={[
                    styles.flagWrap,
                    { backgroundColor: isSelected ? themeColors.primary + '15' : '#F7F8FA' },
                  ]}>
                    <Text style={styles.flagEmoji}>{language.flag}</Text>
                  </View>
                  <View style={styles.langDetails}>
                    <Text style={[styles.langName, { color: isSelected ? themeColors.primary : '#1A1A2E' }]}>
                      {language.name}
                    </Text>
                    <Text style={[styles.langNative, { color: isSelected ? themeColors.primary + 'AA' : '#9CA3AF' }]}>
                      {language.nativeName}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Animated.View entering={ZoomIn.springify()} style={[styles.checkBubble, { backgroundColor: themeColors.primary }]}>
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    </Animated.View>
                  ) : (
                    <View style={[styles.emptyCheck, { borderColor: '#E5E7EB' }]} />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        <View style={{ height: 110 }} />
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(300).springify()}
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
      >
        <Animated.View style={btnAnimStyle}>
          <TouchableOpacity onPress={handleContinue} disabled={!canContinue} activeOpacity={0.88}>
            <LinearGradient
              colors={canContinue ? [themeColors.primary, themeColors.primaryDark] : ['#E5E7EB', '#E5E7EB']}
              style={styles.ctaBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.ctaBtnText, !canContinue && { color: '#9CA3AF' }]}>
                {canContinue
                  ? `Continue with ${selectedLanguages.length} language${selectedLanguages.length > 1 ? 's' : ''}`
                  : 'Select at least one language'}
              </Text>
              {canContinue && <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },
  progressWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
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
  stepBadge: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  iconZone: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  ring: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
  },
  ringInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.xl,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semibold,
    color: 'rgba(255,255,255,0.65)',
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
  },
  flagWrap: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEmoji: { fontSize: 28 },
  langDetails: { flex: 1 },
  langName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  langNative: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  checkBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    backgroundColor: '#F7F8FA',
    borderTopWidth: 1,
    borderTopColor: '#EEEEF2',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
});

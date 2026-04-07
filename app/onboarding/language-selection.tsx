import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { SUPPORTED_LANGUAGES, MAX_LANGUAGES, Language } from '@/constants/languages';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONTS, SHADOWS } from '@/constants/theme';
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
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { ChevronRight, Check, Sparkles, Search, MapPin, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNarrationAudio } from '@/hooks/useNarrationAudio';
import { BrandVideoBackground } from '@/components/BrandVideoBackground';

function ProgressDot({ active, styles }: { active: boolean; styles: any }) {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
    transform: [{ scale: withSpring(active ? 1.2 : 1) }],
  }), [active]);

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

// ── Country → Language mapping ───────────────────────────────────────────────
// Maps ISO 3166 country names to language codes that are commonly spoken there.
// This is used to surface relevant languages at the top of the list.
const COUNTRY_LANGUAGES: Record<string, string[]> = {
  // English-speaking
  'United States': ['en', 'es'],
  'United Kingdom': ['en'],
  'Canada': ['en', 'fr'],
  'Australia': ['en'],
  'New Zealand': ['en'],
  'Ireland': ['en'],
  'South Africa': ['en'],
  'Singapore': ['en', 'zh'],
  // South Asia
  'India': ['hi', 'en', 'bn', 'sat'],
  'Bangladesh': ['bn', 'en'],
  'Pakistan': ['en', 'ar', 'hi'],
  'Nepal': ['hi', 'en'],
  'Sri Lanka': ['en'],
  // East Asia
  'China': ['zh', 'en'],
  'Japan': ['ja', 'en'],
  'South Korea': ['ko', 'en'],
  'Taiwan': ['zh', 'en'],
  'Hong Kong': ['zh', 'en'],
  // Southeast Asia
  'Philippines': ['en'],
  'Malaysia': ['en', 'zh'],
  // Spanish-speaking
  'Spain': ['es', 'en'],
  'Mexico': ['es', 'en'],
  'Argentina': ['es', 'pt'],
  'Colombia': ['es'],
  'Chile': ['es'],
  'Peru': ['es'],
  'Venezuela': ['es'],
  'Ecuador': ['es'],
  'Cuba': ['es'],
  // Portuguese
  'Brazil': ['pt', 'es'],
  'Portugal': ['pt', 'es'],
  // French-speaking
  'France': ['fr', 'en'],
  'Belgium': ['fr', 'nl', 'de'],
  'Switzerland': ['de', 'fr', 'it'],
  'Luxembourg': ['fr', 'de'],
  // German-speaking
  'Germany': ['de', 'en'],
  'Austria': ['de'],
  // Italian
  'Italy': ['it', 'en'],
  // Russian
  'Russia': ['ru', 'en'],
  'Ukraine': ['ru', 'en'],
  'Belarus': ['ru'],
  'Kazakhstan': ['ru'],
  // Arabic
  'Saudi Arabia': ['ar', 'en'],
  'United Arab Emirates': ['ar', 'en'],
  'Egypt': ['ar', 'en'],
  'Qatar': ['ar', 'en'],
  'Kuwait': ['ar', 'en'],
  'Oman': ['ar', 'en'],
  'Bahrain': ['ar', 'en'],
  'Jordan': ['ar', 'en'],
  'Lebanon': ['ar', 'fr', 'en'],
  'Iraq': ['ar', 'en'],
  'Morocco': ['ar', 'fr'],
  'Algeria': ['ar', 'fr'],
  'Tunisia': ['ar', 'fr'],
  // Turkish
  'Turkey': ['tr', 'en'],
  'Türkiye': ['tr', 'en'],
  // Nordic
  'Sweden': ['sv', 'en'],
  'Norway': ['no', 'en'],
  'Denmark': ['da', 'en'],
  'Finland': ['fi', 'sv', 'en'],
  'Iceland': ['en', 'da'],
  // Other European
  'Netherlands': ['nl', 'en'],
  'Poland': ['pl', 'en'],
  'Greece': ['el', 'en'],
};

export default function LanguageSelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const styles = useStyles(C, insets, winWidth);
  const { speak } = useNarrationAudio('language-selection');
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyLanguageCodes, setNearbyLanguageCodes] = useState<string[]>([]);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const btnScale = useSharedValue(1);

  // ── Request location & detect nearby languages ──────────────────────────
  useEffect(() => {
    let isMounted = true;

    const detectLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setLocationLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low, // Low accuracy is fine — we only need the country
        });

        const [place] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (isMounted && place?.country) {
          const country = place.country;
          const codes = COUNTRY_LANGUAGES[country] || [];
          setNearbyLanguageCodes(codes);
          setLocationName(place.city || place.region || country);
        }
      } catch (e) {
        console.log('[Language Selection] Location detection failed:', e);
      } finally {
        if (isMounted) setLocationLoading(false);
      }
    };

    detectLocation();
    return () => { isMounted = false; };
  }, []);

  // Welcome narration
  useEffect(() => {
    const timer = setTimeout(() => {
      speak("Hi there! Which languages should we use for your stories?", 'en');
    }, 800);
    return () => clearTimeout(timer);
  }, [speak]);

  const btnAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const toggleLanguage = async (language: Language) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isSelected = selectedLanguages.some(l => l.code === language.code);
    if (isSelected) {
      setSelectedLanguages(selectedLanguages.filter(l => l.code !== language.code));
    } else {
      if (selectedLanguages.length >= MAX_LANGUAGES) {
        if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      const newSelection = [...selectedLanguages, language];
      setSelectedLanguages(newSelection);
      // Satisfying success haptic on first language selection
      if (newSelection.length === 1 && Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      speak(language.name, language.code);
    }
  };

  const handleContinue = async () => {
    if (selectedLanguages.length === 0) {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    btnScale.value = withSequence(withSpring(0.92, { damping: 10 }), withSpring(1, { damping: 12 }));
    Keyboard.dismiss();
    setTimeout(() => {
      router.push({
        pathname: '/onboarding/kid-name',
        params: { languages: JSON.stringify(selectedLanguages.map(l => ({ code: l.code, name: l.name }))) },
      });
    }, 150);
  };

  const canContinue = selectedLanguages.length > 0;

  // ── Filter & sort languages ─────────────────────────────────────────────
  const sortedLanguages = useMemo(() => {
    let list = [...SUPPORTED_LANGUAGES];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          l.nativeName.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q)
      );
    }

    // Sort: nearby languages first, then the rest alphabetically
    if (nearbyLanguageCodes.length > 0) {
      list.sort((a, b) => {
        const aIdx = nearbyLanguageCodes.indexOf(a.code);
        const bIdx = nearbyLanguageCodes.indexOf(b.code);
        const aIsNearby = aIdx >= 0;
        const bIsNearby = bIdx >= 0;

        if (aIsNearby && bIsNearby) return aIdx - bIdx; // preserve order from mapping
        if (aIsNearby) return -1;
        if (bIsNearby) return 1;
        return 0; // keep original order for the rest
      });
    }

    return list;
  }, [searchQuery, nearbyLanguageCodes]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <BrandVideoBackground videoId="onboarding_video" fallbackSource={require('@/assets/jahera.mp4')} overlayOpacity={0.25} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <View style={styles.topRow}>
            <View style={styles.progressContainer}>
              <View style={styles.progressLineOuter}>
                <Animated.View 
                  entering={FadeInDown.delay(200)}
                  style={[styles.progressFill, { width: '25%', backgroundColor: '#FFFFFF' }]} 
                />
              </View>
              <Text style={styles.progressText}>JOURNEY START</Text>
            </View>
          </View>

          <View style={styles.heroSection}>
            <LottieView
              source={{ uri: 'https://lottie.host/76cc96a6-f13e-436d-963d-4c3822295cf7/l9GzB6p7Qk.json' }}
              autoPlay
              loop
              style={styles.lottieGlobe}
            />
            <Animated.View entering={ZoomIn.delay(400).springify()} style={styles.sparkleIcon}>
              <Sparkles size={28} color="#FFD700" fill="#FFD700" />
            </Animated.View>
          </View>

          <Animated.Text entering={FadeInUp.delay(300).springify()} style={styles.title}>
            Choose Your Tongue
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(400).springify()} style={styles.subtitle}>
            Select the languages for your magical{'\n'}adventure to begin.
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.selectionPill}>
             <View style={styles.pillGlow} />
            <Text style={styles.selectionLabel}>
              {selectedLanguages.length === 0 
                ? 'Pick up to 3' 
                : `${selectedLanguages.length} Language${selectedLanguages.length > 1 ? 's' : ''} Selected`}
            </Text>
            <View style={styles.dotRow}>
              {[0, 1, 2].map(i => (
                <ProgressDot key={String(i)} active={i < selectedLanguages.length} styles={styles} />
              ))}
            </View>
          </Animated.View>
        </View>

        {/* ── Search Bar ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(550).springify()} style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={18} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search languages..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} hitSlop={12}>
                <View style={styles.clearBtn}>
                  <X size={14} color="rgba(255,255,255,0.7)" strokeWidth={3} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Location indicator */}
          {locationLoading ? (
            <View style={styles.locationChip}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
              <Text style={styles.locationChipText}>Detecting location...</Text>
            </View>
          ) : locationName && nearbyLanguageCodes.length > 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.locationChip}>
              <MapPin size={12} color="#34D399" strokeWidth={2.5} />
              <Text style={styles.locationChipText}>
                Near <Text style={styles.locationChipBold}>{locationName}</Text>
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>

        {/* ── Language List ───────────────────────────────────────────── */}
        <View style={styles.listSection}>
          {sortedLanguages.length === 0 ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.emptySearch}>
              <Text style={styles.emptySearchEmoji}>🔍</Text>
              <Text style={styles.emptySearchText}>No languages match "{searchQuery}"</Text>
              <TouchableOpacity onPress={clearSearch}>
                <Text style={styles.emptySearchClear}>Clear search</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            sortedLanguages.map((lang, idx) => {
              const isSelected = selectedLanguages.some(l => l.code === lang.code);
              const isNearby = nearbyLanguageCodes.includes(lang.code);
              return (
                <Animated.View 
                  key={lang.code}
                  entering={FadeInDown.delay(600 + idx * 50).springify().damping(12)}
                >
                  <TouchableOpacity
                    onPress={() => toggleLanguage(lang)}
                    activeOpacity={0.85}
                    style={[
                      styles.card,
                      isSelected && styles.cardSelected,
                      isNearby && !isSelected && styles.cardNearby,
                    ]}
                  >
                    <View style={[styles.flagCircle, { backgroundColor: isSelected ? C.primary + '15' : '#F8FAFC' }]}>
                      <Text style={styles.flagEmoji}>{lang.flag}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.cardNameRow}>
                        <Text style={[styles.langName, { color: isSelected ? C.primary : C.text.primary }]}>
                          {lang.name}
                        </Text>
                        {isNearby && (
                          <View style={styles.nearbyBadge}>
                            <MapPin size={9} color="#059669" strokeWidth={3} />
                            <Text style={styles.nearbyBadgeText}>Nearby</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.langNative}>{lang.nativeName}</Text>
                    </View>
                    {isSelected ? (
                      <Animated.View entering={ZoomIn.springify()} style={[styles.checkCircle, { backgroundColor: C.primary }]}>
                        <Check size={18} color="#FFFFFF" strokeWidth={3} />
                      </Animated.View>
                    ) : (
                      <View style={styles.emptyCheck} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Animated.View 
        entering={FadeInUp.delay(300).springify()}
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
      >
        <LinearGradient
           colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
           style={styles.footerGradient}
        />
        <Animated.View style={btnAnimStyle}>
          <TouchableOpacity 
            onPress={handleContinue} 
            disabled={!canContinue} 
            activeOpacity={0.9}
            style={styles.ctaWrapper}
          >
            <LinearGradient
              colors={canContinue ? ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.95)'] : ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.4)']}
              style={styles.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.ctaText, { color: canContinue ? C.primaryDark : '#CBD5E1' }]}>
                {canContinue ? 'Continue Journey' : 'Choose a Language'}
              </Text>
              {canContinue && (
                <View style={[styles.ctaArrow, { backgroundColor: C.primary + '15' }]}>
                   <ChevronRight size={22} color={C.primaryDark} strokeWidth={3} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const useStyles = (C: any, insets: any, winWidth: number) => {
  return useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: {
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.xl,
      alignItems: 'center',
      overflow: 'hidden',
    },
    topRow: {
      width: '100%',
      marginBottom: SPACING.xl,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    progressLineOuter: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 10,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
      letterSpacing: 1.5,
      opacity: 0.8,
    },
    heroSection: {
      position: 'relative',
      width: 140,
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.sm,
    },
    lottieGlobe: {
      width: 180,
      height: 180,
    },
    sparkleIcon: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
    title: {
      fontSize: 32,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 6,
      letterSpacing: -0.5,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 10,
    },
    subtitle: {
      fontSize: 15,
      fontFamily: FONTS.medium,
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: SPACING.lg,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    selectionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 30,
      gap: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    pillGlow: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#FFFFFF',
      opacity: 0.05,
      borderRadius: 30,
    },
    selectionLabel: {
      fontSize: 14,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    dotRow: {
      flexDirection: 'row',
      gap: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    // ── Search ──────────────────────────────────────────────────
    searchSection: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.lg,
      gap: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 22,
      paddingHorizontal: 18,
      height: 52,
      gap: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: FONTS.medium,
      color: '#FFFFFF',
      height: '100%',
    },
    clearBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    locationChipText: {
      fontSize: 12,
      fontFamily: FONTS.medium,
      color: 'rgba(255,255,255,0.65)',
    },
    locationChipBold: {
      fontFamily: FONTS.extrabold,
      color: 'rgba(255,255,255,0.85)',
    },

    // ── Empty search ────────────────────────────────────────────
    emptySearch: {
      alignItems: 'center',
      paddingVertical: 48,
      gap: 10,
    },
    emptySearchEmoji: {
      fontSize: 40,
      marginBottom: 4,
    },
    emptySearchText: {
      fontSize: 16,
      fontFamily: FONTS.medium,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
    },
    emptySearchClear: {
      fontSize: 14,
      fontFamily: FONTS.extrabold,
      color: '#60A5FA',
      marginTop: 4,
    },

    // ── Language Cards ──────────────────────────────────────────
    listSection: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.lg,
      gap: 14,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderRadius: 28,
      padding: 18,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    cardSelected: {
      borderColor: '#FFFFFF',
      backgroundColor: 'rgba(255,255,255,1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
    },
    cardNearby: {
      borderColor: 'rgba(52,211,153,0.5)',
      backgroundColor: 'rgba(255,255,255,0.92)',
    },
    flagCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      ...SHADOWS.xs,
    },
    flagEmoji: { fontSize: 30 },
    cardInfo: { flex: 1, gap: 3 },
    cardNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    langName: {
      fontSize: 18,
      fontFamily: FONTS.extrabold,
      letterSpacing: -0.3,
    },
    nearbyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: '#D1FAE5',
    },
    nearbyBadgeText: {
      fontSize: 10,
      fontFamily: FONTS.extrabold,
      color: '#059669',
      letterSpacing: 0.3,
    },
    langNative: {
      fontSize: 13,
      fontFamily: FONTS.semibold,
      color: C.text.light,
      opacity: 0.8,
    },
    checkCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.sm,
    },
    emptyCheck: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: '#E2E8F0',
    },

    // ── Footer ──────────────────────────────────────────────────
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xl,
    },
    footerGradient: {
       position: 'absolute',
       top: -40, left: 0, right: 0, height: 160,
    },
    ctaWrapper: {
       width: '100%',
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      borderRadius: 32,
      gap: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.7)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
    },
    ctaText: {
      fontSize: 20,
      fontFamily: FONTS.extrabold,
      color: C.primaryDark,
      letterSpacing: -0.2,
    },
    ctaArrow: {
       width: 40,
       height: 40,
       borderRadius: 20,
       backgroundColor: C.primary + '15',
       alignItems: 'center',
       justifyContent: 'center',
       marginLeft: 4,
    },
  }), [C, insets]);
};

import { BrandVideoBackground } from '@/components/BrandVideoBackground';
import { FONTS,SHADOWS,SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useNarrationAudio } from '@/hooks/useNarrationAudio';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams,useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { ArrowLeft,ChevronRight,Heart,Plus,Users,X } from 'lucide-react-native';
import { useEffect,useMemo,useState } from 'react';
import {
KeyboardAvoidingView,
Platform,
ScrollView,
StatusBar,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
View,
useWindowDimensions,
} from 'react-native';
import Animated,{
FadeInDown,
FadeInUp,
FadeOutUp,
ZoomIn,
useAnimatedStyle,
useSharedValue,
withSequence,
withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MEMBER_EMOJIS = ['👨', '👩', '👧', '👦', '👴', '👵', '🐶', '🐱'];

export default function FamilyMembers() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const styles = useStyles(C, insets, winWidth);
  const { speak } = useNarrationAudio('family-members');
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  
  const addBtnScale = useSharedValue(1);

  useEffect(() => {
    // Narration
    const timer = setTimeout(() => {
      let lang = 'en';
      try {
        const langs = JSON.parse(params.languages as string);
        if (langs && langs.length > 0) lang = langs[0].code;
      } catch {}
      speak(`Wonderful! Now, who are the special people in ${params.kidName}'s family?`, lang);
    }, 800);

    return () => {
      clearTimeout(timer);
    };
  }, [params.kidName, params.languages, speak]);

  const addFamilyMember = async () => {
    const trimmed = currentName.trim();
    if (!trimmed.length) {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addBtnScale.value = withSequence(withSpring(1.2), withSpring(1));
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

  const addBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: addBtnScale.value }] }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <BrandVideoBackground videoId="onboarding_video" fallbackSource={require('@/assets/jahera.mp4')} overlayOpacity={0.25} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.progressLineOuter}>
              <View style={[styles.progressFill, { width: '75%', backgroundColor: '#FFFFFF' }]} />
            </View>
            <Text style={styles.stepLabel}>Step 3 of 4</Text>
          </View>

          <View style={styles.heroSection}>
            <LottieView
              source={{ uri: 'https://lottie.host/5a2d603a-3453-4876-8804-68f44d9560f7/F677pI8Xq6.json' }}
              autoPlay
              loop
              style={styles.lottieFamily}
            />
            <Animated.View entering={ZoomIn.delay(400).springify()} style={styles.heartOverlay}>
              <Heart size={32} color="#FF6B6B" fill="#FF6B6B" />
            </Animated.View>
          </View>

          <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.title}>
            Meet the Fam!
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300).springify()} style={styles.subtitle}>
            Who are the heroes that live with{'\n'}{params.kidName}?
          </Animated.Text>
        </View>

        <View style={styles.body}>
          <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.inputContainer}>
            <View style={styles.inputCard}>
               <View style={styles.inputIcon}>
                  <Users size={20} color={C.primary} />
               </View>
              <TextInput
                style={styles.input}
                placeholder="Add member (e.g. Papa, Sister)"
                placeholderTextColor="#CBD5E1"
                value={currentName}
                onChangeText={setCurrentName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={addFamilyMember}
              />
              <TouchableOpacity onPress={addFamilyMember} activeOpacity={0.85}>
                <Animated.View style={[styles.addButton, addBtnStyle, { backgroundColor: C.primary }]}>
                  <Plus size={24} color="#FFFFFF" strokeWidth={3} />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.listSection}>
            {familyMembers.length === 0 ? (
              <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.emptyState}>
                <View style={styles.emojiRow}>
                  {['👨', '👩', '👴', '👵'].map((e, i) => (
                    <Animated.Text 
                      key={i} 
                      entering={ZoomIn.delay(700 + i * 100).springify()} 
                      style={styles.emptyEmoji}
                    >
                      {e}
                    </Animated.Text>
                  ))}
                </View>
                <Text style={styles.emptyTitle}>Your Family Tree</Text>
                <Text style={styles.emptySub}>They'll be characters in your stories!</Text>
              </Animated.View>
            ) : (
              <View style={styles.grid}>
                {familyMembers.map((member, idx) => (
                  <Animated.View 
                    key={`${member}-${idx}`} 
                    entering={ZoomIn.delay(idx * 50).springify()} 
                    exiting={FadeOutUp}
                    style={styles.stickerWrapper}
                  >
                    <View style={styles.sticker}>
                      <View style={[styles.avatarCircle, { backgroundColor: C.primary + '10' }]}>
                        <Text style={styles.avatarEmoji}>{MEMBER_EMOJIS[idx % MEMBER_EMOJIS.length]}</Text>
                      </View>
                      <Text style={styles.stickerName} numberOfLines={1}>{member}</Text>
                      <TouchableOpacity 
                        onPress={() => removeFamilyMember(idx)} 
                        style={styles.removeCircle}
                        activeOpacity={0.7}
                      >
                        <X size={12} color="#FFFFFF" strokeWidth={3} />
                      </TouchableOpacity>
                      <View style={[styles.stickerGlow, { backgroundColor: C.primary + '05' }]} />
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        </View>
        </ScrollView>

        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
            style={styles.footerGradient}
          />
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.9}>
            <LinearGradient
              colors={familyMembers.length > 0 ? ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.95)'] : ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.4)']}
              style={styles.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.ctaText, { color: familyMembers.length > 0 ? C.primaryDark : '#CBD5E1' }]}>
                {familyMembers.length > 0 ? `Adventure On (${familyMembers.length})` : 'Next Step'}
              </Text>
              <View style={styles.ctaArrow}>
                 <ChevronRight size={22} color="#FFFFFF" strokeWidth={3} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
            <Text style={styles.skipText}>I'll add them later</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (C: any, insets: any, winWidth: number) => {
  return useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    kav: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: {
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.xxxl,
      alignItems: 'center',
      overflow: 'hidden',
    },
    headerMesh1: {
      position: 'absolute', top: -50, right: -50, width: 200, height: 200,
      borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerMesh2: {
      position: 'absolute', bottom: -30, left: -40, width: 150, height: 150,
      borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)',
    },
    topRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: SPACING.xl,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressLineOuter: {
      flex: 1,
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    stepLabel: {
      fontSize: 10,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
      letterSpacing: 1.2,
      opacity: 0.85,
    },
    heroSection: {
      width: 160,
      height: 160,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginBottom: 8,
    },
    lottieFamily: {
      width: 180,
      height: 180,
    },
    heartOverlay: {
      position: 'absolute',
      top: 10,
      right: -10,
    },
    title: {
      fontSize: 34,
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
      fontSize: 16,
      fontFamily: FONTS.medium,
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 22,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    body: {
      flex: 1,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xxxl,
    },
    inputContainer: {
      marginBottom: 32,
    },
    inputCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderRadius: 32,
      paddingLeft: 20,
      paddingRight: 10,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    inputIcon: {
       width: 40,
       height: 40,
       borderRadius: 20,
       backgroundColor: C.primary + '10',
       alignItems: 'center',
       justifyContent: 'center',
       marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 18,
      fontFamily: FONTS.extrabold,
      color: C.text.primary,
      letterSpacing: -0.3,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.sm,
    },
    listSection: {
      flex: 1,
    },
    emptyState: {
      alignItems: 'center',
      marginTop: 20,
    },
    emojiRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 20,
    },
    emptyEmoji: {
      fontSize: 36,
    },
    emptyTitle: {
      fontSize: 22,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
      marginBottom: 4,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    emptySub: {
      fontSize: 15,
      fontFamily: FONTS.medium,
      color: '#E2E8F0',
      opacity: 0.9,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    stickerWrapper: {
      width: (winWidth - SPACING.xl * 2 - 12) / 2,
    },
    sticker: {
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderRadius: 28,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      position: 'relative',
      overflow: 'hidden',
    },
    stickerGlow: {
       position: 'absolute',
       bottom: -20, left: -20, right: -20, height: 60,
       borderRadius: 40,
    },
    avatarCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      ...SHADOWS.xs,
    },
    avatarEmoji: { fontSize: 36 },
    stickerName: {
      fontSize: 17,
      fontFamily: FONTS.extrabold,
      color: C.text.primary,
      letterSpacing: -0.2,
    },
    removeCircle: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#FF6B6B',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      ...SHADOWS.xs,
      zIndex: 10,
    },
    footerGradient: {
      position: 'absolute',
      top: -80, left: 0, right: 0, height: 160,
    },
    footer: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      backgroundColor: 'transparent',
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
       width: 44,
       height: 44,
       borderRadius: 22,
       backgroundColor: C.primary + '15',
       alignItems: 'center',
       justifyContent: 'center',
       marginLeft: 4,
    },
    skipButton: {
      alignItems: 'center',
      paddingVertical: 18,
    },
    skipText: {
      fontSize: 15,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
      opacity: 0.8,
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
  }), [C, insets, winWidth]);
};

import { useState, useMemo, useEffect } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { X, UserPlus, ArrowLeft, Plus, Sparkles, Star } from 'lucide-react-native';
import { profileService, languageService, familyMemberService, friendService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeOutUp, 
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { generateAudio } from '@/services/audioService';

const FRIEND_EMOJIS = ['🧒', '👦', '👧', '🧑', '👶', '🧓', '🌟', '🌈'];

export default function Friends() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { loadProfile } = useApp();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const styles = useStyles(C, insets, winWidth);
  const [friends, setFriends] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const addBtnScale = useSharedValue(1);

  useEffect(() => {
    // Narration
    const timer = setTimeout(() => {
      let lang = 'en';
      try {
        const langs = JSON.parse(params.languages as string);
        if (langs && langs.length > 0) lang = langs[0].code;
      } catch {}
      speak("Almost there! Finally, who are your best friends? We can invite them into the stories too!", lang);
    }, 800);

    return () => {
      clearTimeout(timer);
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const speak = async (text: string, lang: string) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      const url = await generateAudio(text, lang);
      if (!url) return;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (err) {
      console.error('TTS Error (Friends):', err);
    }
  };

  const addFriend = async () => {
    const trimmed = currentName.trim();
    if (!trimmed.length) {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addBtnScale.value = withSequence(withSpring(1.2), withSpring(1));
    setFriends([...friends, trimmed]);
    setCurrentName('');
  };

  const removeFriend = async (index: number) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const languages = JSON.parse(params.languages as string);
      const kidName = params.kidName as string;
      const familyMembers = JSON.parse((params.familyMembers as string) || '[]');
      const primaryLanguage = languages[0]?.code || 'en';
      const profile = await profileService.create(user.$id, kidName, primaryLanguage);
      if (!profile) {
        setErrorMsg('Failed to create profile. Please try again.');
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
      await loadProfile();
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const addBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: addBtnScale.value }] }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <LinearGradient
          colors={[C.primary, C.primaryDark]}
          style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
        >
          <View style={styles.topRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton} disabled={isLoading}>
              <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.progressLine}>
              <View style={[styles.progressFill, { width: '100%', backgroundColor: '#FFFFFF' }]} />
            </View>
            <Text style={styles.stepLabel}>4 of 4</Text>
          </View>

          <View style={styles.heroSection}>
            <LottieView
              source={{ uri: 'https://lottie.host/9e4d6d63-7d84-484d-adb4-8d9e6ee0895c/H6uMNoOfZp.json' }}
              autoPlay
              loop
              style={styles.lottieFriends}
            />
            <Animated.View entering={ZoomIn.delay(400)} style={styles.starOverlay}>
              <Star size={28} color="#FFD700" fill="#FFD700" />
            </Animated.View>
          </View>

          <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
            Best Friends!
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300)} style={styles.subtitle}>
            Who are the partners in crime{'\n'}for your adventures?
          </Animated.Text>
        </LinearGradient>

        <View style={styles.body}>
          <Animated.View entering={FadeInUp.delay(500)} style={styles.inputContainer}>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder="Friend's Name"
                placeholderTextColor="#CBD5E1"
                value={currentName}
                onChangeText={setCurrentName}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={addFriend}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={addFriend} activeOpacity={0.8} disabled={isLoading}>
                <Animated.View style={[styles.addButton, addBtnStyle, { backgroundColor: C.primary }]}>
                  <Plus size={24} color="#FFFFFF" strokeWidth={3} />
                </Animated.View>
              </TouchableOpacity>
            </View>
            {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
          </Animated.View>

          <View style={styles.listSection}>
            {friends.length === 0 ? (
              <Animated.View entering={FadeInDown.delay(600)} style={styles.emptyState}>
                <View style={styles.emojiRow}>
                  {['🧒', '👧', '🧑'].map((e, i) => (
                    <Animated.Text 
                      key={i} 
                      entering={ZoomIn.delay(700 + i * 100)} 
                      style={styles.emptyEmoji}
                    >
                      {e}
                    </Animated.Text>
                  ))}
                </View>
                <Text style={styles.emptyTitle}>Add your buddies!</Text>
                <Text style={styles.emptySub}>Friends make stories better</Text>
              </Animated.View>
            ) : (
              <View style={styles.grid}>
                {friends.map((friend, idx) => (
                  <Animated.View 
                    key={`${friend}-${idx}`} 
                    entering={ZoomIn.springify()} 
                    exiting={FadeOutUp}
                    style={styles.stickerWrapper}
                  >
                    <View style={[styles.sticker, { borderColor: C.primary + '30' }]}>
                      <View style={[styles.avatarCircle, { backgroundColor: C.primary + '10' }]}>
                        <Text style={styles.avatarEmoji}>{FRIEND_EMOJIS[idx % FRIEND_EMOJIS.length]}</Text>
                      </View>
                      <Text style={styles.stickerName} numberOfLines={1}>{friend}</Text>
                      <TouchableOpacity 
                        onPress={() => removeFriend(idx)} 
                        style={styles.removeCircle}
                        disabled={isLoading}
                      >
                        <X size={12} color="#FFFFFF" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        </View>
        </ScrollView>

        <Animated.View
          entering={FadeInUp.delay(300)}
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <TouchableOpacity onPress={handleComplete} activeOpacity={0.8} disabled={isLoading}>
            <LinearGradient
              colors={[C.primary, C.primaryDark]}
              style={styles.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.ctaText}>Start Adventures!</Text>
                  <Sparkles size={22} color="#FFFFFF" strokeWidth={3} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleComplete} style={styles.skipButton} disabled={isLoading}>
            <Text style={styles.skipText}>I'll add them later</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (C: any, insets: any, winWidth: number) => {
  return useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    kav: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: {
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.xxxl,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      alignItems: 'center',
      ...SHADOWS.md,
    },
    topRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: SPACING.lg,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressLine: {
      flex: 1,
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    stepLabel: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: 'rgba(255,255,255,0.7)',
    },
    heroSection: {
      width: 160,
      height: 160,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    lottieFriends: {
      width: 180,
      height: 180,
    },
    starOverlay: {
      position: 'absolute',
      top: 10,
      right: 10,
    },
    title: {
      fontSize: 32,
      fontFamily: 'Baloo2-Bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 17,
      fontFamily: 'Baloo2-Medium',
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      lineHeight: 22,
    },
    body: {
      flex: 1,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xl,
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 30,
      paddingLeft: 24,
      paddingRight: 8,
      paddingVertical: 8,
      borderWidth: 3,
      borderColor: '#F1F5F9',
      ...SHADOWS.md,
    },
    input: {
      flex: 1,
      fontSize: 18,
      fontFamily: 'Baloo2-Bold',
      color: C.text.primary,
    },
    addButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      color: '#FF6B6B',
      fontSize: 14,
      fontFamily: 'Baloo2-Medium',
      marginTop: 8,
      textAlign: 'center',
    },
    listSection: {
      flex: 1,
    },
    emptyState: {
      alignItems: 'center',
      marginTop: 40,
    },
    emojiRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    emptyEmoji: {
      fontSize: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontFamily: 'Baloo2-Bold',
      color: C.text.primary,
    },
    emptySub: {
      fontSize: 15,
      fontFamily: 'Baloo2-Medium',
      color: C.text.light,
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
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#F1F5F9',
      ...SHADOWS.sm,
      position: 'relative',
    },
    avatarCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    avatarEmoji: { fontSize: 32 },
    stickerName: {
      fontSize: 16,
      fontFamily: 'Baloo2-Bold',
      color: C.text.primary,
    },
    removeCircle: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#FF6B6B',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    footer: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      backgroundColor: 'rgba(255,255,255,0.9)',
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      borderRadius: 30,
      gap: 10,
      ...SHADOWS.md,
    },
    ctaText: {
      fontSize: 20,
      fontFamily: 'Baloo2-Bold',
      color: '#FFFFFF',
    },
    skipButton: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    skipText: {
      fontSize: 15,
      fontFamily: 'Baloo2-Medium',
      color: C.text.light,
    },
  }), [C, insets]);
};

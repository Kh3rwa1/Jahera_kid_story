import { FONTS,SPACING } from '@/constants/theme';
import { Story } from '@/types/database';
import { VideoView,useVideoPlayer } from 'expo-video';
import { BookOpen,Sparkles } from 'lucide-react-native';
import {
Dimensions,
Platform,
StyleSheet,
Text,
TouchableOpacity,
View
} from 'react-native';
import Animated,{ FadeIn,FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CinematicIntroProps {
  story: Story | null;
  videoUri: string | null;
  audioPolling: boolean;
  isBuffering: boolean;
  onDismiss: () => void;
  introOpacity: any; // SharedValue
}

export function CinematicIntro({
  story,
  videoUri,
  audioPolling,
  isBuffering,
  onDismiss,
  introOpacity,
}: Readonly<CinematicIntroProps>) {
  const insets = useSafeAreaInsets();

  const player = useVideoPlayer(videoUri ?? '', p => {
    if (videoUri) {
      p.loop = true;
      p.muted = true;
      p.play();
    }
  });

  const animatedStyle = {
    opacity: introOpacity.value,
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, { backgroundColor: '#000' }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        {...(Platform.OS === 'android' ? { surfaceType: 'textureView' } : {})}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />

      {story ? (
        <Animated.View
          entering={FadeIn.delay(300).duration(600)}
          style={[styles.container, { paddingBottom: insets.bottom + 80 }]}
        >
          <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.badgeRow}>
            {story.theme && (
              <View style={styles.badge}>
                <Sparkles size={12} color="#FFF" />
                <Text style={styles.badgeText}>{story.theme}</Text>
              </View>
            )}
            {story.mood && (
              <View style={[styles.badge, styles.moodBadge]}>
                <Text style={styles.moodText}>{story.mood}</Text>
              </View>
            )}
          </Animated.View>

          <Animated.Text
            entering={FadeInUp.delay(500).duration(600)}
            style={styles.title}
            numberOfLines={3}
          >
            {story.title}
          </Animated.Text>

          <Animated.View
            entering={FadeInUp.delay(700).duration(500)}
            style={styles.statusRow}
          >
            {(audioPolling || isBuffering) ? (
              <>
                <View style={[styles.dot, { backgroundColor: '#4ADE80' }]} />
                <Text style={styles.statusText}>🎙️ Generating narration...</Text>
              </>
            ) : (
              <>
                <View style={[styles.dot, { backgroundColor: '#4ADE80' } ]} />
                <Text style={styles.statusText}>✨ Audio ready</Text>
              </>
            )}
          </Animated.View>

          <Animated.View entering={FadeIn.delay(2000).duration(800)}>
            <TouchableOpacity
              onPress={onDismiss}
              activeOpacity={0.7}
              style={styles.dismissBtn}
            >
              <Text style={styles.dismissBtnText}>Tap to continue →</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.loader]}>
          <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center', gap: 16 }}>
            <View style={styles.loaderRing}>
              <BookOpen size={24} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.loaderText}>Opening your story...</Text>
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.xxl,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    color: '#FFF',
    fontFamily: FONTS.semibold,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  moodBadge: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  moodText: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONTS.medium,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  title: {
    color: '#FFFFFF',
    fontFamily: FONTS.extrabold,
    fontSize: 34,
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: SPACING.lg,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  dismissBtn: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  dismissBtnText: {
    color: '#FFF',
    fontFamily: FONTS.semibold,
    fontSize: 14,
  },
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  loaderText: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.semibold,
    fontSize: 16,
  },
});

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { storyService } from '@/services/database';
import { Story } from '@/types/database';
import { Play, Pause, RotateCcw, X } from 'lucide-react-native';

export default function StoryPlayback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [story, setStory] = useState<Story | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    loadStory();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadStory = async () => {
    try {
      const storyId = params.storyId as string;
      const storyData = await storyService.getByProfileId(storyId);

      if (!storyData || storyData.length === 0) {
        router.back();
        return;
      }

      const currentStory = storyData[0];
      setStory(currentStory);

      if (currentStory.audio_url) {
        await loadAudio(currentStory.audio_url);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading story:', error);
      router.back();
    }
  };

  const loadAudio = async (audioPath: string) => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: audioPath },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setSound(audioSound);
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
    }
  };

  const handleRestart = async () => {
    if (!sound) return;

    try {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (error) {
      console.error('Error restarting audio:', error);
    }
  };

  const handleClose = () => {
    if (sound) {
      sound.stopAsync();
    }
    router.back();
  };

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading || !story) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
        <X size={24} color="#6c757d" />
      </TouchableOpacity>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{story.title}</Text>
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>
              {story.season} · {story.time_of_day}
            </Text>
          </View>
        </View>

        <View style={styles.visualContainer}>
          <View style={styles.playingIndicator}>
            {isPlaying ? (
              <Text style={styles.playingText}>🎵 Playing...</Text>
            ) : (
              <Text style={styles.playingText}>⏸️ Paused</Text>
            )}
          </View>
        </View>

        {showText && (
          <View style={styles.textContainer}>
            <ScrollView style={styles.textScroll}>
              <Text style={styles.storyText}>{story.content}</Text>
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={styles.showTextButton}
          onPress={() => setShowText(!showText)}
          activeOpacity={0.7}>
          <Text style={styles.showTextButtonText}>
            {showText ? 'Hide Text' : 'Show Text'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quizButton}
          onPress={() => router.push({ pathname: '/story/quiz', params: { storyId: story.id } })}
          activeOpacity={0.8}>
          <Text style={styles.quizButtonText}>🎯 Start Quiz</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.controls}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(position / duration) * 100}%` }]} />
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleRestart}
            activeOpacity={0.7}
            disabled={!sound}>
            <RotateCcw size={28} color="#495057" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playButton, !sound && styles.playButtonDisabled]}
            onPress={handlePlayPause}
            activeOpacity={0.8}
            disabled={!sound}>
            {isPlaying ? (
              <Pause size={40} color="#fff" fill="#fff" />
            ) : (
              <Play size={40} color="#fff" fill="#fff" />
            )}
          </TouchableOpacity>

          <View style={styles.controlButton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 240,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
    textAlign: 'center',
  },
  metadata: {
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 14,
    color: '#6c757d',
    textTransform: 'capitalize',
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  playingIndicator: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  playingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
  },
  textContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textScroll: {
    maxHeight: 260,
  },
  storyText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 26,
  },
  showTextButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  showTextButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  quizButton: {
    marginTop: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#FFD93D',
  },
  quizButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0d6efd',
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0d6efd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
});

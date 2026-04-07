import { generateAudio } from '@/services/audioService';
import { storyService } from '@/services/database';
import { Story } from '@/types/database';
import { hapticFeedback } from '@/utils/haptics';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio,AVPlaybackStatus } from 'expo-av';
import React,{ createContext,useCallback,useContext,useEffect,useMemo,useRef,useState } from 'react';

interface AudioContextType {
  activeStory: Story | null;
  sound: Audio.Sound | null;
  isPlaying: boolean;
  isBuffering: boolean;
  audioError: boolean;
  audioPolling: boolean;
  loadAndPlayAudio: (story: Story) => Promise<void>;
  playPause: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  stopAudio: () => Promise<void>;
  retryAudio: () => Promise<void>;
}

interface AudioProgressType {
  position: number;
  duration: number;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);
const AudioProgressContext = createContext<AudioProgressType | undefined>(undefined);
const PROGRESS_KEY_PREFIX = 'story_progress_';

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [audioPolling, setAudioPolling] = useState(false);

  const audioPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPositionRef = useRef<number>(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isMountedRef = useRef(true);

  // Setup Audio Mode globally once
  useEffect(() => {
    isMountedRef.current = true;
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false
    }).catch(err => logger.warn('[AudioContext] setAudioModeAsync error:', err));
    
    return () => {
      isMountedRef.current = false;
      const currentSound = soundRef.current;
      if (currentSound) {
        currentSound.unloadAsync().catch((e) => { logger.debug('[AudioContext] unload err:', e); });
      }
      if (audioPollingRef.current) clearInterval(audioPollingRef.current);
      if (progressSaveTimerRef.current) clearInterval(progressSaveTimerRef.current);
    };
  }, []);

  const saveProgress = useCallback(async (pos: number, dur: number, story: Story) => {
    if (!story?.id || dur <= 0) return;
    try {
      const progress = {
        position: pos,
        duration: dur,
        updatedAt: Date.now(),
        title: story.title,
        theme: story.theme
      };
      await AsyncStorage.setItem(`${PROGRESS_KEY_PREFIX}${story.id}`, JSON.stringify(progress));
      await AsyncStorage.setItem('last_active_story_id', story.id);
    } catch (err) {
      logger.warn('[AudioContext] Failed to save progress:', err);
    }
  }, []);

  // Periodic autosave
  useEffect(() => {
    if (isPlaying && duration > 0 && activeStory) {
      progressSaveTimerRef.current = setInterval(() => {
        saveProgress(lastPositionRef.current, duration, activeStory);
      }, 5000);
    } else if (progressSaveTimerRef.current) {
      clearInterval(progressSaveTimerRef.current);
    }
    return () => {
      if (progressSaveTimerRef.current) clearInterval(progressSaveTimerRef.current);
    };
  }, [isPlaying, duration, activeStory, saveProgress]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!isMountedRef.current) return;

    if (status.isLoaded) {
      const newPos: number = status.positionMillis ?? 0;
      // throttle React state updates to 250ms jumps unless just finished
      if (Math.abs(newPos - lastPositionRef.current) >= 250 || status.didJustFinish) {
        lastPositionRef.current = newPos;
        setPosition(newPos);
      }
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      setIsBuffering(status.isBuffering || false);
      if (status.didJustFinish) { 
        setIsPlaying(false); 
        setPosition(0); 
        lastPositionRef.current = 0; 
      }
    } else if (status.error) {
      logger.error('[AudioContext] Playback status error:', status.error);
      setAudioError(true); 
      setIsPlaying(false);
    }
  };

  const loadAudioFromUrl = async (audioPath: string, story: Story, retryCount = 0) => {
    try {
      if (sound) {
        // Crossfade: fade out old audio before unloading
        try { await sound.setVolumeAsync(0.3); } catch (e) { logger.debug('[AudioContext] vol err:', e); }
        await new Promise(resolve => setTimeout(resolve, 150));
        try { await sound.setVolumeAsync(0); } catch (e) { logger.debug('[AudioContext] vol err:', e); }
        await sound.unloadAsync();
        setSound(null);
      }

      let startPosition = 0;
      try {
        const saved = await AsyncStorage.getItem(`${PROGRESS_KEY_PREFIX}${story.id}`);
        if (saved) {
          const { position: savedPos, duration: savedDur } = JSON.parse(saved);
          if (savedPos > 5000 && savedPos < (savedDur * 0.98)) {
            startPosition = savedPos;
          }
        }
      } catch (e) {
        console.warn('[AudioContext] Failed to load saved progress:', e);
      }

      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: audioPath },
        { 
          shouldPlay: false, 
          positionMillis: startPosition,
          progressUpdateIntervalMillis: 200,
          volume: 0, // Start silent for fade-in
        },
        onPlaybackStatusUpdate
      );
      
      if (!isMountedRef.current) {
        audioSound.unloadAsync().catch((e) => { logger.debug('[AudioContext] unload err:', e); });
        return;
      }

      soundRef.current = audioSound;
      setSound(audioSound);
      setActiveStory(story);
      setAudioError(false);
      lastPositionRef.current = startPosition;
      setPosition(startPosition);
      
      // Smooth volume fade-in
      await audioSound.playAsync();
      setIsPlaying(true);
      // Fade in over 400ms
      await audioSound.setVolumeAsync(0.5);
      await new Promise(resolve => setTimeout(resolve, 100));
      await audioSound.setVolumeAsync(0.8);
      await new Promise(resolve => setTimeout(resolve, 100));
      await audioSound.setVolumeAsync(1.0);
    } catch (err) {
      logger.error('[AudioContext] Failed to load audio:', err);
      // Auto-retry up to 2 times with exponential backoff
      if (retryCount < 2 && isMountedRef.current) {
        const delay = (retryCount + 1) * 1500;
        logger.info(`[AudioContext] Retrying audio load in ${delay}ms (attempt ${retryCount + 2})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        if (isMountedRef.current) {
          return loadAudioFromUrl(audioPath, story, retryCount + 1);
        }
      }
      if (isMountedRef.current) setAudioError(true);
    }
  };

  const loadAndPlayAudio = async (story: Story) => {
    // If asking to load the same story that's already playing, just do nothing
    if (activeStory?.id === story.id) {
        return;
    }

    if (sound) {
       await sound.unloadAsync();
       setSound(null);
    }
    
    setActiveStory(story);
    setAudioError(false);
    setPosition(0);
    setDuration(0);
    lastPositionRef.current = 0;

    if (story.audio_url) {
      await loadAudioFromUrl(story.audio_url, story);
    } else {
      setAudioPolling(true);
      generateAudio(story.content, story.language_code || 'en', story.id).catch(err => 
        logger.error('[AudioContext] generateAudio error:', err)
      );

      let polls = 0;
      const MAX_POLLS = 25; // 75s
      
      if (audioPollingRef.current) clearInterval(audioPollingRef.current);
      
      audioPollingRef.current = setInterval(async () => {
        if (!isMountedRef.current) {
          if (audioPollingRef.current) clearInterval(audioPollingRef.current);
          return;
        }

        polls++;
        try {
          const fresh = await storyService.getById(story.id);
          if (!isMountedRef.current) {
             if (audioPollingRef.current) clearInterval(audioPollingRef.current);
             return;
          }

          if (fresh?.audio_url) {
            if (audioPollingRef.current) clearInterval(audioPollingRef.current);
            setAudioPolling(false);
            await loadAudioFromUrl(fresh.audio_url, story);
          } else if (polls >= MAX_POLLS) {
            if (audioPollingRef.current) clearInterval(audioPollingRef.current);
            setAudioPolling(false);
            setAudioError(true);
          }
        } catch (err) {
          logger.warn('[AudioContext] Polling error:', err);
          if (polls >= MAX_POLLS) {
            if (audioPollingRef.current) clearInterval(audioPollingRef.current);
            setAudioPolling(false);
            setAudioError(true);
          }
        }
      }, 3000);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      if (activeStory) {
         saveProgress(lastPositionRef.current, duration, activeStory);
      }
      await sound.unloadAsync();
      setSound(null);
    }
    if (audioPollingRef.current) clearInterval(audioPollingRef.current);
    setActiveStory(null);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
  };

  const playPause = async () => {
    if (!sound) return;
    try {
      hapticFeedback.medium();
      isPlaying ? await sound.pauseAsync() : await sound.playAsync();
    } catch (e) { 
      logger.error('[AudioContext] playPause error:', e);
      setAudioError(true); 
    }
  };

  const seek = async (positionMillis: number) => {
    if (!sound) return;
    try {
      await sound.setPositionAsync(positionMillis);
    } catch (e) {
      console.warn('[AudioContext] Seek error:', e);
    }
  };

  const retryAudio = async () => {
    if (!activeStory) return;
    hapticFeedback.medium();
    if (sound) { await sound.unloadAsync(); setSound(null); }
    setAudioError(false);
    setAudioPolling(true);
    
    try {
      await generateAudio(activeStory.content, activeStory.language_code || 'en', activeStory.id);
      
      let polls = 0;
      const MAX_POLLS = 20;
      if (audioPollingRef.current) clearInterval(audioPollingRef.current);
      
      audioPollingRef.current = setInterval(async () => {
        if (!isMountedRef.current) {
          if (audioPollingRef.current) clearInterval(audioPollingRef.current);
          return;
        }

        polls++;
        try {
          const fresh = await storyService.getById(activeStory.id);
          if (!isMountedRef.current) {
            if (audioPollingRef.current) clearInterval(audioPollingRef.current);
            return;
          }

          if (fresh?.audio_url) {
            if (audioPollingRef.current) clearInterval(audioPollingRef.current);
            setAudioPolling(false);
            await loadAudioFromUrl(fresh.audio_url, activeStory);
          } else if (polls >= MAX_POLLS) {
            if (audioPollingRef.current) clearInterval(audioPollingRef.current);
            setAudioPolling(false);
            setAudioError(true);
          }
        } catch (err) {
          logger.warn('[AudioContext] Retry polling error:', err);
          if (polls >= MAX_POLLS) {
            if (audioPollingRef.current) clearInterval(audioPollingRef.current);
            setAudioPolling(false);
            setAudioError(true);
          }
        }
      }, 3000);
    } catch (err) {
      if (isMountedRef.current) {
        setAudioError(true);
        setAudioPolling(false);
      }
    }
  };

  const value = useMemo(() => ({
    activeStory,
    sound,
    isPlaying,
    isBuffering,
    audioError,
    audioPolling,
    loadAndPlayAudio,
    playPause,
    seek,
    stopAudio,
    retryAudio
  }), [
    activeStory,
    sound,
    isPlaying,
    isBuffering,
    audioError,
    audioPolling,
    loadAndPlayAudio,
    playPause,
    seek,
    stopAudio,
    retryAudio
  ]);

  const progressValue = useMemo(() => ({
    position,
    duration
  }), [position, duration]);

  return (
    <AudioContext.Provider value={value}>
      <AudioProgressContext.Provider value={progressValue}>
        {children}
      </AudioProgressContext.Provider>
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const useAudioProgress = () => {
  const context = useContext(AudioProgressContext);
  if (context === undefined) {
    throw new Error('useAudioProgress must be used within an AudioProvider');
  }
  return context;
};

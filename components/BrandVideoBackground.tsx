import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ViewStyle, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { STORAGE_BUCKETS, storage } from '@/lib/appwrite';

interface BrandVideoBackgroundProps {
  /** The ID of the file in the app_assets bucket (e.g., 'onboarding_video') */
  videoId: string;
  /** A fallback local asset if the Appwrite fetch fails (e.g., require('@/assets/jahera.mp4')) */
  fallbackSource?: any;
  /** Optional styling for the container */
  style?: ViewStyle;
  /** Overlay opacity (0 to 1) to darken the video so white text is readable. Default is 0.3 */
  overlayOpacity?: number;
}

export function BrandVideoBackground({ videoId, fallbackSource, style, overlayOpacity = 0.3 }: BrandVideoBackgroundProps) {
  const { width, height } = Dimensions.get('screen');

  // Use local fallback directly — makes the video play immediately
  // Appwrite remote upgrade is attempted in the background
  const [source, setSource] = useState<any>(fallbackSource ?? null);

  // Try to upgrade to Appwrite-hosted video (non-blocking, optional)
  useEffect(() => {
    let isMounted = true;

    const resolveRemoteVideo = async () => {
      try {
        await storage.getFile(STORAGE_BUCKETS.APP_ASSETS, videoId);
        const url = storage.getFileView(STORAGE_BUCKETS.APP_ASSETS, videoId).toString();
        if (isMounted && url) {
          setSource({ uri: url });
        }
      } catch {
        // Remote not available — keep using local fallback (already set)
      }
    };

    resolveRemoteVideo();
    return () => { isMounted = false; };
  }, [videoId]);

  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Ensure player starts playing (handle edge cases where autoplay fails)
  useEffect(() => {
    if (player) {
      const timer = setTimeout(() => {
        try {
          player.muted = true;
          player.loop = true;
          player.play();
        } catch {}
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [player]);

  if (!source) {
    return <View style={[styles.container, style, { backgroundColor: '#0F172A' }]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={{ width, height }}
        contentFit="cover"
        nativeControls={false}
        // On Android, textureView is needed when video is behind other views
        // (e.g. as a background). SurfaceView (default) can cause z-order issues.
        {...(Platform.OS === 'android' ? { surfaceType: 'textureView' } : {})}
      />
      {overlayOpacity > 0 && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: -1,
  },
});

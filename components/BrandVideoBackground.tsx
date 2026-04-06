import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, ViewStyle, Platform, Image } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { STORAGE_BUCKETS, storage, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from '@/lib/appwrite';

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

/**
 * Resolves the best available video source.
 * Priority: Appwrite remote URL > local bundled asset
 *
 * Key insight: `useVideoPlayer` only reads the initial source once.
 * We MUST resolve the URI *before* passing it to the hook.
 */
function useResolvedVideoSource(videoId: string, fallbackSource: any) {
  const [resolvedSource, setResolvedSource] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const resolve = async () => {
      // 1. Try Appwrite remote URL first
      try {
        await storage.getFile(STORAGE_BUCKETS.APP_ASSETS, videoId);
        const url = storage.getFileView(STORAGE_BUCKETS.APP_ASSETS, videoId).toString();
        if (isMounted && url) {
          setResolvedSource(url);
          setIsResolving(false);
          return;
        }
      } catch {
        // Remote not available
      }

      // 2. Use local asset URI resolved via Asset API
      if (fallbackSource) {
        try {
          const { Asset } = require('expo-asset');
          const [asset] = await Asset.loadAsync(fallbackSource);
          if (isMounted && asset?.localUri) {
            setResolvedSource(asset.localUri);
            setIsResolving(false);
            return;
          }
        } catch {
          // Asset loading failed
        }
      }

      // 3. Nothing worked
      if (isMounted) {
        setIsResolving(false);
      }
    };

    resolve();
    return () => { isMounted = false; };
  }, [videoId, fallbackSource]);

  return { resolvedSource, isResolving };
}

export function BrandVideoBackground({ videoId, fallbackSource, style, overlayOpacity = 0.3 }: BrandVideoBackgroundProps) {
  const { width, height } = Dimensions.get('screen');
  const { resolvedSource, isResolving } = useResolvedVideoSource(videoId, fallbackSource);

  // Only create the player once the source is fully resolved
  const player = useVideoPlayer(resolvedSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Safety retry — ensure playback starts
  useEffect(() => {
    if (player && resolvedSource) {
      const timer = setTimeout(() => {
        try {
          player.muted = true;
          player.loop = true;
          player.play();
        } catch {}
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [player, resolvedSource]);

  // While resolving or if no source, show dark placeholder
  if (isResolving || !resolvedSource) {
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

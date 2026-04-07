import { videoCacheService } from '@/services/videoCacheService';
import { useVideoPlayer,VideoView } from 'expo-video';
import React,{ useEffect,useState } from 'react';
import { Dimensions,Platform,StyleSheet,View,ViewStyle } from 'react-native';

interface BrandVideoBackgroundProps {
  /** The ID of the file in the app_assets bucket (e.g., 'onboarding_video') */
  videoId: string;
  /** A fallback local asset if the Appwrite fetch fails */
  fallbackSource?: any;
  /** Optional styling for the container */
  style?: ViewStyle;
  /** Overlay opacity (0 to 1). Default is 0.3 */
  overlayOpacity?: number;
}

/**
 * Hook that returns the best video URI.
 * Priority: videoCacheService (already downloaded) → bundled asset fallback
 */
function useResolvedVideoSource(fallbackSource: any) {
  const [resolvedSource, setResolvedSource] = useState<string | null>(() => {
    // Sync check: if the cache already has a URI, use it immediately
    return videoCacheService.getCachedUri();
  });
  const [isResolving, setIsResolving] = useState(!videoCacheService.isReady);

  useEffect(() => {
    if (resolvedSource) {
      setIsResolving(false);
      return;
    }

    let isMounted = true;

    const resolve = async () => {
      // 1. Wait for the cache service to finish its prefetch
      try {
        await videoCacheService.prefetch();
        const cached = videoCacheService.getCachedUri();
        if (isMounted && cached) {
          setResolvedSource(cached);
          setIsResolving(false);
          return;
        }
      } catch {}

      // 2. Fallback: resolve the bundled asset
      if (fallbackSource) {
        try {
          const { Asset } = require('expo-asset');
          const [asset] = await Asset.loadAsync(fallbackSource);
          if (isMounted && asset?.localUri) {
            setResolvedSource(asset.localUri);
            setIsResolving(false);
            return;
          }
        } catch {}
      }

      if (isMounted) setIsResolving(false);
    };

    resolve();
    return () => { isMounted = false; };
  }, [fallbackSource, resolvedSource]);

  return { resolvedSource, isResolving };
}

/**
 * Inner component — only mounts once we have a valid source URI.
 * This guarantees `useVideoPlayer` always gets a real string.
 */
function VideoPlayerInner({ source, width, height, overlayOpacity }: { 
  source: string; 
  width: number; 
  height: number; 
  overlayOpacity: number;
}) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Safety retry
  useEffect(() => {
    if (player) {
      const timer = setTimeout(() => {
        try {
          player.muted = true;
          player.loop = true;
          player.play();
        } catch {}
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [player]);

  return (
    <>
      <VideoView
        player={player}
        style={{ width, height }}
        contentFit="cover"
        nativeControls={false}
        {...(Platform.OS === 'android' ? { surfaceType: 'textureView' } : {})}
      />
      {overlayOpacity > 0 && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]} />
      )}
    </>
  );
}

export function BrandVideoBackground({ videoId, fallbackSource, style, overlayOpacity = 0.3 }: Readonly<BrandVideoBackgroundProps>) {
  const { width, height } = Dimensions.get('screen');
  const { resolvedSource, isResolving } = useResolvedVideoSource(fallbackSource);

  if (isResolving || !resolvedSource) {
    return <View style={[styles.container, style, { backgroundColor: '#0F172A' }]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <VideoPlayerInner
        source={resolvedSource}
        width={width}
        height={height}
        overlayOpacity={overlayOpacity}
      />
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

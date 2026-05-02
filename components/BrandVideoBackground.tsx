import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  STORAGE_BUCKETS,
} from '@/lib/appwrite';
import { logger } from '@/utils/logger';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

interface BrandVideoBackgroundProps {
  /** The ID of the file in the app_assets bucket (e.g., 'onboarding_video') */
  videoId: string;
  /** A fallback local asset if the Appwrite fetch fails */
  fallbackSource?: number;
  /** Optional styling for the container */
  style?: ViewStyle;
  /** Overlay opacity (0 to 1). Default is 0.3 */
  overlayOpacity?: number;
}

/**
 * Build a public Appwrite file view URL.
 * The app_assets bucket has "Any" read permission, so no auth needed.
 */
function getAppwriteVideoUrl(fileId: string): string {
  return `${APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKETS.APP_ASSETS}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}

/**
 * Hook that returns the best video URI.
 * Priority: Appwrite server URL → bundled asset fallback
 */
function useResolvedVideoSource(videoId: string, fallbackSource?: number) {
  const [resolvedSource, setResolvedSource] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const resolve = async () => {
      // 0. Guard for missing inputs
      if (!videoId && !fallbackSource) {
        if (isMounted) setIsResolving(false);
        return;
      }

      // 1. Try Appwrite server URL directly
      if (videoId) {
        try {
          const url = getAppwriteVideoUrl(videoId);
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok && isMounted) {
            const contentLength = response.headers.get('content-length');
            const size = contentLength ? parseInt(contentLength, 10) : 0;
            if (size > 20_000) {
              setResolvedSource(url);
              setIsResolving(false);
              logger.debug(
                `[VideoBackground] Appwrite video ready (${(size / 1024).toFixed(1)}KB)`,
              );
              return;
            }
          }
        } catch {
          /* Silent fail to fallback */
        }
      }

      // 2. Resolve bundled fallback asset
      // fallbackSource must be a number (Resource ID from require())
      if (typeof fallbackSource === 'number' && fallbackSource > 0) {
        try {
          const { Asset } = require('expo-asset');
          const [asset] = await Asset.loadAsync(fallbackSource);
          if (asset?.localUri && isMounted) {
            setResolvedSource(asset.localUri);
            setIsResolving(false);
            logger.info('[VideoBackground] Using bundled fallback asset');
            return;
          }
        } catch (e) {
          logger.warn('[VideoBackground] Bundled asset fallback failed:', e);
        }
      }

      // 3. Final fallback
      if (isMounted) {
        setIsResolving(false);
        logger.warn('[VideoBackground] No valid video source available');
      }
    };

    resolve();
    return () => {
      isMounted = false;
    };
  }, [videoId, fallbackSource]);

  return { resolvedSource, isResolving };
}

/**
 * Inner component — only mounts once we have a valid source URI.
 * This guarantees `useVideoPlayer` always gets a real string.
 */
function VideoPlayerInner({
  source,
  width,
  height,
  overlayOpacity,
}: Readonly<{
  source: string;
  width: number;
  height: number;
  overlayOpacity: number;
}>) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Safety retry
  useEffect(() => {
    if (!player) return;

    const retryPlay = () => {
      try {
        player.muted = true;
        player.loop = true;
        player.play();
      } catch {}
    };

    const timer = setTimeout(retryPlay, 600);
    return () => clearTimeout(timer);
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
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
          ]}
        />
      )}
    </>
  );
}

export function BrandVideoBackground({
  videoId,
  fallbackSource,
  style,
  overlayOpacity = 0.3,
}: Readonly<BrandVideoBackgroundProps>) {
  const { width, height } = Dimensions.get('screen');
  const { resolvedSource, isResolving } = useResolvedVideoSource(
    videoId,
    fallbackSource,
  );

  if (isResolving || !resolvedSource) {
    return (
      <View style={[styles.container, style, { backgroundColor: '#0F172A' }]} />
    );
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

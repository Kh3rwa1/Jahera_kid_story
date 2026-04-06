import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
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
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const { width, height } = Dimensions.get('screen');

  useEffect(() => {
    let isMounted = true;

    const resolveVideo = async () => {
      try {
        await storage.getFile(STORAGE_BUCKETS.APP_ASSETS, videoId);
        const url = storage.getFileView(STORAGE_BUCKETS.APP_ASSETS, videoId).toString();
        if (isMounted) {
          setAssetUrl(url);
          setHasError(false);
        }
      } catch (e) {
        console.log(`Fallback for video ${videoId}: Appwrite asset not found or inaccessible.`, e);
        if (isMounted) {
          setHasError(true);
          setAssetUrl(null);
        }
      }
    };

    resolveVideo();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  const source = (!hasError && assetUrl)
    ? { uri: assetUrl }
    : fallbackSource;

  const player = useVideoPlayer(source, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  if (!source) return <View style={[styles.container, style, { backgroundColor: '#0F172A' }]} />;

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={{ width, height }}
        contentFit="cover"
        nativeControls={false}
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

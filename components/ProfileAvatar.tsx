import { SHADOWS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
  onPress?: () => void;
  isUploading?: boolean;
}

const SIZE_MAP = {
  small: { container: 48, font: 20, camera: 14, cameraWrap: 22 },
  medium: { container: 72, font: 28, camera: 16, cameraWrap: 28 },
  large: { container: 100, font: 38, camera: 20, cameraWrap: 34 },
};

export function ProfileAvatar({
  avatarUrl,
  name,
  size = 'medium',
  editable = false,
  onPress,
  isUploading = false,
}: Readonly<ProfileAvatarProps>) {
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const dims = SIZE_MAP[size];
  const radius = dims.container / 2;
  const ringPadding = size === 'large' ? 4 : size === 'medium' ? 3 : 2;
  const ringSize = dims.container + ringPadding * 2;

  const content = (
    <Animated.View entering={ZoomIn.delay(100).springify()}>
      {/* Gradient ring border */}
      <LinearGradient
        colors={COLORS.gradients.primary}
        style={[
          styles.ringGradient,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            padding: ringPadding,
          },
          size === 'large' && SHADOWS.md,
          size !== 'large' && SHADOWS.sm,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View
          style={[
            styles.container,
            {
              width: dims.container,
              height: dims.container,
              borderRadius: radius,
            },
          ]}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[
                {
                  width: dims.container,
                  height: dims.container,
                  borderRadius: radius,
                },
              ]}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={COLORS.gradients.primary}
              style={[
                styles.fallback,
                {
                  width: dims.container,
                  height: dims.container,
                  borderRadius: radius,
                  overflow: 'hidden',
                },
              ]}
            >
              <Image
                source={require('@/assets/images/icon.png')}
                style={{
                  width: dims.container,
                  height: dims.container,
                }}
                contentFit="cover"
              />
            </LinearGradient>
          )}

          {isUploading && (
            <View
              style={[
                styles.uploadingOverlay,
                {
                  width: dims.container,
                  height: dims.container,
                  borderRadius: radius,
                },
              ]}
            >
              <ActivityIndicator
                color="#FFFFFF"
                size={size === 'small' ? 'small' : 'large'}
              />
            </View>
          )}

          {editable && !isUploading && (
            <View
              style={[
                styles.cameraButton,
                {
                  width: dims.cameraWrap,
                  height: dims.cameraWrap,
                  borderRadius: dims.cameraWrap / 2,
                  backgroundColor: COLORS.primary,
                },
              ]}
            >
              <Camera size={dims.camera} color="#FFFFFF" />
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  ringGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    overflow: 'visible',
    position: 'relative',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

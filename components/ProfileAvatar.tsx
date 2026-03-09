import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Camera } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, SHADOWS } from '@/constants/theme';

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
}: ProfileAvatarProps) {
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const dims = SIZE_MAP[size];
  const radius = dims.container / 2;
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  const content = (
    <Animated.View entering={ZoomIn.delay(100).springify()}>
      <View
        style={[
          styles.container,
          {
            width: dims.container,
            height: dims.container,
            borderRadius: radius,
          },
          size === 'large' && SHADOWS.md,
          size !== 'large' && SHADOWS.sm,
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[
              styles.image,
              {
                width: dims.container,
                height: dims.container,
                borderRadius: radius,
              },
            ]}
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
              },
            ]}
          >
            <Text style={[styles.initial, { fontSize: dims.font }]}>{initial}</Text>
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
            <ActivityIndicator color="#FFFFFF" size={size === 'small' ? 'small' : 'large'} />
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
  container: {
    overflow: 'visible',
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
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

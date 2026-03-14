import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { storage as appwriteStorage, ID, STORAGE_BUCKETS } from '@/lib/appwrite';

export type ImageSource = 'camera' | 'library';

async function requestPermission(source: ImageSource): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function pickImage(source: ImageSource): Promise<string | null> {
  const hasPermission = await requestPermission(source);
  if (!hasPermission) return null;

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: Platform.OS === 'web',
  };

  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets?.[0]) return null;

  return result.assets[0].uri;
}

export async function uploadAvatar(
  profileId: string,
  imageUri: string
): Promise<string | null> {
  try {
    const file = {
      name: `avatar_${profileId}.jpg`,
      type: 'image/jpeg',
      size: 0,
      uri: imageUri,
    };

    const uploaded = await appwriteStorage.createFile(
      STORAGE_BUCKETS.AVATARS,
      ID.unique(),
      file as any
    );

    const url = appwriteStorage.getFileView(STORAGE_BUCKETS.AVATARS, uploaded.$id);
    return url.toString();
  } catch (err) {
    console.error('Avatar upload failed:', err);
    return null;
  }
}

export async function deleteAvatar(profileId: string): Promise<boolean> {
  try {
    return true;
  } catch {
    return false;
  }
}

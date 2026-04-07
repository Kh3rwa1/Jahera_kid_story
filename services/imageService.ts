import { storage,STORAGE_BUCKETS } from '@/lib/appwrite';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

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
    const uriParts = imageUri.split('.');
    const ext = uriParts[uriParts.length - 1]?.split('?')[0] || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
    
    // Create a safe 36 char custom ID
    const fileId = profileId.replace(/[^a-zA-Z0-9.\-_]/g, '_').substring(0, 36);

    // Delete existing avatar if it exists
    try {
      await storage.deleteFile(STORAGE_BUCKETS.AVATARS, fileId);
    } catch {
      // Ignored if file doesn't exist
    }

    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const blob = await response.blob() as any;
      const file = new File([blob], `avatar.${ext}`, { type: mimeType });

      await storage.createFile(STORAGE_BUCKETS.AVATARS, fileId, file as any);
    } else {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const size = fileInfo.exists ? (fileInfo as FileSystem.FileInfo & { size?: number }).size ?? 0 : 0;

      const file = {
        uri: imageUri,
        name: `avatar.${ext}`,
        type: mimeType,
        size,
      };

      await storage.createFile(STORAGE_BUCKETS.AVATARS, fileId, file as any);
    }

    const fileViewUrl = storage.getFileView(STORAGE_BUCKETS.AVATARS, fileId).toString();
    return fileViewUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}

export async function deleteAvatar(profileId: string): Promise<boolean> {
  try {
    const fileId = profileId.replace(/[^a-zA-Z0-9.\-_]/g, '_').substring(0, 36);
    await storage.deleteFile(STORAGE_BUCKETS.AVATARS, fileId);
    return true;
  } catch {
    return false;
  }
}

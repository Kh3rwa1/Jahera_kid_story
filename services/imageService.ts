import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { storage, ID, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, STORAGE_BUCKETS } from '@/lib/appwrite';

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
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      const fileName = `${profileId}_avatar.${ext}`;

      const uploaded = await storage.createFile(
        STORAGE_BUCKETS.AVATARS,
        ID.unique(),
        new File([blob], fileName, { type: mimeType }) as any
      );
      return `${APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKETS.AVATARS}/files/${uploaded.$id}/view?project=${APPWRITE_PROJECT_ID}`;
    }

    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    const size = fileInfo.exists ? (fileInfo as FileSystem.FileInfo & { size?: number }).size ?? 0 : 0;

    const uriParts = imageUri.split('.');
    const ext = uriParts[uriParts.length - 1]?.split('?')[0] || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
    const fileName = `${profileId}_avatar.${ext}`;

    const file = {
      uri: imageUri,
      name: fileName,
      type: mimeType,
      size,
    };

    const uploaded = await storage.createFile(
      STORAGE_BUCKETS.AVATARS,
      ID.unique(),
      file as any
    );

    return `${APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKETS.AVATARS}/files/${uploaded.$id}/view?project=${APPWRITE_PROJECT_ID}`;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}

export async function deleteAvatar(_profileId: string): Promise<boolean> {
  return true;
}

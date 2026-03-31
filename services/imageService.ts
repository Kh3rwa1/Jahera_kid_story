import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';

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
    const filePath = `${profileId}/avatar.${ext}`;

    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: mimeType });

      if (error) {
        console.error('Error uploading avatar:', error);
        return null;
      }
    } else {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const size = fileInfo.exists ? (fileInfo as FileSystem.FileInfo & { size?: number }).size ?? 0 : 0;

      const file = {
        uri: imageUri,
        name: `avatar.${ext}`,
        type: mimeType,
        size,
      };

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file as any, { upsert: true, contentType: mimeType });

      if (error) {
        console.error('Error uploading avatar:', error);
        return null;
      }
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl ?? null;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}

export async function deleteAvatar(profileId: string): Promise<boolean> {
  try {
    const { data: files } = await supabase.storage
      .from('avatars')
      .list(profileId);

    if (files && files.length > 0) {
      const paths = files.map(f => `${profileId}/${f.name}`);
      await supabase.storage.from('avatars').remove(paths);
    }
    return true;
  } catch {
    return false;
  }
}

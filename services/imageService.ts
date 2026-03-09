import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

const BUCKET = 'avatars';

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
    const fileName = `${profileId}-${Date.now()}.jpg`;
    const filePath = `${profileId}/${fileName}`;

    await deleteAvatarFolder(profileId);

    const response = await fetch(imageUri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Avatar upload failed:', err);
    return null;
  }
}

async function deleteAvatarFolder(profileId: string): Promise<void> {
  try {
    const { data: files } = await supabase.storage
      .from(BUCKET)
      .list(profileId);

    if (files && files.length > 0) {
      const paths = files.map(f => `${profileId}/${f.name}`);
      await supabase.storage.from(BUCKET).remove(paths);
    }
  } catch {
    // Silently fail - old files will remain
  }
}

export async function deleteAvatar(profileId: string): Promise<boolean> {
  try {
    await deleteAvatarFolder(profileId);
    return true;
  } catch {
    return false;
  }
}

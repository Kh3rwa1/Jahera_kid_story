import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { profileService, languageService, familyMemberService, friendService } from '@/services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Friends() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [friends, setFriends] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addFriend = () => {
    const trimmedName = currentName.trim();

    if (trimmedName.length > 0) {
      setFriends([...friends, trimmedName]);
      setCurrentName('');
    }
  };

  const removeFriend = (index: number) => {
    setFriends(friends.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      const languages = JSON.parse(params.languages as string);
      const kidName = params.kidName as string;
      const familyMembers = JSON.parse((params.familyMembers as string) || '[]');

      const primaryLanguage = languages[0]?.code || 'en';
      const profile = await profileService.create(kidName, primaryLanguage);

      if (!profile) {
        Alert.alert('Error', 'Failed to create profile. Please try again.');
        setIsLoading(false);
        return;
      }

      await Promise.all([
        ...languages.map((lang: { code: string; name: string }) =>
          languageService.add(profile.id, lang.code, lang.name)
        ),
        ...familyMembers.map((name: string) => familyMemberService.add(profile.id, name)),
        ...friends.map(name => friendService.add(profile.id, name)),
      ]);

      await AsyncStorage.setItem('profileId', profile.id);

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Friends</Text>
          <Text style={styles.subtitle}>
            Who are {params.kidName}'s friends? (Optional)
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter friend's name"
            placeholderTextColor="#adb5bd"
            value={currentName}
            onChangeText={setCurrentName}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={addFriend}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              (currentName.trim().length === 0 || isLoading) && styles.addButtonDisabled,
            ]}
            onPress={addFriend}
            disabled={currentName.trim().length === 0 || isLoading}
            activeOpacity={0.8}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No friends added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add friends who join the adventures
              </Text>
            </View>
          ) : (
            friends.map((friend, index) => (
              <View key={index} style={styles.friendCard}>
                <Text style={styles.friendName}>{friend}</Text>
                <TouchableOpacity
                  onPress={() => removeFriend(index)}
                  style={styles.removeButton}
                  activeOpacity={0.7}
                  disabled={isLoading}>
                  <X size={20} color="#dc3545" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>Step 4 of 4</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={isLoading}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
          disabled={isLoading}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.completeButton, isLoading && styles.completeButtonDisabled]}
          onPress={handleComplete}
          activeOpacity={0.8}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.completeButtonText}>Complete</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#212529',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  addButton: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#adb5bd',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  friendName: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0d6efd',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 8,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  backButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  skipButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#198754',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

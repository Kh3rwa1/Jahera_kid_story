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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';

export default function FamilyMembers() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');

  const addFamilyMember = () => {
    const trimmedName = currentName.trim();

    if (trimmedName.length > 0) {
      setFamilyMembers([...familyMembers, trimmedName]);
      setCurrentName('');
    }
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    router.push({
      pathname: '/onboarding/friends',
      params: {
        languages: params.languages as string,
        kidName: params.kidName as string,
        familyMembers: JSON.stringify(familyMembers),
      },
    });
  };

  const handleSkip = () => {
    router.push({
      pathname: '/onboarding/friends',
      params: {
        languages: params.languages as string,
        kidName: params.kidName as string,
        familyMembers: JSON.stringify([]),
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Family Members</Text>
          <Text style={styles.subtitle}>
            Who should join {params.kidName} in the adventures? (Optional)
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter family member name"
            placeholderTextColor="#adb5bd"
            value={currentName}
            onChangeText={setCurrentName}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={addFamilyMember}
          />
          <TouchableOpacity
            style={[styles.addButton, currentName.trim().length === 0 && styles.addButtonDisabled]}
            onPress={addFamilyMember}
            disabled={currentName.trim().length === 0}
            activeOpacity={0.8}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {familyMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No family members added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add parents, siblings, or other family members
              </Text>
            </View>
          ) : (
            familyMembers.map((member, index) => (
              <View key={index} style={styles.memberCard}>
                <Text style={styles.memberName}>{member}</Text>
                <TouchableOpacity
                  onPress={() => removeFamilyMember(index)}
                  style={styles.removeButton}
                  activeOpacity={0.7}>
                  <X size={20} color="#dc3545" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>Step 3 of 4</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.continueButtonText}>Continue</Text>
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
  memberCard: {
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
  memberName: {
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
  continueButton: {
    flex: 1,
    backgroundColor: '#0d6efd',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

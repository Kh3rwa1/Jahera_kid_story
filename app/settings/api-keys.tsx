import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save, Eye, EyeOff, Key, CircleCheck as CheckCircle } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/constants/theme';
import { apiKeysService, API_KEY_NAMES } from '@/services/apiKeysService';
import { handleError, showErrorAlert } from '@/utils/errorHandler';

interface ApiKeyField {
  name: string;
  label: string;
  description: string;
  placeholder: string;
  keyName: string;
}

const API_KEY_FIELDS: ApiKeyField[] = [
  {
    name: 'openai',
    label: 'OpenAI API Key',
    description: 'Required for story generation using OpenRouter',
    placeholder: 'sk-...',
    keyName: API_KEY_NAMES.OPENAI,
  },
  {
    name: 'elevenlabs',
    label: 'ElevenLabs API Key',
    description: 'Required for text-to-speech audio generation',
    placeholder: 'Enter your ElevenLabs API key',
    keyName: API_KEY_NAMES.ELEVENLABS,
  },
];

export default function ApiKeysScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [validKeys, setValidKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys: Record<string, string> = {};
      const valid: Record<string, boolean> = {};

      for (const field of API_KEY_FIELDS) {
        const key = await apiKeysService.getApiKey(field.keyName);
        if (key && key !== 'your-api-key-here') {
          keys[field.name] = key;
          valid[field.name] = apiKeysService.validateApiKey(field.keyName, key);
        }
      }

      setApiKeys(keys);
      setValidKeys(valid);
    } catch (error) {
      const appError = handleError(error, 'loadApiKeys');
      showErrorAlert(appError, 'Failed to Load API Keys');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updates: Promise<void>[] = [];

      for (const field of API_KEY_FIELDS) {
        const value = apiKeys[field.name];
        if (value && value.trim() && value !== 'your-api-key-here') {
          if (!apiKeysService.validateApiKey(field.keyName, value)) {
            Alert.alert(
              'Invalid API Key',
              `The ${field.label} appears to be invalid. Please check and try again.`,
              [{ text: 'OK' }]
            );
            return;
          }

          updates.push(
            apiKeysService.setApiKey(field.keyName, value.trim())
          );
        }
      }

      await Promise.all(updates);

      Alert.alert('Success', 'API keys saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      const appError = handleError(error, 'saveApiKeys');
      showErrorAlert(appError, 'Failed to Save API Keys');
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (name: string) => {
    setShowKeys(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleKeyChange = (name: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [name]: value }));

    const field = API_KEY_FIELDS.find(f => f.name === name);
    if (field && value) {
      setValidKeys(prev => ({
        ...prev,
        [name]: apiKeysService.validateApiKey(field.keyName, value),
      }));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>API Keys</Text>
          <Text style={styles.headerSubtitle}>Manage your API keys</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBox}>
          <Key size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            API keys are stored securely in the database and are never exposed to the client.
          </Text>
        </View>

        {API_KEY_FIELDS.map(field => (
          <View key={field.name} style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              {validKeys[field.name] && (
                <CheckCircle size={16} color={COLORS.success} />
              )}
            </View>
            <Text style={styles.fieldDescription}>{field.description}</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={
                  showKeys[field.name]
                    ? apiKeys[field.name] || ''
                    : apiKeysService.maskApiKey(apiKeys[field.name] || '')
                }
                onChangeText={value => handleKeyChange(field.name, value)}
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.text.light}
                secureTextEntry={!showKeys[field.name]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => toggleShowKey(field.name)}>
                {showKeys[field.name] ? (
                  <EyeOff size={20} color={COLORS.text.secondary} />
                ) : (
                  <Eye size={20} color={COLORS.text.secondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>Where to get API keys?</Text>
          <Text style={styles.helpText}>
            • OpenAI/OpenRouter: Visit openrouter.ai to get your API key
          </Text>
          <Text style={styles.helpText}>
            • ElevenLabs: Visit elevenlabs.io to get your API key
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save API Keys</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: SPACING.xxl,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
  },
  fieldDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
  },
  input: {
    flex: 1,
    padding: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
  },
  eyeButton: {
    padding: SPACING.lg,
  },
  helpBox: {
    backgroundColor: '#FFF3CD',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
  },
  helpTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  helpText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  footer: {
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
});

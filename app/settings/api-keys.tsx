import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Key,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  Save,
  ExternalLink,
} from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, FONTS, FONT_SIZES, SHADOWS } from '@/constants/theme';
import { apiKeysService, API_KEY_NAMES } from '@/services/apiKeysService';
import { useTheme } from '@/contexts/ThemeContext';

interface ApiKeyField {
  id: string;
  label: string;
  provider: string;
  description: string;
  placeholder: string;
  keyName: string;
  helpText: string;
  helpUrl: string;
  badge?: string;
}

const API_KEY_FIELDS: ApiKeyField[] = [
  {
    id: 'openrouter',
    label: 'OpenRouter API Key',
    provider: 'OpenRouter',
    description: 'Recommended — access to hundreds of AI models at lower cost',
    placeholder: 'sk-or-v1-...',
    keyName: API_KEY_NAMES.OPENROUTER,
    helpText: 'Get your free key at openrouter.ai',
    helpUrl: 'https://openrouter.ai/keys',
    badge: 'Recommended',
  },
  {
    id: 'openai',
    label: 'OpenAI API Key',
    provider: 'OpenAI',
    description: 'Direct access to GPT-4o-mini for story generation',
    placeholder: 'sk-...',
    keyName: API_KEY_NAMES.OPENAI,
    helpText: 'Get your key at platform.openai.com',
    helpUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'elevenlabs',
    label: 'ElevenLabs API Key',
    provider: 'ElevenLabs',
    description: 'Optional — enables audio narration in any language',
    placeholder: 'Enter your ElevenLabs API key',
    keyName: API_KEY_NAMES.ELEVENLABS,
    helpText: 'Get your key at elevenlabs.io',
    helpUrl: 'https://elevenlabs.io',
  },
];

export default function ApiKeysScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys: Record<string, string> = {};
      for (const field of API_KEY_FIELDS) {
        const key = await apiKeysService.getApiKey(field.keyName);
        if (key) keys[field.id] = key;
      }
      setApiKeys(keys);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    for (const field of API_KEY_FIELDS) {
      const value = apiKeys[field.id];
      if (value && value.trim()) {
        if (!apiKeysService.validateApiKey(field.keyName, value.trim())) {
          newErrors[field.id] = `Invalid ${field.provider} key format`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const hasOpenRouter = !!apiKeys.openrouter?.trim();
    const hasOpenAI = !!apiKeys.openai?.trim();
    if (!hasOpenRouter && !hasOpenAI) {
      setErrors({ openrouter: 'At least one AI key (OpenRouter or OpenAI) is required' });
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      for (const field of API_KEY_FIELDS) {
        const value = apiKeys[field.id];
        if (value && value.trim()) {
          await apiKeysService.setApiKey(field.keyName, value.trim());
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setErrors({ general: 'Failed to save keys. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyChange = (id: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: '' }));
  };

  const isKeyValid = (field: ApiKeyField) => {
    const val = apiKeys[field.id];
    return !!val && apiKeysService.validateApiKey(field.keyName, val);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: COLORS.background }]}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: COLORS.background }]}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: COLORS.cardBackground }]} activeOpacity={0.7}>
          <ArrowLeft size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.topBarContent}>
          <Text style={[styles.topBarTitle, { color: COLORS.text.primary }]}>API Keys</Text>
          <Text style={[styles.topBarSub, { color: COLORS.text.secondary }]}>Power your stories</Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInUp.delay(60).springify()} style={[styles.infoBanner, { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary + '30' }]}>
          <Key size={18} color={COLORS.primary} strokeWidth={2} />
          <Text style={[styles.infoText, { color: COLORS.text.secondary }]}>
            Keys are stored locally on your device. Add <Text style={{ color: COLORS.primary, fontFamily: FONTS.bold }}>OpenRouter</Text> or <Text style={{ color: COLORS.primary, fontFamily: FONTS.bold }}>OpenAI</Text> to generate stories.
          </Text>
        </Animated.View>

        {API_KEY_FIELDS.map((field, i) => {
          const valid = isKeyValid(field);
          const hasError = !!errors[field.id];
          const hasValue = !!apiKeys[field.id];

          return (
            <Animated.View key={field.id} entering={FadeInUp.delay(100 + i * 60).springify()}>
              <View style={[
                styles.keyCard,
                { backgroundColor: COLORS.cardBackground, borderColor: valid ? COLORS.success + '50' : hasError ? COLORS.error + '50' : 'transparent' },
              ]}>
                <View style={styles.keyCardHeader}>
                  <View style={styles.keyCardTitle}>
                    <Text style={[styles.keyLabel, { color: COLORS.text.primary }]}>{field.label}</Text>
                    {field.badge && (
                      <View style={[styles.badge, { backgroundColor: COLORS.primary + '18' }]}>
                        <Text style={[styles.badgeText, { color: COLORS.primary }]}>{field.badge}</Text>
                      </View>
                    )}
                  </View>
                  {valid && <CheckCircle size={18} color={COLORS.success} />}
                  {hasError && <AlertCircle size={18} color={COLORS.error} />}
                </View>

                <Text style={[styles.keyDesc, { color: COLORS.text.secondary }]}>{field.description}</Text>

                <View style={[
                  styles.inputWrap,
                  { backgroundColor: COLORS.background, borderColor: valid ? COLORS.success + '40' : hasError ? COLORS.error + '50' : COLORS.text.light + '20' },
                ]}>
                  <TextInput
                    style={[styles.input, { color: COLORS.text.primary }]}
                    value={showKeys[field.id] ? (apiKeys[field.id] || '') : apiKeysService.maskApiKey(apiKeys[field.id] || '')}
                    onChangeText={v => handleKeyChange(field.id, v)}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.text.light}
                    secureTextEntry={!showKeys[field.id]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => {
                      if (!showKeys[field.id]) setShowKeys(prev => ({ ...prev, [field.id]: true }));
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowKeys(prev => ({ ...prev, [field.id]: !prev[field.id] }))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.eyeBtn}
                  >
                    {showKeys[field.id]
                      ? <EyeOff size={18} color={COLORS.text.light} />
                      : <Eye size={18} color={COLORS.text.light} />
                    }
                  </TouchableOpacity>
                </View>

                {hasError && (
                  <Text style={[styles.errorMsg, { color: COLORS.error }]}>{errors[field.id]}</Text>
                )}

                {!hasValue && (
                  <View style={styles.helpRow}>
                    <ExternalLink size={12} color={COLORS.primary} />
                    <Text style={[styles.helpText, { color: COLORS.primary }]}>{field.helpText}</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}

        {errors.general && (
          <Animated.View entering={FadeInDown.springify()} style={[styles.generalError, { backgroundColor: COLORS.error + '12' }]}>
            <AlertCircle size={16} color={COLORS.error} />
            <Text style={[styles.generalErrorText, { color: COLORS.error }]}>{errors.general}</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(340).springify()} style={styles.bottomPadding} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: COLORS.background, borderTopColor: COLORS.text.primary + '08' }]}>
        {saved && (
          <Animated.View entering={FadeInDown.springify()} style={[styles.savedBanner, { backgroundColor: COLORS.success + '15' }]}>
            <CheckCircle size={16} color={COLORS.success} />
            <Text style={[styles.savedText, { color: COLORS.success }]}>Keys saved successfully</Text>
          </Animated.View>
        )}
        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.88}>
          <LinearGradient
            colors={saving ? [COLORS.text.light, COLORS.text.light] : [COLORS.primary, COLORS.primaryDark]}
            style={styles.saveBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {saving
              ? <ActivityIndicator color="#FFF" size="small" />
              : (
                <>
                  <Save size={18} color="#FFF" strokeWidth={2.5} />
                  <Text style={styles.saveBtnText}>Save Keys</Text>
                </>
              )
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xs,
  },
  topBarContent: { flex: 1 },
  topBarTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.4,
  },
  topBarSub: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginTop: 1,
  },

  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },

  keyCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1.5,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  keyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  keyCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  keyLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.pill,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.3,
  },
  keyDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    lineHeight: 19,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.lg,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
    paddingVertical: SPACING.md,
  },
  eyeBtn: {
    paddingLeft: SPACING.sm,
  },

  errorMsg: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semibold,
    marginTop: 2,
  },

  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semibold,
  },

  generalError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  generalErrorText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
    flex: 1,
  },

  bottomPadding: { height: SPACING.xxl },

  footer: {
    padding: SPACING.xl,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
  },
  savedText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 17,
    borderRadius: BORDER_RADIUS.pill,
    ...SHADOWS.lg,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.extrabold,
    letterSpacing: 0.2,
  },
});

import {
  BORDER_RADIUS,
  FONT_SIZES,
  FONTS,
  SHADOWS,
  SPACING,
} from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors } from '@/types/theme';
import { generateAudio } from '@/services/audioService';
import { profileService } from '@/services/database';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  HelpCircle,
  Mic2,
  Play,
  Save,
  Settings2,
  Volume2,
  Wand2,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

const RECOMMENDED_VOICES = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    description: 'Warm, calm, & storytelling',
    gender: 'Female',
  },
  {
    id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    description: 'Upbeat, energetic, & fun',
    gender: 'Male',
  },
  {
    id: 'FGY2WhTYpPnrIDTdsKH5',
    name: 'Laura',
    description: 'Gentle, soothing, & motherly',
    gender: 'Female',
  },
  {
    id: 'EMuO6fFLrXKOryHzij6K',
    name: 'Grandma Clo',
    description: 'Warm grandma storyteller',
    gender: 'Female',
  },
  {
    id: '8FsOrsZSELg9otqX9nPu',
    name: 'Reva (Dadi)',
    description: 'Hindi Dadi, familiar & warm',
    gender: 'Female',
  },
];

const MODELS = [
  {
    id: 'eleven_multilingual_v2',
    name: 'Multilingual v2',
    description: 'Best for all languages (High Quality)',
  },
  {
    id: 'eleven_turbo_v2_5',
    name: 'Turbo v2.5',
    description: 'Lowest latency (Faster, slightly lower quality)',
  },
];

export default function AudioSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const styles = useStyles(C, insets);
  const { profile, updateProfile } = useApp();

  const [voiceId, setVoiceId] = useState(
    profile?.elevenlabs_voice_id || RECOMMENDED_VOICES[0].id,
  );
  const [modelId, setModelId] = useState(
    profile?.elevenlabs_model_id || MODELS[0].id,
  );
  const [stability, setStability] = useState(
    profile?.elevenlabs_stability ?? 0.65,
  );
  const [similarity, setSimilarity] = useState(
    profile?.elevenlabs_similarity ?? 0.8,
  );
  const [style, setStyle] = useState(profile?.elevenlabs_style ?? 0.35);
  const [speakerBoost, setSpeakerBoost] = useState(
    profile?.elevenlabs_speaker_boost ?? true,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updates = {
        elevenlabs_voice_id: voiceId,
        elevenlabs_model_id: modelId,
        elevenlabs_stability: stability,
        elevenlabs_similarity: similarity,
        elevenlabs_style: style,
        elevenlabs_speaker_boost: speakerBoost,
      };

      const result = await profileService.update(profile.id, updates);
      if (result) {
        updateProfile(updates);
        Alert.alert('Success', 'Audio settings saved successfully!');
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    if (isPreviewing) return;
    setIsPreviewing(true);
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const testText =
        "Hi! I'm your Jahera storyteller. I can't wait to go on a magical adventure with you!";
      const settings = {
        voiceId,
        modelId,
        stability,
        similarity,
        style,
        speakerBoost,
      };

      const audioUrl = await generateAudio(
        testText,
        profile?.primary_language || 'en',
        undefined,
        true,
        settings,
      );

      if (audioUrl) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
        );
        setSound(newSound);
      } else {
        Alert.alert(
          'Preview Failed',
          'Could not generate a preview. Please check your internet connection.',
        );
      }
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={C.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Audio Settings</Text>
          <Text style={styles.headerSubtitle}>
            Customize your storytelling voice
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButtonHeader, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Save size={22} color={C.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* RECOMMENDED VOICES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mic2 size={20} color={C.primary} />
            <Text style={styles.sectionTitle}>Recommended Voices</Text>
          </View>
          <View style={styles.voiceGrid}>
            {RECOMMENDED_VOICES.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.voiceCard,
                  voiceId === v.id && styles.activeVoiceCard,
                  {
                    borderColor:
                      voiceId === v.id ? C.primary : C.text.light + '20',
                  },
                ]}
                onPress={() => setVoiceId(v.id)}
              >
                <View
                  style={[
                    styles.voiceIcon,
                    {
                      backgroundColor:
                        voiceId === v.id ? C.primary : C.text.light + '12',
                    },
                  ]}
                >
                  <Volume2
                    size={24}
                    color={voiceId === v.id ? '#FFFFFF' : C.text.light}
                  />
                </View>
                <View style={styles.voiceInfo}>
                  <Text
                    style={[
                      styles.voiceName,
                      voiceId === v.id && { color: C.primary },
                    ]}
                  >
                    {v.name}
                  </Text>
                  <Text style={styles.voiceDesc} numberOfLines={1}>
                    {v.gender} • {v.description}
                  </Text>
                </View>
                {voiceId === v.id && (
                  <View
                    style={[styles.activeDot, { backgroundColor: C.primary }]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customIdWrap}>
            <TextInput
              style={[
                styles.customIdInput,
                { borderColor: C.text.light + '30', color: C.text.primary },
              ]}
              placeholder="Custom ElevenLabs Voice ID"
              placeholderTextColor={C.text.light}
              value={voiceId}
              onChangeText={setVoiceId}
            />
            <HelpCircle size={18} color={C.text.light} />
          </View>
        </View>

        {/* AI MODEL */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wand2 size={20} color={C.primary} />
            <Text style={styles.sectionTitle}>AI Model</Text>
          </View>
          {MODELS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.modelItem,
                modelId === m.id && {
                  backgroundColor: C.primary + '08',
                  borderColor: C.primary,
                },
              ]}
              onPress={() => setModelId(m.id)}
            >
              <View style={styles.modelContent}>
                <Text
                  style={[
                    styles.modelName,
                    modelId === m.id && { color: C.primary },
                  ]}
                >
                  {m.name}
                </Text>
                <Text style={styles.modelDesc}>{m.description}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  { borderColor: modelId === m.id ? C.primary : C.text.light },
                ]}
              >
                {modelId === m.id && (
                  <View
                    style={[styles.radioFill, { backgroundColor: C.primary }]}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* VOICE SETTINGS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings2 size={20} color={C.primary} />
            <Text style={styles.sectionTitle}>Voice Fine-Tuning</Text>
          </View>

          {/* Stability */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>
                Stability: {(stability * 100).toFixed(0)}%
              </Text>
              <Text style={styles.sliderHint}>
                Higher = flatter, Lower = more expressive
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={stability}
              onValueChange={setStability}
              minimumTrackTintColor={C.primary}
              maximumTrackTintColor={C.text.light + '30'}
              thumbTintColor={C.primary}
            />
          </View>

          {/* Similarity */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>
                Similarity Boost: {(similarity * 100).toFixed(0)}%
              </Text>
              <Text style={styles.sliderHint}>
                Fidelity to the original voice character
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={similarity}
              onValueChange={setSimilarity}
              minimumTrackTintColor={C.primary}
              maximumTrackTintColor={C.text.light + '30'}
              thumbTintColor={C.primary}
            />
          </View>

          {/* Style */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>
                Style Exaggeration: {(style * 100).toFixed(0)}%
              </Text>
              <Text style={styles.sliderHint}>Level of stylized speaking</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={style}
              onValueChange={setStyle}
              minimumTrackTintColor={C.primary}
              maximumTrackTintColor={C.text.light + '30'}
              thumbTintColor={C.primary}
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Speaker Boost</Text>
              <Text style={styles.switchHint}>
                Boosts the prominence of the narrator
              </Text>
            </View>
            <Switch
              value={speakerBoost}
              onValueChange={setSpeakerBoost}
              trackColor={{
                false: C.text.light + '40',
                true: C.primary + '80',
              }}
              thumbColor={speakerBoost ? C.primary : '#F4F3F4'}
            />
          </View>
        </View>

        {/* PREVIEW */}
        <View style={styles.previewBox}>
          <TouchableOpacity
            style={[styles.previewButton, isPreviewing && { opacity: 0.8 }]}
            onPress={handlePreview}
            disabled={isPreviewing}
          >
            <LinearGradient
              colors={C.gradients.sunset}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewGradient}
            >
              {isPreviewing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.previewText}>Test selected settings</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.disclaimerRow}>
            <AlertCircle size={14} color={C.text.light} />
            <Text style={styles.disclaimer}>
              Previews use around 0.1 ElevenLabs credits.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.mainSaveButton, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <LinearGradient
            colors={C.gradients.primary}
            style={styles.mainSaveGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.mainSaveText}>Save Audio Preferences</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const useStyles = (C: ThemeColors, insets: EdgeInsets) => {
  return React.useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: C.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: SPACING.xl,
          paddingBottom: SPACING.lg,
          paddingTop: insets.top + (SPACING.md || 12),
          backgroundColor: C.background,
        },
        backButton: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SPACING.md,
          ...SHADOWS.xs,
          backgroundColor: C.cardBackground,
        },
        saveButtonHeader: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          ...SHADOWS.xs,
          backgroundColor: C.cardBackground,
        },
        headerContent: { flex: 1 },
        headerTitle: {
          fontSize: FONT_SIZES.xxl,
          fontFamily: FONTS.bold,
          color: C.text.primary,
        },
        headerSubtitle: {
          fontSize: FONT_SIZES.sm,
          marginTop: 2,
          color: C.text.secondary,
        },
        content: { flex: 1 },
        scrollContent: { padding: SPACING.xl, paddingBottom: SPACING.xxxl * 2 },
        section: { marginBottom: SPACING.xxl },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          marginBottom: SPACING.lg,
        },
        sectionTitle: {
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.bold,
          color: C.text.primary,
        },

        voiceGrid: { gap: SPACING.md },
        voiceCard: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.md,
          borderRadius: BORDER_RADIUS.lg,
          borderWidth: 1.5,
          backgroundColor: C.cardBackground,
          ...SHADOWS.xs,
        },
        activeVoiceCard: { backgroundColor: C.primary + '05' },
        voiceIcon: {
          width: 44,
          height: 44,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        voiceInfo: { flex: 1, marginLeft: SPACING.md },
        voiceName: {
          fontSize: 16,
          fontFamily: FONTS.bold,
          color: C.text.primary,
        },
        voiceDesc: { fontSize: 13, color: C.text.secondary, marginTop: 2 },
        activeDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          marginLeft: SPACING.md,
        },

        customIdWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
          marginTop: SPACING.lg,
          paddingHorizontal: SPACING.md,
        },
        customIdInput: {
          flex: 1,
          height: 44,
          borderWidth: 1,
          borderRadius: BORDER_RADIUS.md,
          paddingHorizontal: SPACING.md,
          fontSize: 14,
          fontFamily: FONTS.medium,
          backgroundColor: C.cardBackground,
        },

        modelItem: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.lg,
          borderRadius: BORDER_RADIUS.lg,
          borderWidth: 1,
          borderColor: C.text.light + '20',
          marginBottom: SPACING.md,
          backgroundColor: C.cardBackground,
        },
        modelContent: { flex: 1 },
        modelName: {
          fontSize: 15,
          fontFamily: FONTS.bold,
          color: C.text.primary,
        },
        modelDesc: { fontSize: 12, color: C.text.secondary, marginTop: 4 },
        radio: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        radioFill: { width: 12, height: 12, borderRadius: 6 },

        sliderGroup: { marginBottom: SPACING.xl },
        sliderHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        },
        sliderLabel: {
          fontSize: 14,
          fontFamily: FONTS.semibold,
          color: C.text.primary,
        },
        sliderHint: { fontSize: 10, color: C.text.light },
        slider: { width: '100%', height: 40 },

        switchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: SPACING.md,
        },
        switchLabel: {
          fontSize: 14,
          fontFamily: FONTS.semibold,
          color: C.text.primary,
        },
        switchHint: { fontSize: 12, color: C.text.secondary, marginTop: 2 },

        previewBox: { marginTop: SPACING.lg, alignItems: 'center' },
        previewButton: {
          width: '100%',
          height: 56,
          borderRadius: BORDER_RADIUS.xl,
          overflow: 'hidden',
          ...SHADOWS.md,
        },
        previewGradient: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.md,
        },
        previewText: { fontSize: 16, fontFamily: FONTS.bold, color: '#FFFFFF' },
        disclaimerRow: {
          flexDirection: 'row',
          gap: 6,
          alignItems: 'center',
          marginTop: SPACING.md,
        },
        disclaimer: {
          fontSize: 10,
          color: C.text.light,
          fontFamily: FONTS.medium,
        },

        mainSaveButton: {
          marginTop: SPACING.xxl,
          height: 60,
          borderRadius: BORDER_RADIUS.xl,
          overflow: 'hidden',
          ...SHADOWS.lg,
        },
        mainSaveGradient: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        mainSaveText: {
          fontSize: 18,
          fontFamily: FONTS.bold,
          color: '#FFFFFF',
        },
      }),
    [C],
  );
};

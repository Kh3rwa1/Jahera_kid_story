import { VOICE_PRESETS } from '@/constants/voicePresets';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Lock } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  selectedVoice: string | null;
  onSelect: (voiceId: string | null) => void;
  isPremium: boolean;
  languageCode: string;
}

export function VoicePresetPicker({ selectedVoice, onSelect, isPremium, languageCode }: Readonly<Props>) {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const presets = VOICE_PRESETS.filter(p => p.languages.includes(languageCode));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {presets.map(preset => {
        const locked = preset.isPremium && !isPremium;
        const selected = selectedVoice === preset.id;
        return (
          <TouchableOpacity key={preset.id} disabled={locked} onPress={() => onSelect(selected ? null : preset.id)} activeOpacity={0.85} style={{ width: 220 }}>
            <LinearGradient colors={selected ? [colors.primary, colors.primaryDark] : [colors.cardBackground, colors.cardBackground]} style={[styles.card, { borderColor: selected ? 'transparent' : colors.text.light + '20' }]}>
              <View style={styles.head}><Text style={styles.emoji}>{preset.emoji}</Text>{preset.isPremium ? <Crown size={14} color={locked ? colors.text.light : '#F59E0B'} /> : null}{locked ? <Lock size={14} color={colors.text.light} /> : null}</View>
              <Text style={[styles.title, { color: selected ? '#fff' : colors.text.primary }]}>{preset.label}</Text>
              <Text style={[styles.desc, { color: selected ? 'rgba(255,255,255,0.9)' : colors.text.secondary }]}>{preset.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: SPACING.sm, paddingHorizontal: SPACING.lg },
  card: { borderWidth: 1.5, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, minHeight: 120 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emoji: { fontSize: 22, marginRight: 'auto' },
  title: { fontFamily: FONTS.bold, fontSize: 16, marginTop: SPACING.sm },
  desc: { fontFamily: FONTS.medium, fontSize: 12, marginTop: 4 },
});

import { VOICE_PRESETS } from '@/constants/voicePresets';
import { BORDER_RADIUS, BREAKPOINTS, FONTS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Lock } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

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

  const { width: winWidth } = useWindowDimensions();
  const isTablet = winWidth >= BREAKPOINTS.tablet;

  // Responsive sizing
  const cardWidth    = isTablet ? 280 : 220;
  const cardPad      = isTablet ? SPACING.xl : SPACING.md;
  const cardMinH     = isTablet ? 160 : 120;
  const cardRadius   = isTablet ? BORDER_RADIUS.xl : BORDER_RADIUS.lg;
  const emojiSize    = isTablet ? 30 : 22;
  const titleSize    = isTablet ? 19 : 16;
  const descSize     = isTablet ? 14 : 12;
  const iconSize     = isTablet ? 18 : 14;
  const rowGap       = isTablet ? SPACING.md : SPACING.sm;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { gap: rowGap }]}>
      {presets.map((preset, index) => {
        const locked = preset.isPremium && !isPremium;
        const selected = selectedVoice === preset.id;
        return (
          <Animated.View
            key={preset.id}
            entering={FadeInRight.delay(100 + index * 80).springify().damping(14)}
          >
            <TouchableOpacity disabled={locked} onPress={() => onSelect(selected ? null : preset.id)} activeOpacity={0.85} style={{ width: cardWidth }}>
              <LinearGradient
                colors={selected ? [colors.primary, colors.primaryDark] : [colors.cardBackground, colors.cardBackground]}
                style={[styles.card, { borderColor: selected ? 'transparent' : colors.text.light + '20', padding: cardPad, minHeight: cardMinH, borderRadius: cardRadius }]}
              >
                <View style={styles.head}>
                  <Text style={{ fontSize: emojiSize, marginRight: 'auto' }}>{preset.emoji}</Text>
                  {preset.isPremium ? <Crown size={iconSize} color={locked ? colors.text.light : '#F59E0B'} /> : null}
                  {locked ? <Lock size={iconSize} color={colors.text.light} /> : null}
                </View>
                <Text style={[styles.title, { color: selected ? '#fff' : colors.text.primary, fontSize: titleSize }]}>{preset.label}</Text>
                <Text style={[styles.desc, { color: selected ? 'rgba(255,255,255,0.9)' : colors.text.secondary, fontSize: descSize }]}>{preset.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: SPACING.lg },
  card: { borderWidth: 1.5 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: FONTS.bold, marginTop: SPACING.sm },
  desc: { fontFamily: FONTS.medium, marginTop: 4 },
});

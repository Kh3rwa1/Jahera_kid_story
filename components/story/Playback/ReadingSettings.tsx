import { BORDER_RADIUS,FONTS,SPACING } from '@/constants/theme';
import {
FONT_FAMILY_VALUES,
FontFamily,
LineSpacing,
useReadingPreferences
} from '@/contexts/ReadingPreferencesContext';
import { ThemeColors } from '@/types/theme';
import { hapticFeedback } from '@/utils/haptics';
import { Minus,Plus } from 'lucide-react-native';
import {
ScrollView,
StyleSheet,
Text,
TouchableOpacity,
View,
} from 'react-native';
import Animated,{ FadeInDown } from 'react-native-reanimated';

const FONT_FAMILIES: FontFamily[] = ['nunito', 'merriweather', 'comic-neue', 'atkinson'];
const LINE_SPACINGS: LineSpacing[] = ['compact', 'normal', 'relaxed'];

interface ReadingSettingsProps {
  colors: ThemeColors;
  accentColor: string;
}

export function ReadingSettings({ colors, accentColor }: Readonly<ReadingSettingsProps>) {
  const { prefs, setFontSize, setFontFamily, setLineSpacing, setTextAlign } = useReadingPreferences();

  return (
    <Animated.View entering={FadeInDown.duration(200)} style={[styles.container, { backgroundColor: colors.cardBackground, borderBottomColor: colors.text.light + '20' }]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>Size</Text>
        <View style={styles.fontSizeRow}>
          <TouchableOpacity
            onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize - 1); }}
            style={[styles.fontSizeBtn, { backgroundColor: colors.text.primary + '08' }]}
          >
            <Minus size={14} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.fontSizeNum, { color: colors.text.primary }]}>{prefs.fontSize}</Text>
          <TouchableOpacity
            onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize + 1); }}
            style={[styles.fontSizeBtn, { backgroundColor: accentColor + '25' }]}
          >
            <Plus size={14} color={accentColor} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.text.light + '20' }]} />

      <View style={styles.fontSection}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>Font</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FONT_FAMILIES.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => { hapticFeedback.light(); setFontFamily(f); }}
              style={[
                styles.chip,
                { borderColor: colors.text.light + '40' },
                prefs.fontFamily === f && { backgroundColor: accentColor, borderColor: accentColor },
              ]}
            >
              <Text style={[
                styles.chipText,
                { fontFamily: FONT_FAMILY_VALUES[f].regular, color: prefs.fontFamily === f ? '#FFF' : colors.text.secondary }
              ]}>
                {FONT_FAMILY_VALUES[f].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.text.light + '20' }]} />

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>Spacing</Text>
        <View style={styles.chipRow}>
          {LINE_SPACINGS.map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => { hapticFeedback.light(); setLineSpacing(s); }}
              style={[
                styles.chip,
                { borderColor: colors.text.light + '40' },
                prefs.lineSpacing === s && { backgroundColor: accentColor, borderColor: accentColor },
              ]}
            >
              <Text style={[
                styles.chipText,
                { color: prefs.lineSpacing === s ? '#FFF' : colors.text.secondary }
              ]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fontSizeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeNum: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    minWidth: 24,
    textAlign: 'center',
  },
  divider: {
    height: 1,
  },
  fontSection: {
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
});

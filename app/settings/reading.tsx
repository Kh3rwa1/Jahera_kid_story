import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, RotateCcw, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  useReadingPreferences,
  LINE_SPACING_VALUES,
  FONT_FAMILY_VALUES,
  LineSpacing,
  TextAlign,
  FontFamily,
} from '@/contexts/ReadingPreferencesContext';
import { SPACING, BORDER_RADIUS, FONTS, FONT_SIZES, SHADOWS } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';

const PREVIEW_TEXT =
  "Once upon a time, in a forest filled with sparkling fireflies, a young child discovered a hidden door between two ancient oak trees. Behind it lay a world of wonders waiting to be explored.";

const FONT_OPTIONS: FontFamily[] = ['nunito', 'merriweather', 'comic-neue', 'atkinson'];

export default function ReadingPreferencesScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const { prefs, setFontSize, setLineSpacing, setTextAlign, setFontFamily, resetToDefaults } =
    useReadingPreferences();

  const lineHeight = prefs.fontSize * LINE_SPACING_VALUES[prefs.lineSpacing];
  const activeFontDef = FONT_FAMILY_VALUES[prefs.fontFamily];

  const spacingOptions: { id: LineSpacing; label: string }[] = [
    { id: 'compact', label: 'Compact' },
    { id: 'normal', label: 'Normal' },
    { id: 'relaxed', label: 'Relaxed' },
  ];

  const alignOptions: { id: TextAlign; label: string }[] = [
    { id: 'left', label: 'Left' },
    { id: 'justify', label: 'Justify' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { backgroundColor: C.background }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: C.cardBackground }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={C.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: C.text.primary, fontFamily: FONTS.bold }]}>
            Reading Preferences
          </Text>
          <Text style={[styles.headerSub, { color: C.text.secondary }]}>
            Customize how stories look
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { hapticFeedback.light(); resetToDefaults(); }}
          style={[styles.resetBtn, { backgroundColor: C.cardBackground }]}
          activeOpacity={0.7}
        >
          <RotateCcw size={18} color={C.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.previewCard, { backgroundColor: C.cardBackground, ...SHADOWS.sm }]}>
          <Text style={[styles.previewLabel, { color: C.text.light, fontFamily: FONTS.medium }]}>
            Preview
          </Text>
          <Text
            style={[
              styles.previewText,
              {
                fontSize: prefs.fontSize,
                lineHeight,
                fontFamily: activeFontDef.regular,
                color: C.text.primary,
                textAlign: prefs.textAlign,
              },
            ]}
          >
            {PREVIEW_TEXT}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: C.cardBackground }]}>
          <Text style={[styles.sectionLabel, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
            FONT STYLE
          </Text>
          <View style={styles.fontGrid}>
            {FONT_OPTIONS.map(key => {
              const def = FONT_FAMILY_VALUES[key];
              const isActive = prefs.fontFamily === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => { hapticFeedback.light(); setFontFamily(key); }}
                  style={[
                    styles.fontCard,
                    {
                      backgroundColor: isActive ? C.primary + '10' : C.background,
                      borderColor: isActive ? C.primary : C.text.light + '28',
                      borderWidth: isActive ? 2 : 1.5,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.fontCardHeader}>
                    <Text
                      style={[
                        styles.fontCardName,
                        {
                          fontFamily: def.bold,
                          color: isActive ? C.primary : C.text.primary,
                        },
                      ]}
                    >
                      {def.label}
                    </Text>
                    {isActive && (
                      <View style={[styles.fontCheckBadge, { backgroundColor: C.primary }]}>
                        <Check size={10} color="#FFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.fontCardSample,
                      {
                        fontFamily: def.regular,
                        color: C.text.secondary,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {def.sample}
                  </Text>
                  <Text
                    style={[
                      styles.fontCardPreview,
                      {
                        fontFamily: def.regular,
                        color: isActive ? C.primary : C.text.primary,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    The quick brown fox jumps over the lazy dog
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: C.cardBackground }]}>
          <Text style={[styles.sectionLabel, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
            FONT SIZE
          </Text>
          <View style={styles.fontSizeRow}>
            <TouchableOpacity
              onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize - 1); }}
              style={[styles.stepBtn, { backgroundColor: C.background }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.stepBtnText, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                −
              </Text>
            </TouchableOpacity>

            <View style={styles.fontSizeTrack}>
              {[13, 15, 17, 19, 21, 23, 26].map(size => (
                <TouchableOpacity
                  key={size}
                  onPress={() => { hapticFeedback.light(); setFontSize(size); }}
                  style={[
                    styles.fontSizeStep,
                    {
                      backgroundColor:
                        prefs.fontSize === size ? C.primary : C.background,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.fontSizeStepText,
                      {
                        color: prefs.fontSize === size ? '#FFF' : C.text.secondary,
                        fontFamily: FONTS.semibold,
                      },
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize + 1); }}
              style={[styles.stepBtn, { backgroundColor: C.primary }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.stepBtnText, { color: '#FFF', fontFamily: FONTS.bold }]}>
                +
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.currentValue, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
            {prefs.fontSize}px
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: C.cardBackground }]}>
          <Text style={[styles.sectionLabel, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
            LINE SPACING
          </Text>
          <View style={styles.optionRow}>
            {spacingOptions.map(opt => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => { hapticFeedback.light(); setLineSpacing(opt.id); }}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor:
                      prefs.lineSpacing === opt.id ? C.primary : C.background,
                    borderColor:
                      prefs.lineSpacing === opt.id ? C.primary : C.text.light + '30',
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    {
                      color: prefs.lineSpacing === opt.id ? '#FFF' : C.text.secondary,
                      fontFamily: FONTS.semibold,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: C.cardBackground }]}>
          <Text style={[styles.sectionLabel, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
            TEXT ALIGNMENT
          </Text>
          <View style={styles.optionRow}>
            {alignOptions.map(opt => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => { hapticFeedback.light(); setTextAlign(opt.id); }}
                style={[
                  styles.optionBtn,
                  styles.optionBtnWide,
                  {
                    backgroundColor:
                      prefs.textAlign === opt.id ? C.primary : C.background,
                    borderColor:
                      prefs.textAlign === opt.id ? C.primary : C.text.light + '30',
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    {
                      color: prefs.textAlign === opt.id ? '#FFF' : C.text.secondary,
                      fontFamily: FONTS.semibold,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => { hapticFeedback.medium(); resetToDefaults(); }}
          style={[styles.resetFullBtn, { borderColor: C.text.light + '30' }]}
          activeOpacity={0.7}
        >
          <RotateCcw size={16} color={C.text.secondary} />
          <Text style={[styles.resetFullBtnText, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
            Reset to Defaults
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md, ...SHADOWS.xs,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: FONT_SIZES.xxl },
  headerSub: { fontSize: FONT_SIZES.sm, marginTop: 2 },
  resetBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.xs,
  },

  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.xl,
    gap: SPACING.md,
    paddingBottom: SPACING.xxxl * 2,
  },

  previewCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  previewLabel: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  previewText: {},

  section: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: SPACING.lg,
  },

  fontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  fontCard: {
    width: '47.5%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  },
  fontCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  fontCardName: {
    fontSize: 14,
  },
  fontCheckBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontCardSample: {
    fontSize: 10,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  fontCardPreview: {
    fontSize: 12,
    lineHeight: 17,
  },

  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 22, lineHeight: 26 },
  fontSizeTrack: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  fontSizeStep: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 36,
    alignItems: 'center',
  },
  fontSizeStepText: { fontSize: 13 },
  currentValue: {
    textAlign: 'center',
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
  },

  optionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  optionBtnWide: { flex: 1 },
  optionBtnText: { fontSize: FONT_SIZES.sm },

  resetFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    marginTop: SPACING.sm,
  },
  resetFullBtnText: { fontSize: FONT_SIZES.sm },
});

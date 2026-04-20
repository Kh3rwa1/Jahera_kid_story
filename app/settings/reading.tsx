import { BORDER_RADIUS,FONTS,FONT_SIZES,SHADOWS,SPACING } from '@/constants/theme';
import {
FONT_FAMILY_VALUES,
FontFamily,
LINE_SPACING_VALUES,
LineSpacing,
TextAlign,
useReadingPreferences,
} from '@/contexts/ReadingPreferencesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { hapticFeedback } from '@/utils/haptics';
import { useRouter } from 'expo-router';
import { ArrowLeft,Check,RotateCcw } from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { EdgeInsets,useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorScheme } from '@/constants/themeSchemes';

const PREVIEW_TEXT =
  "Once upon a time, in a forest filled with sparkling fireflies, a young child discovered a hidden door between two ancient oak trees. Behind it lay a world of wonders waiting to be explored.";

const FONT_OPTIONS: FontFamily[] = ['nunito', 'merriweather', 'comic-neue', 'atkinson'];

export default function ReadingPreferencesScreen() {
  const router = useRouter();
  const winWidth = useWindowDimensions().width;
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const { prefs, setFontSize, setLineSpacing, setTextAlign, setFontFamily, resetToDefaults } =
    useReadingPreferences();

  const styles = useStyles(C, insets);

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={C.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Reading Preferences
          </Text>
          <Text style={styles.headerSub}>
            Customize how stories look
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { hapticFeedback.light(); resetToDefaults(); }}
          style={styles.resetBtn}
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
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
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
                    isActive && styles.fontCardActive,
                    { width: (winWidth - SPACING.xl * 2 - SPACING.sm) / 2 },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.fontCardHeader}>
                    <Text
                      style={[
                        styles.fontCardName,
                        isActive && styles.fontCardNameActive,
                        { fontFamily: def.bold },
                      ]}
                    >
                      {def.label}
                    </Text>
                    {isActive && (
                      <View style={styles.fontCheckBadge}>
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
                      isActive && styles.fontCardPreviewActive,
                      { fontFamily: def.regular },
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            FONT SIZE
          </Text>
          <View style={styles.fontSizeRow}>
            <TouchableOpacity
              onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize - 1); }}
              style={styles.stepBtnMinus}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnTextMinus}>
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
                    prefs.fontSize === size && styles.fontSizeStepActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.fontSizeStepText,
                      prefs.fontSize === size && styles.fontSizeStepTextActive,
                      { color: prefs.fontSize === size ? '#FFF' : C.text.secondary },
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize + 1); }}
              style={styles.stepBtnPlus}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnTextPlus}>
                +
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.currentValue}>
            {prefs.fontSize}px
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            LINE SPACING
          </Text>
          <View style={styles.optionRow}>
            {spacingOptions.map(opt => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => { hapticFeedback.light(); setLineSpacing(opt.id); }}
                style={[
                  styles.optionBtn,
                  prefs.lineSpacing === opt.id && styles.optionBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    prefs.lineSpacing === opt.id && styles.optionBtnTextActive,
                    { color: prefs.lineSpacing === opt.id ? '#FFF' : C.text.secondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
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
                  prefs.textAlign === opt.id && styles.optionBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionBtnText,
                    prefs.textAlign === opt.id && styles.optionBtnTextActive,
                    { color: prefs.textAlign === opt.id ? '#FFF' : C.text.secondary },
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
          style={styles.resetFullBtn}
          activeOpacity={0.7}
        >
          <RotateCcw size={16} color={C.text.secondary} />
          <Text style={styles.resetFullBtnText}>
            Reset to Defaults
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const useStyles = (C: ColorScheme['colors'], insets: EdgeInsets) => {
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
      paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
      paddingTop: insets.top + (SPACING.sm || 12),
    },
    backBtn: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.cardBackground, ...SHADOWS.xs,
    },
    headerText: { flex: 1 },
    headerTitle: { fontSize: FONT_SIZES.xxl, color: C.text.primary, fontFamily: FONTS.bold },
    headerSub: { fontSize: FONT_SIZES.sm, color: C.text.secondary, marginTop: 2 },
    resetBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.cardBackground, ...SHADOWS.xs,
    },
    scroll: { flex: 1 },
    scrollContent: {
      padding: SPACING.xl, gap: SPACING.md,
      paddingBottom: SPACING.xxxl * 2,
    },
    previewCard: {
      borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl,
      marginBottom: SPACING.sm, backgroundColor: C.cardBackground, ...SHADOWS.sm,
    },
    previewLabel: {
      fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
      marginBottom: SPACING.md, color: C.text.light, fontFamily: FONTS.medium,
    },
    previewText: { color: C.text.primary },
    section: {
      borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl,
      backgroundColor: C.cardBackground,
      marginBottom: SPACING.md,
    },
    sectionLabel: {
      fontSize: 11, letterSpacing: 1, marginBottom: SPACING.lg,
      color: C.text.secondary, fontFamily: FONTS.semibold,
    },
    fontGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    fontCard: {
      borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, gap: 4,
      backgroundColor: C.background, borderColor: C.text.light + '28', borderWidth: 1.5,
    },
    fontCardActive: { backgroundColor: C.primary + '10', borderColor: C.primary, borderWidth: 2 },
    fontCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    fontCardName: { fontSize: 14, color: C.text.primary },
    fontCardNameActive: { color: C.primary },
    fontCheckBadge: {
      width: 18, height: 18, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.primary,
    },
    fontCardSample: { fontSize: 10, letterSpacing: 0.2, marginBottom: 4, color: C.text.secondary },
    fontCardPreview: { fontSize: 12, lineHeight: 17, color: C.text.primary },
    fontCardPreviewActive: { color: C.primary },
    fontSizeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    stepBtnMinus: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background },
    stepBtnPlus: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary },
    stepBtnTextMinus: { fontSize: 22, lineHeight: 26, color: C.text.primary, fontFamily: FONTS.bold },
    stepBtnTextPlus: { fontSize: 22, lineHeight: 26, color: '#FFF', fontFamily: FONTS.bold },
    fontSizeTrack: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
    fontSizeStep: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: BORDER_RADIUS.sm, minWidth: 36, alignItems: 'center', backgroundColor: C.background },
    fontSizeStepActive: { backgroundColor: C.primary },
    fontSizeStepText: { fontSize: 13, color: C.text.secondary, fontFamily: FONTS.semibold },
    fontSizeStepTextActive: { color: '#FFF' },
    currentValue: { textAlign: 'center', marginTop: SPACING.md, fontSize: FONT_SIZES.sm, color: C.text.secondary, fontFamily: FONTS.medium },
    optionRow: { flexDirection: 'row', gap: SPACING.sm },
    optionBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, alignItems: 'center', backgroundColor: C.background, borderColor: C.text.light + '30' },
    optionBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
    optionBtnWide: { flex: 1 },
    optionBtnText: { fontSize: FONT_SIZES.sm, color: C.text.secondary, fontFamily: FONTS.semibold },
    optionBtnTextActive: { color: '#FFF' },
    resetFullBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: SPACING.sm, paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
      marginTop: SPACING.sm, borderColor: C.text.light + '30',
    },
    resetFullBtnText: { fontSize: FONT_SIZES.sm, color: C.text.secondary, fontFamily: FONTS.semibold },
  }), [C]);
};

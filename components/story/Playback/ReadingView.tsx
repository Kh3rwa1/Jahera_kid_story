import { BORDER_RADIUS,FONTS,SPACING } from '@/constants/theme';
import {
FONT_FAMILY_VALUES,
FontFamily,
LINE_SPACING_VALUES,
LineSpacing,
ReadingPrefs
} from '@/contexts/ReadingPreferencesContext';
import { getScriptFontOverride,splitIntoTokens } from '@/hooks/useWordHighlighting';
import { ThemeColors } from '@/types/theme';
import { Sparkles } from 'lucide-react-native';
import { useMemo,useRef } from 'react';
import {
ScrollView,
StyleSheet,
Text,
View,
} from 'react-native';

interface ReadingViewProps {
  content: string;
  paragraphs: string[];
  activeWordIndex: number;
  activeParaIndex: number;
  accentColor: string;
  colors: ThemeColors;
  prefs: ReadingPrefs;
  languageCode?: string;
  storyTheme?: string;
  storyMood?: string;
}

export function ReadingView({
  paragraphs,
  activeWordIndex,
  activeParaIndex,
  accentColor,
  colors,
  prefs,
  languageCode,
  storyTheme,
  storyMood
}: Readonly<ReadingViewProps>) {
  const scrollRef = useRef<ScrollView>(null);
  const paraOffsets = useRef<number[]>([]);
  
  const lineHeight = prefs.fontSize * LINE_SPACING_VALUES[prefs.lineSpacing as LineSpacing];
  const activeFontDef = FONT_FAMILY_VALUES[(prefs.fontFamily ?? 'nunito') as FontFamily];
  const scriptFontOverride = getScriptFontOverride(languageCode);

  const activeWordStyle = useMemo(() => ({
    color: accentColor,
    backgroundColor: accentColor + '20',
    borderRadius: 3,
    fontFamily: scriptFontOverride ?? activeFontDef.bold,
    overflow: 'hidden' as const,
  }), [accentColor, activeFontDef.bold, scriptFontOverride]);

  const baseWordStyle = useMemo(() => ({
    fontSize: prefs.fontSize,
    lineHeight,
    fontFamily: scriptFontOverride ?? activeFontDef.regular,
    color: colors.text.secondary,
  }), [prefs.fontSize, lineHeight, activeFontDef.regular, colors.text.secondary, scriptFontOverride]);

  let globalWordCounter = 0;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.fill}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.meta, { borderLeftColor: accentColor }]}>
        {storyTheme && (
          <View style={[styles.badge, { backgroundColor: accentColor + '18', borderColor: accentColor + '35' }]}>
            <Sparkles size={10} color={accentColor} />
            <Text style={[styles.badgeText, { color: accentColor }]}>{storyTheme}</Text>
          </View>
        )}
        {storyMood && (
          <View style={[styles.badge, { backgroundColor: colors.text.primary + '08', borderColor: colors.text.primary + '12' }]}>
            <Text style={[styles.badgeText, { color: colors.text.secondary }]}>{storyMood}</Text>
          </View>
        )}
      </View>

      {paragraphs.map((para, paraIdx) => {
        const tokens = splitIntoTokens(para);
        return (
          <Text
            key={`para-${para.slice(0, 24)}-${paraIdx}`}
            onLayout={(e) => { paraOffsets.current[paraIdx] = e.nativeEvent.layout.y; }}
            style={[
              styles.paragraph,
              { marginBottom: prefs.fontSize * 1.2 },
              prefs.textAlign === 'justify' && { textAlign: 'justify' },
            ]}
          >
            {tokens.map((token, ti) => {
              if (token.isSpace) return <Text key={`sp-${paraIdx}-${ti}`}> </Text>;
              
              const wIdx = globalWordCounter++;
              const isActive = wIdx === activeWordIndex;
              const isPast = wIdx < activeWordIndex && activeWordIndex > 0;
              
              return (
                <Text
                  key={`w-${paraIdx}-${ti}`}
                  style={[
                    baseWordStyle,
                    isPast && { color: colors.text.primary },
                    isActive && activeWordStyle,
                  ]}
                >
                  {token.word}
                </Text>
              );
            })}
          </Text>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: SPACING.xxl },
  meta: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: 32,
    paddingLeft: 12,
    borderLeftWidth: 3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    textTransform: 'capitalize',
  },
  paragraph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

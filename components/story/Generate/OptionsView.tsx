import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Check, Globe, MapPin, Wand as Wand2, Sparkles, ChevronLeft } from 'lucide-react-native';
import { THEMES, MOODS, LENGTHS } from '@/constants/storyOptions';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { CharacterManager } from '@/components/CharacterManager';
import { ShimmerCta } from '@/components/ui/ShimmerCta';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { ThemeColors } from '@/types/theme';
import { hapticFeedback } from '@/utils/haptics';

interface OptionsViewProps {
  colors: ThemeColors;
  selectedTheme: string;
  setSelectedTheme: (id: string) => void;
  selectedMood: string;
  setSelectedMood: (id: string) => void;
  selectedLength: 'short' | 'medium' | 'long';
  setSelectedLength: (id: 'short' | 'medium' | 'long') => void;
  selectedLanguage: string;
  setSelectedLanguage: (id: string) => void;
  familyMembers: any[];
  friends: any[];
  onFamilyMembersChange: (fm: any[]) => void;
  onFriendsChange: (fr: any[]) => void;
  locationLabel: string;
  onStart: () => void;
  onBack: () => void;
  subscription: any;
  profileId: string;
}

export function OptionsView({
  colors,
  selectedTheme, setSelectedTheme,
  selectedMood, setSelectedMood,
  selectedLength, setSelectedLength,
  selectedLanguage, setSelectedLanguage,
  familyMembers, friends, onFamilyMembersChange, onFriendsChange,
  locationLabel, onStart, onBack,
  subscription, profileId
}: OptionsViewProps) {
  const { width: winWidth } = useWindowDimensions();
  const CARD_SIZE = (winWidth - SPACING.xl * 2 - SPACING.sm * 3) / 4;
  const isPro = subscription?.plan !== 'free';

  const selectedThemeObj = THEMES.find(t => t.id === selectedTheme)!;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: colors.cardBackground }]}>
            <ChevronLeft size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={[styles.locationPill, { backgroundColor: colors.info + '10', borderColor: colors.info + '30' }]}>
            <MapPin size={12} color={colors.info} strokeWidth={2.5} />
            <Text style={[styles.locationText, { color: colors.info }]}>{locationLabel || 'Locating...'}</Text>
          </View>
        </View>

        <View style={styles.header}>
          <LinearGradient colors={selectedThemeObj.gradient} style={styles.headerAccent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Text style={[styles.pageTitle, { color: colors.text.primary }]}>Craft Your Story</Text>
          <Text style={[styles.pageSubtitle, { color: colors.text.secondary }]}>Choose theme, language, mood & length</Text>
        </View>

        {/* Theme Grid */}
        <Section title="Story Theme" colors={colors} badge={`${selectedThemeObj.emoji} ${selectedThemeObj.label}`} badgeColor={selectedThemeObj.gradient[0]}>
          <View style={styles.themeGrid}>
            {THEMES.map(theme => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={selectedTheme === theme.id}
                size={CARD_SIZE}
                colors={colors}
                onPress={() => setSelectedTheme(theme.id)}
              />
            ))}
          </View> section
        </Section>

        {/* Mood Selector */}
        <Section title="Mood" colors={colors}>
          <View style={styles.moodRow}>
            {MOODS.map(mood => (
              <MoodCard
                key={mood.id}
                mood={mood}
                selected={selectedMood === mood.id}
                colors={colors}
                onPress={() => setSelectedMood(mood.id)}
              />
            ))}
          </View>
        </Section>

        {/* Length Selector */}
        <Section title="Story Length" colors={colors}>
          <View style={styles.lengthRow}>
            {LENGTHS.map(len => (
              <LengthCard
                key={len.id}
                len={len}
                selected={selectedLength === len.id}
                isPro={isPro}
                colors={colors}
                onPress={() => setSelectedLength(len.id as any)}
              />
            ))}
          </View>
        </Section>

        {/* Language Selector */}
        <Section title="Language" colors={colors}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
            {SUPPORTED_LANGUAGES.map(lang => (
              <LanguagePill
                key={lang.code}
                lang={lang}
                selected={selectedLanguage === lang.code}
                colors={colors}
                onPress={() => setSelectedLanguage(lang.code)}
              />
            ))}
          </ScrollView>
        </Section>

        {/* Character Manager */}
        <View style={styles.characterSection}>
          <CharacterManager
            profileId={profileId}
            familyMembers={familyMembers}
            friends={friends}
            onFamilyMembersChange={onFamilyMembersChange}
            onFriendsChange={onFriendsChange}
          />
        </View>

        {/* Footer CTA */}
        <View style={styles.footer}>
          {subscription?.plan === 'free' && (
            <View style={styles.quotaRow}>
              <View style={[styles.quotaDot, { backgroundColor: colors.text.light }]} />
              <Text style={[styles.quotaText, { color: colors.text.light }]}>
                {subscription.stories_remaining} free stories left
              </Text>
            </View>
          )}
          <ShimmerCta
            label="Create Adventure"
            onPress={onStart}
            gradient={selectedThemeObj.gradient}
            renderIcon={() => <Wand2 size={22} color="#FFF" />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, colors, children, badge, badgeColor }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>{title}</Text>
        {badge && (
          <View style={[styles.sectionBadge, { backgroundColor: badgeColor + '15' }]}>
            <Text style={{ color: badgeColor, fontSize: 13, fontFamily: FONTS.bold }}>{badge}</Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

function ThemeCard({ theme, selected, size, colors, onPress }: any) {
  return (
    <TouchableOpacity onPress={() => { hapticFeedback.light(); onPress(); }} activeOpacity={0.7}>
      <View style={[styles.themeCard, { width: size, height: size, backgroundColor: colors.cardBackground, borderColor: selected ? theme.gradient[0] : colors.text.light + '15' }]}>
        <LinearGradient colors={selected ? theme.gradient : ['transparent', 'transparent']} style={StyleSheet.absoluteFill}>
          <View style={styles.themeCardInner}>
            <Text style={styles.themeEmoji}>{theme.emoji}</Text>
            <Text style={[styles.themeLabel, { color: selected ? '#FFF' : colors.text.secondary }]}>{theme.label}</Text>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

function MoodCard({ mood, selected, colors, onPress }: any) {
  return (
    <TouchableOpacity onPress={() => { hapticFeedback.light(); onPress(); }} activeOpacity={0.7} style={{ flex: 1 }}>
      <View style={[styles.moodCard, { backgroundColor: selected ? mood.bg : colors.cardBackground, borderColor: selected ? mood.color : colors.text.light + '15' }]}>
        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
        <Text style={[styles.moodLabel, { color: selected ? mood.color : colors.text.secondary }]}>{mood.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function LengthCard({ len, selected, isPro, colors, onPress }: any) {
  return (
    <TouchableOpacity onPress={() => { hapticFeedback.light(); onPress(); }} activeOpacity={0.7} style={{ flex: 1 }}>
      <View style={[styles.lengthCard, { backgroundColor: colors.cardBackground, borderColor: selected ? colors.primary : colors.text.light + '15' }]}>
        {len.pro && !isPro && <View style={styles.proBadge}><Text style={styles.proText}>PRO</Text></View>}
        <Text style={styles.lengthEmoji}>{len.emoji}</Text>
        <Text style={[styles.lengthTitle, { color: selected ? colors.primary : colors.text.primary }]}>{len.label}</Text>
        <Text style={[styles.lengthDesc, { color: colors.text.light }]}>{len.desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

function LanguagePill({ lang, selected, colors, onPress }: any) {
  return (
    <TouchableOpacity onPress={() => { hapticFeedback.light(); onPress(); }} activeOpacity={0.7}>
      <View style={[styles.langPill, { backgroundColor: selected ? colors.primary : colors.cardBackground, borderColor: selected ? colors.primary : colors.text.light + '20' }]}>
        <Text style={styles.langFlag}>{lang.flag}</Text>
        <Text style={[styles.langName, { color: selected ? '#FFF' : colors.text.primary }]}>{lang.nativeName}</Text>
        {selected && <Check size={14} color="#FFF" strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginVertical: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  locationText: { fontSize: 13, fontFamily: FONTS.semibold },
  header: { paddingHorizontal: 20, marginBottom: 32 },
  headerAccent: { width: 50, height: 6, borderRadius: 3, marginBottom: 16 },
  pageTitle: { fontSize: 38, fontFamily: FONTS.display, letterSpacing: -1 },
  pageSubtitle: { fontSize: 16, fontFamily: FONTS.medium, opacity: 0.8 },
  section: { marginBottom: 32 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  themeCard: { borderRadius: 20, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  themeCardInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 },
  themeEmoji: { fontSize: 28, marginBottom: 4 },
  themeLabel: { fontSize: 12, fontFamily: FONTS.bold },
  moodRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  moodCard: { alignItems: 'center', paddingVertical: 16, borderRadius: 20, borderWidth: 2, gap: 4, ...SHADOWS.xs },
  moodEmoji: { fontSize: 32 },
  moodLabel: { fontSize: 15, fontFamily: FONTS.bold },
  lengthRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  lengthCard: { alignItems: 'center', paddingVertical: 20, borderRadius: 20, borderWidth: 2, gap: 4, position: 'relative' },
  proBadge: { position: 'absolute', top: -10, right: 10, backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  proText: { fontSize: 9, fontFamily: FONTS.bold, color: '#FFF' },
  lengthEmoji: { fontSize: 28 },
  lengthTitle: { fontSize: 16, fontFamily: FONTS.bold },
  lengthDesc: { fontSize: 11, fontFamily: FONTS.medium },
  langScroll: { paddingHorizontal: 20, gap: 10 },
  langPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, borderWidth: 1.5 },
  langFlag: { fontSize: 18 },
  langName: { fontSize: 14, fontFamily: FONTS.bold },
  characterSection: { paddingVertical: 10 },
  footer: { padding: 25, alignItems: 'center', gap: 16 },
  quotaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quotaDot: { width: 6, height: 6, borderRadius: 3 },
  quotaText: { fontSize: 13, fontFamily: FONTS.medium },
});

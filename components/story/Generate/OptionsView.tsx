import { BehaviorGoalPicker } from '@/components/BehaviorGoalPicker';
import { VoicePresetPicker } from '@/components/VoicePresetPicker';
import { ShimmerCta } from '@/components/ui/ShimmerCta';
import { Language, SUPPORTED_LANGUAGES } from '@/constants/languages';
import { LENGTHS, MOODS, THEMES } from '@/constants/storyOptions';
import { FONTS, SHADOWS } from '@/constants/theme';
import { ThemeColors } from '@/types/theme';
import { hapticFeedback } from '@/utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, Wand as Wand2 } from 'lucide-react-native';
import { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

interface OptionsViewProps {
  colors: ThemeColors;
  selectedBehaviorGoal: string | null;
  onBehaviorGoalChange: (goalId: string | null) => void;
  selectedTheme: string;
  setSelectedTheme: (id: string) => void;
  selectedMood: string;
  setSelectedMood: (id: string) => void;
  selectedLength: 'short' | 'medium' | 'long';
  setSelectedLength: (id: 'short' | 'medium' | 'long') => void;
  selectedVoice: string | null;
  onVoiceChange: (voiceId: string | null) => void;
  selectedLanguage: string;
  setSelectedLanguage: (id: string) => void;
  locationLabel: string;
  onStart: () => void;
  onBack: () => void;
  isPremium: boolean;
  languageCode: string;
  subscription: Record<string, any> | null;
  profileId: string;
}

const LENGTH_LABELS: Record<'short'|'medium'|'long', {label: string; desc: string}> = {
  short: { label: 'Quick (5 min)', desc: 'Ideal for a short story' },
  medium: { label: 'Bedtime (10 min)', desc: 'Perfect for nightly routines' },
  long: { label: 'Epic (20+ min)', desc: 'Deep adventure time' },
};

export function OptionsView(props: Readonly<OptionsViewProps>) {
  const { width: winWidth } = useWindowDimensions();
  const GRID_GAP = 12;
  const PADDING_TOTAL = 48; // 24 * 2
  const CARD_SIZE = (winWidth - PADDING_TOTAL - (GRID_GAP * 2)) / 3;
  const isPro = props.isPremium || props.subscription?.plan !== 'free';
  const selectedThemeObj = THEMES.find(t => t.id === props.selectedTheme)!;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={props.onBack} style={[styles.backBtn, { backgroundColor: props.colors.cardBackground }]}>
            <ChevronLeft size={24} color={props.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <Section title="🎯 What should today's story teach?" colors={props.colors}>
          <BehaviorGoalPicker selectedGoal={props.selectedBehaviorGoal} onSelect={props.onBehaviorGoalChange} isPremium={isPro} />
        </Section>

        <Section title="🌍 Pick a story world" colors={props.colors}>
          <View style={styles.themeGrid}>{THEMES.map(theme => <ThemeCard key={theme.id} theme={theme} selected={props.selectedTheme===theme.id} size={CARD_SIZE} colors={props.colors} onPress={() => props.setSelectedTheme(theme.id)} />)}</View>
        </Section>

        <Section title="😊 Story mood" colors={props.colors}>
          <View style={styles.moodRow}>{MOODS.map(mood => <MoodCard key={mood.id} mood={mood} selected={props.selectedMood===mood.id} colors={props.colors} onPress={() => props.setSelectedMood(mood.id)} />)}</View>
        </Section>

        <Section title="⏱️ How long?" colors={props.colors}>
          <View style={styles.lengthRow}>{LENGTHS.map(len => <LengthCard key={len.id} len={len} labels={LENGTH_LABELS[len.id as 'short'|'medium'|'long']} selected={props.selectedLength===len.id} isPro={isPro} colors={props.colors} onPress={() => props.setSelectedLength(len.id as 'short'|'medium'|'long')} />)}</View>
        </Section>

        <Section title="🔊 Choose a storyteller" colors={props.colors}>
          <VoicePresetPicker selectedVoice={props.selectedVoice} onSelect={props.onVoiceChange} isPremium={isPro} languageCode={props.languageCode} />
        </Section>

        <Section title="Language" colors={props.colors}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>{SUPPORTED_LANGUAGES.map(lang => <LanguagePill key={lang.code} lang={lang} selected={props.selectedLanguage===lang.code} colors={props.colors} onPress={() => props.setSelectedLanguage(lang.code)} />)}</ScrollView>
        </Section>


        <View style={styles.footer}><ShimmerCta label="Create Story" onPress={props.onStart} gradient={selectedThemeObj.gradient} renderIcon={() => <Wand2 size={22} color="#FFF" />} /></View>
      </ScrollView>
    </View>
  );
}

interface SectionProps {
  title: string;
  colors: ThemeColors;
  children: ReactNode;
  badge?: string;
  badgeColor?: string;
}
function Section({ title, colors, children, badge, badgeColor }: Readonly<SectionProps>) { return <View style={styles.section}><View style={styles.sectionHead}><Text style={[styles.sectionLabel,{color:colors.text.secondary}]}>{title}</Text>{badge ? <View style={[styles.sectionBadge,{backgroundColor:badgeColor+'15'}]}><Text style={{ color: badgeColor, fontSize: 13, fontFamily: FONTS.bold }}>{badge}</Text></View> : null}</View>{children}</View>; }

interface ThemeCardProps {
  theme: { id: string; label: string; emoji: string; gradient: [string, string] };
  selected: boolean;
  size: number;
  colors: ThemeColors;
  onPress: () => void;
}
function ThemeCard({ theme, selected, size, colors, onPress }: Readonly<ThemeCardProps>) { return <TouchableOpacity onPress={() => { hapticFeedback.light(); onPress(); }}><View style={[styles.themeCard,{ width:size,height:size, backgroundColor: colors.cardBackground, borderColor: selected ? theme.gradient[0] : colors.text.light+'15' }]}><LinearGradient colors={selected ? theme.gradient : ['transparent','transparent']} style={StyleSheet.absoluteFill}><View style={styles.themeCardInner}><Text style={styles.themeEmoji}>{theme.emoji}</Text><Text style={[styles.themeLabel,{ color: selected ? '#FFF' : colors.text.secondary }]}>{theme.label}</Text></View></LinearGradient></View></TouchableOpacity>; }

interface MoodCardProps {
  mood: { id: string; label: string; emoji: string; color: string; bg: string };
  selected: boolean;
  colors: ThemeColors;
  onPress: () => void;
}
function MoodCard({ mood, selected, colors, onPress }: Readonly<MoodCardProps>) { return <TouchableOpacity onPress={() => { hapticFeedback.light(); onPress(); }} style={{ flex:1 }}><View style={[styles.moodCard,{ backgroundColor: selected ? mood.bg : colors.cardBackground, borderColor: selected ? mood.color : colors.text.light+'15' }]}><Text style={styles.moodEmoji}>{mood.emoji}</Text><Text style={[styles.moodLabel,{ color: selected ? mood.color : colors.text.secondary }]}>{mood.label}</Text></View></TouchableOpacity>; }

interface LengthCardProps {
  len: { id: string; label: string; desc: string; emoji: string; pro?: boolean };
  labels: { label: string; desc: string };
  selected: boolean;
  isPro: boolean;
  colors: ThemeColors;
  onPress: () => void;
}
function LengthCard({ len, labels, selected, isPro, colors, onPress }: Readonly<LengthCardProps>) { return <TouchableOpacity onPress={() => { hapticFeedback.light(); onPress(); }} style={{ flex:1 }}><View style={[styles.lengthCard,{ backgroundColor: colors.cardBackground, borderColor: selected ? colors.primary : colors.text.light+'15' }]}>{len.pro && !isPro ? <View style={styles.proBadge}><Text style={styles.proText}>PRO</Text></View> : null}<Text style={styles.lengthEmoji}>{len.emoji}</Text><Text style={[styles.lengthTitle,{ color:selected?colors.primary:colors.text.primary }]}>{labels.label}</Text><Text style={[styles.lengthDesc,{ color: colors.text.light }]}>{labels.desc}</Text></View></TouchableOpacity>; }

interface LanguagePillProps {
  lang: Language;
  selected: boolean;
  colors: ThemeColors;
  onPress: () => void;
}
function LanguagePill({ lang, selected, colors, onPress }: Readonly<LanguagePillProps>) { return <TouchableOpacity onPress={() => { hapticFeedback.light(); onPress(); }}><View style={[styles.langPill,{ backgroundColor:selected?colors.primary:colors.cardBackground, borderColor:selected?colors.primary:colors.text.light+'20' }]}><Text style={styles.langFlag}>{lang.flag}</Text><Text style={[styles.langName,{ color:selected?'#FFF':colors.text.primary }]}>{lang.nativeName}</Text>{selected ? <Check size={14} color="#FFF"/> : null}</View></TouchableOpacity>; }

const styles = StyleSheet.create({ 
  container:{flex:1}, 
  scroll:{paddingBottom:60}, 
  topBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:20,marginTop:20,marginBottom:10}, 
  backBtn:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',...SHADOWS.sm}, 
  section:{marginBottom:32}, 
  sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:24,marginBottom:16}, 
  sectionLabel:{fontSize:14,fontFamily:FONTS.bold,textTransform:'uppercase',letterSpacing:1,opacity:0.6}, 
  sectionBadge:{paddingHorizontal:12,paddingVertical:6,borderRadius:15}, 
  themeGrid:{flexDirection:'row',flexWrap:'wrap',gap:12,paddingHorizontal:24,justifyContent:'flex-start'}, 
  themeCard:{borderRadius:24,borderWidth:2,overflow:'hidden',...SHADOWS.sm}, 
  themeCardInner:{flex:1,alignItems:'center',justifyContent:'center',padding:8}, 
  themeEmoji:{fontSize:32,marginBottom:6}, 
  themeLabel:{fontSize:13,fontFamily:FONTS.bold,textAlign:'center'}, 
  moodRow:{flexDirection:'row',gap:12,paddingHorizontal:24}, 
  moodCard:{alignItems:'center',paddingVertical:20,borderRadius:24,borderWidth:2,gap:4,...SHADOWS.xs}, 
  moodEmoji:{fontSize:36}, 
  moodLabel:{fontSize:16,fontFamily:FONTS.bold}, 
  lengthRow:{flexDirection:'row',gap:12,paddingHorizontal:24}, 
  lengthCard:{alignItems:'center',paddingVertical:24,borderRadius:24,borderWidth:2,gap:6,position:'relative'}, 
  proBadge:{position:'absolute',top:-12,right:12,backgroundColor:'#F59E0B',paddingHorizontal:8,paddingVertical:4,borderRadius:12}, 
  proText:{fontSize:10,fontFamily:FONTS.bold,color:'#FFF'}, 
  lengthEmoji:{fontSize:32}, 
  lengthTitle:{fontSize:15,fontFamily:FONTS.bold,textAlign:'center'}, 
  lengthDesc:{fontSize:12,fontFamily:FONTS.medium,textAlign:'center',paddingHorizontal:4}, 
  langScroll:{paddingHorizontal:24,gap:12}, 
  langPill:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:18,paddingVertical:12,borderRadius:28,borderWidth:2}, 
  langFlag:{fontSize:20}, 
  langName:{fontSize:15,fontFamily:FONTS.bold}, 
  characterSection:{paddingVertical:16}, 
  footer:{padding:32,alignItems:'center',gap:16} 
});

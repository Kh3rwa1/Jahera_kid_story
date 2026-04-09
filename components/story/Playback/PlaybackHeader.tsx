import { MarqueeText } from '@/components/MarqueeText';
import { BORDER_RADIUS,FONTS,SPACING } from '@/constants/theme';
import { TabMode } from '@/hooks/usePlayback';
import { ThemeColors } from '@/types/theme';
import { hapticFeedback } from '@/utils/haptics';
import { ArrowLeft,BookMarked,Headphones,Share2,Type } from 'lucide-react-native';
import {
StyleSheet,
Text,
TouchableOpacity,
View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PlaybackHeaderProps {
  tab: TabMode;
  onTabChange: (tab: TabMode) => void;
  onBack: () => void;
  onShare: () => void;
  onToggleSettings?: () => void;
  showSettingsBtn?: boolean;
  isSettingsOpen?: boolean;
  title: string;
  colors: ThemeColors;
  accentColor: string;
  isAudioMode?: boolean;
}

export function PlaybackHeader({
  tab: _tab,
  onTabChange,
  onBack,
  onShare,
  onToggleSettings,
  showSettingsBtn,
  isSettingsOpen,
  title,
  colors,
  accentColor,
  isAudioMode = false,
}: Readonly<PlaybackHeaderProps>) {
  if (isAudioMode) {
    return (
      <SafeAreaView edges={['top']} style={styles.audioTopBar}>
        <View style={styles.row}>
          <TouchableOpacity onPress={onBack} style={styles.audioBtn}>
            <ArrowLeft size={20} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.audioTabPill}>
            <View style={[styles.audioTabBtn, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
              <Headphones size={13} color="#111" />
              <Text style={[styles.audioTabText, { fontFamily: FONTS.semibold, color: '#111' }]}>Listen</Text>
            </View>
            <TouchableOpacity
              onPress={() => { hapticFeedback.light(); onTabChange('text'); }}
              style={styles.audioTabBtn}
            >
              <BookMarked size={13} color="rgba(255,255,255,0.7)" />
              <Text style={[styles.audioTabText, { fontFamily: FONTS.semibold, color: 'rgba(255,255,255,0.7)' }]}>Read</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onShare} style={styles.audioBtn}>
            <Share2 size={18} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.cardBackground }}>
      <View style={[styles.readNavBar, { borderBottomColor: colors.text.light + '22' }]}>
        <TouchableOpacity onPress={onBack} style={styles.readNavBtn}>
          <ArrowLeft size={20} color={colors.text.primary} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.readNavCenter}>
          <MarqueeText
            text={title}
            style={[styles.readNavTitle, { color: colors.text.primary }]}
          />
          <View style={[styles.readNavAccent, { backgroundColor: accentColor }]} />
        </View>

        <View style={styles.readNavRight}>
          <TouchableOpacity
            onPress={() => { hapticFeedback.light(); onTabChange('audio'); }}
            style={[styles.readNavChip, { backgroundColor: accentColor + '18', borderColor: accentColor + '40' }]}
          >
            <Headphones size={13} color={accentColor} />
            <Text style={{ color: accentColor, fontFamily: FONTS.semibold, fontSize: 11 }}>Audio</Text>
          </TouchableOpacity>
          
          {showSettingsBtn && (
            <TouchableOpacity
              onPress={onToggleSettings}
              style={[styles.readNavIconBtn, isSettingsOpen && { backgroundColor: colors.text.primary + '10' }]}
            >
              <Type size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={onShare} style={styles.readNavIconBtn}>
            <Share2 size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  audioTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  audioBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  audioTabPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: BORDER_RADIUS.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  audioTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.pill,
  },
  audioTabText: {
    fontSize: 14,
  },
  readNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  readNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  readNavCenter: {
    flex: 1,
    alignItems: 'center',
  },
  readNavTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
  },
  readNavAccent: {
    width: 24,
    height: 2.5,
    borderRadius: 2,
    marginTop: 3,
  },
  readNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  readNavChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
  },
  readNavIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

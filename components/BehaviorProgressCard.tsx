import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors } from '@/types/theme';
import { useProgressBar } from '@/utils/animations';
import { BehaviorProgressItem } from '@/utils/behaviorProgress';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

export function BehaviorProgressCard({ progress }: Readonly<{ progress: BehaviorProgressItem[] }>) {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.text.light + '15' }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>📊 Behavior Goals This Month</Text>
      {progress.length === 0 ? (
        <Text style={[styles.empty, { color: colors.text.secondary }]}>Start choosing behavior goals when creating stories to track progress here!</Text>
      ) : progress.map((item, idx) => <ProgressRow key={item.goalId} item={item} index={idx} colors={colors} />)}
    </View>
  );
}

interface ProgressRowProps {
  item: BehaviorProgressItem;
  index: number;
  colors: ThemeColors;
}

function ProgressRow({ item, index, colors }: Readonly<ProgressRowProps>) {
  const barStyle = useProgressBar(item.percentage, 800, index * 100);
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}><Text style={styles.rowLabel}>{item.emoji} {item.label}</Text><Text style={[styles.count, { color: colors.text.secondary }]}>{item.count}</Text></View>
      <View style={[styles.track, { backgroundColor: colors.primary + '15' }]}>
        <Animated.View style={[styles.fill, barStyle]}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, gap: SPACING.md },
  title: { fontFamily: FONTS.bold, fontSize: 18 },
  empty: { fontFamily: FONTS.medium, fontSize: 13 },
  row: { gap: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontFamily: FONTS.semibold, fontSize: 14 },
  count: { fontFamily: FONTS.bold, fontSize: 13 },
  track: { height: 8, borderRadius: 20, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 20, overflow: 'hidden' },
});

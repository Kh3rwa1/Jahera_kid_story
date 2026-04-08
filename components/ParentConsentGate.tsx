import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors } from '@/types/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props { onContinue: (timestamp: string) => void; }

export function ParentConsentGate({ onContinue }: Readonly<Props>) {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [guardianChecked, setGuardianChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const canContinue = guardianChecked && privacyChecked;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Before we begin ✨</Text>
      <CheckRow checked={guardianChecked} label="I am the parent/guardian of the child using this app" onPress={() => setGuardianChecked(v => !v)} colors={colors} />
      <CheckRow checked={privacyChecked} label="I agree to the Privacy Policy" onPress={() => setPrivacyChecked(v => !v)} colors={colors} link />
      <TouchableOpacity disabled={!canContinue} onPress={() => onContinue(new Date().toISOString())}>
        <LinearGradient colors={canContinue ? [colors.primary, colors.primaryDark] : [colors.text.light, colors.text.light]} style={styles.cta}>
          <Text style={styles.ctaText}>Continue</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

interface CheckRowProps {
  checked: boolean;
  label: string;
  onPress: () => void;
  colors: ThemeColors;
  link?: boolean;
}

function CheckRow({ checked, label, onPress, colors, link = false }: Readonly<CheckRowProps>) {
  return (
    <TouchableOpacity onPress={link ? () => { onPress(); Linking.openURL('https://jahera.app/privacy'); } : onPress} style={styles.row}>
      <View style={[styles.box, { borderColor: checked ? colors.primary : colors.text.light }]}>{checked ? <Check size={14} color={colors.primary} /> : null}</View>
      <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: SPACING.xl, gap: SPACING.lg },
  title: { fontFamily: FONTS.extrabold, fontSize: 32 },
  row: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  box: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontFamily: FONTS.medium, fontSize: 15 },
  cta: { marginTop: SPACING.md, borderRadius: BORDER_RADIUS.round, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 16 },
});

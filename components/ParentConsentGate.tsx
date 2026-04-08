import { BORDER_RADIUS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ExternalLink, Shield, Square } from 'lucide-react-native';
import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface ParentConsentGateProps {
  onContinue: (consentTimestamp: string) => void;
}

interface CheckRowProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  linkText?: string;
  linkUrl?: string;
  primaryColor: string;
  textColor: string;
  mutedColor: string;
  isTablet: boolean;
}

function CheckRow({
  checked,
  onToggle,
  label,
  linkText,
  linkUrl,
  primaryColor,
  textColor,
  mutedColor,
  isTablet,
}: Readonly<CheckRowProps>): React.JSX.Element {
  const boxSize = isTablet ? 28 : 24;
  const checkSize = isTablet ? 20 : 16;
  const linkIconSize = isTablet ? 14 : 12;

  return (
    <View style={styles.checkRow}>
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={async () => {
          onToggle();
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        {checked ? (
          <View style={[styles.checkbox, styles.checkboxChecked, { width: boxSize, height: boxSize, backgroundColor: primaryColor }]}>
            <Check color="#FFFFFF" size={checkSize} />
          </View>
        ) : (
          <View style={[styles.checkbox, { width: boxSize, height: boxSize, borderColor: mutedColor }]} />
        )}
      </TouchableOpacity>

      <View style={styles.checkTextWrap}>
        <Text style={[styles.checkLabel, { color: textColor, fontSize: isTablet ? 16 : 14 }]}>{label}</Text>

        {linkText && linkUrl ? (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={async () => {
              await Linking.openURL(linkUrl);
            }}
          >
            <View style={styles.linkRow}>
              <ExternalLink size={linkIconSize} color={primaryColor} />
              <Text style={[styles.linkText, { color: primaryColor, fontSize: isTablet ? 15 : 13 }]}>{linkText}</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function ParentConsentGate({ onContinue }: Readonly<ParentConsentGateProps>) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { currentTheme } = useTheme();
  const { colors } = currentTheme;

  const [isGuardianChecked, setIsGuardianChecked] = useState(false);
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);

  const canContinue = isGuardianChecked && isPrivacyChecked;

  const shieldSize = isTablet ? 100 : 80;
  const shieldRadius = isTablet ? 50 : 40;
  const shieldIconSize = isTablet ? 52 : 40;

  // imported as requested; intentionally unused in UI
  void Square;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View
          style={[
            styles.shieldWrap,
            {
              width: shieldSize,
              height: shieldSize,
              borderRadius: shieldRadius,
              backgroundColor: `${colors.primary}26`,
            },
          ]}
        >
          <Shield size={shieldIconSize} color={colors.primary} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <Text style={[styles.title, { color: colors.text.primary, fontSize: isTablet ? 30 : 24 }]}>Before we begin...</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary, fontSize: isTablet ? 16 : 14, maxWidth: isTablet ? 400 : 320 }]}>
          Jahera is designed for parents to create stories for their children. Please confirm the following:
        </Text>
      </Animated.View>

      <Animated.View style={[styles.checkSection, { maxWidth: isTablet ? 500 : 400 }]} entering={FadeInDown.delay(350).springify()}>
        <CheckRow
          checked={isGuardianChecked}
          onToggle={() => setIsGuardianChecked((prev) => !prev)}
          label="I am the parent or legal guardian of the child this app will be used for"
          primaryColor={colors.primary}
          textColor={colors.text.primary}
          mutedColor={colors.text.light}
          isTablet={isTablet}
        />

        <CheckRow
          checked={isPrivacyChecked}
          onToggle={() => setIsPrivacyChecked((prev) => !prev)}
          label="I have read and agree to the"
          linkText="Privacy Policy"
          linkUrl="https://jahera.app/privacy"
          primaryColor={colors.primary}
          textColor={colors.text.primary}
          mutedColor={colors.text.light}
          isTablet={isTablet}
        />
      </Animated.View>

      <Animated.View style={[styles.buttonSection, { maxWidth: isTablet ? 500 : 400 }]} entering={FadeInUp.delay(500).springify()}>
        <TouchableOpacity
          disabled={!canContinue}
          style={{ opacity: canContinue ? 1 : 0.4 }}
          onPress={async () => {
            if (!canContinue) return;
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            const timestamp = new Date().toISOString();
            onContinue(timestamp);
          }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.continueGradient, { paddingVertical: isTablet ? 20 : 16 }]}
          >
            <Text style={[styles.continueText, { fontSize: isTablet ? 18 : 16 }]}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  shieldWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.md,
    alignSelf: 'center',
    lineHeight: 22,
  },
  checkSection: {
    marginTop: SPACING.xl,
    width: '100%',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  checkbox: {
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: 'transparent',
  },
  checkTextWrap: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  checkLabel: {
    fontFamily: FONTS.medium,
    lineHeight: 22,
  },
  linkButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontFamily: FONTS.medium,
    textDecorationLine: 'underline',
    marginLeft: 4,
  },
  buttonSection: {
    marginTop: SPACING.xl,
    width: '100%',
  },
  continueGradient: {
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.coloredLight,
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
});

export default ParentConsentGate;

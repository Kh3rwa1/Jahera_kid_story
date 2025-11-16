import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import { Achievement } from '@/services/achievementService';
import { PremiumButton } from './PremiumButton';
import { CelebrationOverlay } from './CelebrationOverlay';

const { width } = Dimensions.get('window');

interface AchievementModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  visible,
  achievement,
  onClose,
}) => {
  if (!achievement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={50} style={styles.overlay}>
        <CelebrationOverlay visible={visible} />

        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContainer}>
          <LinearGradient
            colors={COLORS.gradients.magic}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <Text style={styles.emoji}>{achievement.icon}</Text>

            <Text style={styles.title}>Achievement Unlocked!</Text>

            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
            </View>

            <PremiumButton
              title="Awesome!"
              onPress={onClose}
              variant="primary"
              gradient={['#FFFFFF', '#F0F0F0']}
              textStyle={{ color: COLORS.primary }}
              fullWidth
            />
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width - SPACING.xxxl * 2,
    maxWidth: 400,
  },
  card: {
    padding: SPACING.xxxl,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.inverse,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  achievementInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xxl,
    width: '100%',
  },
  achievementTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.inverse,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});

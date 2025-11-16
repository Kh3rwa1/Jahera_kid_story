import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/constants/theme';

export default function Welcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const profileId = await AsyncStorage.getItem('profileId');

      if (profileId) {
        router.replace('/(tabs)');
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    router.push('/onboarding/language-selection');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Sparkles size={80} color={COLORS.primary} strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>DreamTales</Text>
        <Text style={styles.subtitle}>
          Magical stories and fun adventures await!
        </Text>

        <View style={styles.features}>
          <View style={[styles.featureItem, { backgroundColor: '#FFE8DB' }]}>
            <Text style={styles.featureIcon}>📖</Text>
            <Text style={styles.featureText}>Short, engaging stories</Text>
          </View>
          <View style={[styles.featureItem, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Fun quizzes after each story</Text>
          </View>
          <View style={[styles.featureItem, { backgroundColor: '#FFF3CD' }]}>
            <Text style={styles.featureIcon}>🌈</Text>
            <Text style={styles.featureText}>Colorful, kid-friendly design</Text>
          </View>
          <View style={[styles.featureItem, { backgroundColor: '#E8E7FF' }]}>
            <Text style={styles.featureIcon}>🌍</Text>
            <Text style={styles.featureText}>Multi-language support</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleGetStarted} activeOpacity={0.8}>
          <Text style={styles.startButtonText}>Get Started ✨</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFE5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxxl,
  },
  title: {
    fontSize: FONT_SIZES.huge,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  features: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: SPACING.lg,
  },
  featureText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  footer: {
    padding: SPACING.xxl,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
});

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from 'lucide-react-native';

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
          <Book size={80} color="#FF6B35" strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>Story & Quiz Adventures</Text>
        <Text style={styles.subtitle}>
          Short, fun stories with exciting quizzes for young learners
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📖</Text>
            <Text style={styles.featureText}>Short, engaging stories (2-3 sentences)</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Fun quizzes after each story</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🌈</Text>
            <Text style={styles.featureText}>Colorful, kid-friendly design</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🌍</Text>
            <Text style={styles.featureText}>Multi-language support</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleGetStarted} activeOpacity={0.8}>
          <Text style={styles.startButtonText}>Get Started</Text>
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
    backgroundColor: '#FFF8E7',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  content: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFE5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  features: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  footer: {
    padding: 24,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD93D',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});

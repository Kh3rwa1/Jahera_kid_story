import { BORDER_RADIUS,COLORS,FONT_SIZES,FONT_WEIGHTS,SPACING } from '@/constants/theme';
import { BookOpen,Sparkles } from 'lucide-react-native';
import { StyleSheet,Text,TouchableOpacity,View } from 'react-native';

interface EmptyStateProps {
  type?: 'stories' | 'general';
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const getIconForType = (type: string = 'general') => {
  if (type === 'stories') {
    return BookOpen;
  }
  return Sparkles;
};

export const EmptyState = ({ type = 'general', title, description, action }: Readonly<EmptyStateProps>) => {
  const Icon = getIconForType(type);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon size={64} color={COLORS.primary} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{description}</Text>
      {action && (
        <TouchableOpacity style={styles.button} onPress={action.onPress} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFE5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xxl,
    maxWidth: 300,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxxl,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
});

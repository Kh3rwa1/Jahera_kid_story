import { BORDER_RADIUS,COLORS,SPACING } from '@/constants/theme';
import { useSlideInUp } from '@/utils/animations';
import { AlertCircle,Home,RefreshCw,Server,WifiOff } from 'lucide-react-native';
import React from 'react';
import { StyleSheet,View } from 'react-native';
import Animated from 'react-native-reanimated';
import { PremiumButton } from './PremiumButton';
import { PremiumCard } from './PremiumCard';
import { Typography } from './Typography';

type ErrorType = 'network' | 'server' | 'notFound' | 'general';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  testID?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'general',
  title,
  message,
  error,
  onRetry,
  onGoHome,
  showDetails = false,
  testID,
}) => {
  const enterStyle = useSlideInUp(600, 100);

  const getDefaultContent = () => {
    switch (type) {
      case 'network':
        return {
          icon: <WifiOff size={80} color={COLORS.error} strokeWidth={1.5} />,
          title: 'No Internet Connection',
          message: "It seems you're offline. Please check your internet connection and try again.",
        };
      case 'server':
        return {
          icon: <Server size={80} color={COLORS.error} strokeWidth={1.5} />,
          title: 'Server Error',
          message: "We're having trouble connecting to our servers. Please try again in a moment.",
        };
      case 'notFound':
        return {
          icon: <AlertCircle size={80} color={COLORS.warning} strokeWidth={1.5} />,
          title: 'Not Found',
          message: "We couldn't find what you're looking for. It may have been moved or deleted.",
        };
      default:
        return {
          icon: <AlertCircle size={80} color={COLORS.error} strokeWidth={1.5} />,
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred. Please try again.',
        };
    }
  };

  const defaultContent = getDefaultContent();
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <Animated.View
      style={[styles.container, enterStyle]}
      testID={testID}
      accessibilityLabel={`Error: ${title || defaultContent.title}`}
    >
      <View style={styles.iconContainer}>
        {defaultContent.icon}
      </View>

      <Typography variant="h2" align="center" style={styles.title}>
        {title || defaultContent.title}
      </Typography>

      <Typography variant="bodyMedium" color="secondary" align="center" style={styles.message}>
        {message || defaultContent.message}
      </Typography>

      {showDetails && errorMessage && (
        <PremiumCard style={styles.detailsCard} padding={SPACING.md} shadow="sm">
          <Typography variant="caption" color="error" align="center" numberOfLines={3}>
            {errorMessage}
          </Typography>
        </PremiumCard>
      )}

      <View style={styles.actions}>
        {onRetry && (
          <PremiumButton
            title="Try Again"
            onPress={onRetry}
            variant="primary"
            size="large"
            icon={<RefreshCw size={20} color={COLORS.text.inverse} />}
            style={styles.retryButton}
          />
        )}

        {onGoHome && (
          <PremiumButton
            title="Go Home"
            onPress={onGoHome}
            variant="outline"
            size="medium"
            icon={<Home size={18} color={COLORS.primary} />}
            style={styles.homeButton}
          />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.xxxl,
  },
  iconContainer: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: SPACING.md,
  },
  message: {
    marginBottom: SPACING.xl,
    maxWidth: 400,
  },
  detailsCard: {
    width: '100%',
    maxWidth: 400,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.errorLight + '20',
    borderRadius: BORDER_RADIUS.md,
  },
  actions: {
    width: '100%',
    maxWidth: 300,
    gap: SPACING.md,
    alignItems: 'center',
  },
  retryButton: {
    minWidth: 200,
  },
  homeButton: {
    minWidth: 150,
  },
});

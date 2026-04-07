import { Alert } from 'react-native';

export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const handleError = (error: unknown, context?: string): AppError => {
  console.error(`Error in ${context || 'unknown context'}:`, error);

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
      details: error,
    };
  }

  if (error instanceof NetworkError) {
    return {
      message: 'Network error. Please check your connection and try again.',
      code: 'NETWORK_ERROR',
      details: error,
    };
  }

  if (error instanceof DatabaseError) {
    return {
      message: 'Database error. Please try again later.',
      code: 'DATABASE_ERROR',
      details: error,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      details: error,
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    details: error,
  };
};

export const showErrorAlert = (error: AppError, title: string = 'Error') => {
  Alert.alert(title, error.message, [{ text: 'OK' }]);
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error = new Error('No retries attempted');

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

import { AppError,handleError } from '@/utils/errorHandler';
import { useCallback,useEffect,useState } from 'react';

interface UseAsyncDataOptions<T> {
  fetchFn: () => Promise<T>;
  dependencies?: unknown[];
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
}

interface UseAsyncDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: AppError | null;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

export function useAsyncData<T>({
  fetchFn,
  dependencies = [],
  initialData = null,
  onSuccess,
  onError,
}: UseAsyncDataOptions<T>): UseAsyncDataReturn<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await fetchFn();
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const appError = handleError(err, 'useAsyncData');
      setError(appError);
      setData(null);

      if (onError) {
        onError(appError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    setData,
  };
}

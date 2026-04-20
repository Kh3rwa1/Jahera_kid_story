import { useCallback, useEffect, useState } from 'react';
import {
  offlineStoryService,
  OfflineStory,
} from '@/services/offlineStoryService';

export function useOfflineStories() {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineStories, setOfflineStories] = useState<OfflineStory[]>([]);
  const [totalCacheSize, setTotalCacheSize] = useState(0);

  useEffect(() => {
    offlineStoryService.startMonitoring();
    const unsub = offlineStoryService.onConnectionChange(setIsOnline);
    setIsOnline(offlineStoryService.isOnline);
    refreshList();
    return () => {
      unsub();
    };
  }, []);

  const refreshList = useCallback(async () => {
    const stories = await offlineStoryService.getAllOfflineStories();
    setOfflineStories(stories);
    const size = await offlineStoryService.getTotalCacheSize();
    setTotalCacheSize(size);
  }, []);

  const saveForOffline = useCallback(
    async (
      story: Parameters<typeof offlineStoryService.saveStoryOffline>[0],
      quiz?: Parameters<typeof offlineStoryService.saveStoryOffline>[1],
    ) => {
      const success = await offlineStoryService.saveStoryOffline(story, quiz);
      if (success) await refreshList();
      return success;
    },
    [refreshList],
  );

  const removeOffline = useCallback(
    async (storyId: string) => {
      await offlineStoryService.removeOfflineStory(storyId);
      await refreshList();
    },
    [refreshList],
  );

  const clearAll = useCallback(async () => {
    await offlineStoryService.clearAllOfflineStories();
    await refreshList();
  }, [refreshList]);

  const isAvailableOffline = useCallback(
    async (storyId: string) =>
      offlineStoryService.isStoryAvailableOffline(storyId),
    [],
  );

  return {
    isOnline,
    offlineStories,
    totalCacheSize,
    saveForOffline,
    removeOffline,
    clearAll,
    isAvailableOffline,
    refreshList,
  };
}

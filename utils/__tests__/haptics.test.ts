/**
 * Tests for haptics.ts — haptic feedback utilities
 * Includes happy-path AND error/edge case tests (device without haptics).
 */

import { hapticFeedback } from '../haptics';

const mockImpactAsync = jest.fn();
const mockNotificationAsync = jest.fn();
const mockSelectionAsync = jest.fn();

jest.mock('expo-haptics', () => ({
  impactAsync: (...args: unknown[]) => mockImpactAsync(...args),
  notificationAsync: (...args: unknown[]) => mockNotificationAsync(...args),
  selectionAsync: (...args: unknown[]) => mockSelectionAsync(...args),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('hapticFeedback', () => {
  describe('happy path', () => {
    it('light() calls impactAsync with Light style', async () => {
      await hapticFeedback.light();
      expect(mockImpactAsync).toHaveBeenCalledWith('light');
    });

    it('medium() calls impactAsync with Medium style', async () => {
      await hapticFeedback.medium();
      expect(mockImpactAsync).toHaveBeenCalledWith('medium');
    });

    it('heavy() calls impactAsync with Heavy style', async () => {
      await hapticFeedback.heavy();
      expect(mockImpactAsync).toHaveBeenCalledWith('heavy');
    });

    it('success() calls notificationAsync with Success type', async () => {
      await hapticFeedback.success();
      expect(mockNotificationAsync).toHaveBeenCalledWith('success');
    });

    it('warning() calls notificationAsync with Warning type', async () => {
      await hapticFeedback.warning();
      expect(mockNotificationAsync).toHaveBeenCalledWith('warning');
    });

    it('error() calls notificationAsync with Error type', async () => {
      await hapticFeedback.error();
      expect(mockNotificationAsync).toHaveBeenCalledWith('error');
    });

    it('selection() calls selectionAsync', async () => {
      await hapticFeedback.selection();
      expect(mockSelectionAsync).toHaveBeenCalled();
    });
  });

  describe('error handling (device without haptics)', () => {
    it('light() does not throw when haptics fails', async () => {
      mockImpactAsync.mockRejectedValueOnce(new Error('No haptics'));
      await expect(hapticFeedback.light()).resolves.toBeUndefined();
    });

    it('success() does not throw when haptics fails', async () => {
      mockNotificationAsync.mockRejectedValueOnce(new Error('No haptics'));
      await expect(hapticFeedback.success()).resolves.toBeUndefined();
    });

    it('selection() does not throw when haptics fails', async () => {
      mockSelectionAsync.mockRejectedValueOnce(new Error('No haptics'));
      await expect(hapticFeedback.selection()).resolves.toBeUndefined();
    });

    it('celebrate() does not throw when haptics fails', async () => {
      mockImpactAsync.mockRejectedValueOnce(new Error('No haptics'));
      await expect(hapticFeedback.celebrate()).resolves.toBeUndefined();
    });
  });
});

/**
 * Tests for database.ts — profileService and storyService
 * These test the mapDoc helper and error handling patterns.
 */

// Mock Appwrite SDK
import { profileService, storyService, languageService } from '../database';

const mockCreateDocument = jest.fn();
const mockGetDocument = jest.fn();
const mockListDocuments = jest.fn();
const mockUpdateDocument = jest.fn();
const mockDeleteDocument = jest.fn();

jest.mock('@/lib/appwrite', () => ({
  DATABASE_ID: 'test-db',
  COLLECTIONS: {
    PROFILES: 'profiles',
    USER_LANGUAGES: 'user_languages',
    FAMILY_MEMBERS: 'family_members',
    FRIENDS: 'friends',
    STORIES: 'stories',
    QUIZ_QUESTIONS: 'quiz_questions',
    QUIZ_ANSWERS: 'quiz_answers',
    QUIZ_ATTEMPTS: 'quiz_attempts',
    CONFIG: 'config',
  },
  databases: {
    createDocument: (...args: any[]) => mockCreateDocument(...args),
    getDocument: (...args: any[]) => mockGetDocument(...args),
    listDocuments: (...args: any[]) => mockListDocuments(...args),
    updateDocument: (...args: any[]) => mockUpdateDocument(...args),
    deleteDocument: (...args: any[]) => mockDeleteDocument(...args),
  },
  ID: { unique: () => 'unique-id' },
  Query: {
    equal: (field: string, value: unknown) => `${field}=${value}`,
    limit: (n: number) => `limit=${n}`,
    orderDesc: (field: string) => `orderDesc=${field}`,
    orderAsc: (field: string) => `orderAsc=${field}`,
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('profileService', () => {
  describe('create', () => {
    it('creates a profile and maps the document', async () => {
      mockCreateDocument.mockResolvedValue({
        $id: 'p1',
        $createdAt: '2025-01-01',
        $updatedAt: '2025-01-01',
        $permissions: [],
        $databaseId: 'test-db',
        $collectionId: 'profiles',
        user_id: 'u1',
        kid_name: 'Aria',
        primary_language: 'en',
      });

      const result = await profileService.create('u1', 'Aria', 'en');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p1');
      expect(result!.kid_name).toBe('Aria');
      expect(
        (result as unknown as Record<string, unknown>)['$id'],
      ).toBeUndefined();
    });

    it('returns null on error', async () => {
      mockCreateDocument.mockRejectedValue(new Error('Network error'));
      const result = await profileService.create('u1', 'Aria', 'en');
      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('returns mapped profile on success', async () => {
      mockGetDocument.mockResolvedValue({
        $id: 'p2',
        $createdAt: '2025-01-01',
        $updatedAt: '2025-01-01',
        kid_name: 'Max',
      });

      const result = await profileService.getById('p2');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p2');
    });

    it('returns null on error', async () => {
      mockGetDocument.mockRejectedValue(new Error('Not found'));
      const result = await profileService.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getByUserId', () => {
    it('returns profile when found', async () => {
      mockListDocuments.mockResolvedValue({
        documents: [
          { $id: 'p3', kid_name: 'Luna', $createdAt: '', $updatedAt: '' },
        ],
      });

      const result = await profileService.getByUserId('user-123');
      expect(result).not.toBeNull();
      expect(result!.kid_name).toBe('Luna');
    });

    it('returns null when no documents match', async () => {
      mockListDocuments.mockResolvedValue({ documents: [] });
      const result = await profileService.getByUserId('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('returns true on successful deletion', async () => {
      mockDeleteDocument.mockResolvedValue(undefined);
      const result = await profileService.delete('p1');
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      mockDeleteDocument.mockRejectedValue(new Error('Delete failed'));
      const result = await profileService.delete('p1');
      expect(result).toBe(false);
    });
  });
});

describe('languageService', () => {
  describe('add', () => {
    it('adds a language and returns mapped document', async () => {
      mockCreateDocument.mockResolvedValue({
        $id: 'l1',
        $createdAt: '2025-01-01',
        $updatedAt: '2025-01-01',
        profile_id: 'p1',
        language_code: 'hi',
        language_name: 'Hindi',
      });

      const result = await languageService.add('p1', 'hi', 'Hindi');
      expect(result).not.toBeNull();
      expect(result!.language_code).toBe('hi');
    });
  });
});

describe('storyService', () => {
  describe('getByProfileId', () => {
    it('returns mapped stories', async () => {
      mockListDocuments.mockResolvedValue({
        documents: [
          {
            $id: 's1',
            $createdAt: '',
            $updatedAt: '',
            title: 'The Lost Dragon',
            profile_id: 'p1',
          },
          {
            $id: 's2',
            $createdAt: '',
            $updatedAt: '',
            title: 'Space Adventure',
            profile_id: 'p1',
          },
        ],
      });

      const result = await storyService.getByProfileId('p1');
      expect(result).toHaveLength(2);
      expect(result![0].title).toBe('The Lost Dragon');
      expect(result![1].id).toBe('s2');
    });

    it('returns null on error', async () => {
      mockListDocuments.mockRejectedValue(new Error('DB down'));
      const result = await storyService.getByProfileId('p1');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('returns true on success', async () => {
      mockDeleteDocument.mockResolvedValue(undefined);
      expect(await storyService.delete('s1')).toBe(true);
    });

    it('returns false on error', async () => {
      mockDeleteDocument.mockRejectedValue(new Error('fail'));
      expect(await storyService.delete('s1')).toBe(false);
    });
  });
});

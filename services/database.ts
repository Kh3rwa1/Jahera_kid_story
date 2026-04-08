import { COLLECTIONS,DATABASE_ID,databases,ID,Query } from '@/lib/appwrite';
import {
FamilyMember,
Friend,
Profile,
ProfileWithRelations,
QuizAnswer,
QuizAttempt,
QuizQuestion,
QuizQuestionWithAnswers,
Story,
UserLanguage,
} from '@/types/database';
import { logger } from '@/utils/logger';

function mapDoc<T>(doc: Record<string, unknown>): T {
  if (!doc) return null as unknown as T;
  const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...rest } = doc;
  return {
    ...rest,
    id: $id,
    created_at: $createdAt,
    updated_at: $updatedAt,
  } as unknown as T;
}

export const profileService = {
  async create(userId: string, kidName: string, primaryLanguage: string, extra?: Partial<Pick<Profile, 'city' | 'region' | 'country' | 'consent_given_at'>>): Promise<Profile | null> {
    try {
      const data = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        ID.unique(),
        { user_id: userId, kid_name: kidName, primary_language: primaryLanguage, ...extra }
      );
      return mapDoc(data);
    } catch (error) {
      logger.error('Error creating profile:', error);
      return null;
    }
  },

  async getById(id: string): Promise<Profile | null> {
    try {
      const data = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, id);
      return mapDoc(data);
    } catch (error) {
      logger.error('Error fetching profile:', error);
      return null;
    }
  },

  async getByUserId(userId: string): Promise<Profile | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
        Query.equal('user_id', userId),
        Query.limit(1)
      ]);
      return response.documents.length ? mapDoc(response.documents[0]) : null;
    } catch (error) {
      logger.error('Error fetching profile by userId:', error);
      return null;
    }
  },

  async getWithRelations(id: string): Promise<ProfileWithRelations | null> {
    const [profile, languages, familyMembers, friends] = await Promise.all([
      this.getById(id),
      languageService.getByProfileId(id),
      familyMemberService.getByProfileId(id),
      friendService.getByProfileId(id),
    ]);

    if (!profile) return null;

    return {
      ...profile,
      languages: languages || [],
      family_members: familyMembers || [],
      friends: friends || [],
      interests: [],
    };
  },

  async getWithRelationsByUserId(userId: string): Promise<ProfileWithRelations | null> {
    const profile = await this.getByUserId(userId);
    if (!profile) return null;
    return this.getWithRelations(profile.id);
  },

  async update(id: string, updates: Partial<Pick<Profile, 'kid_name' | 'primary_language' | 'avatar_url' | 'parent_pin' | 'age' | 'elevenlabs_voice_id' | 'elevenlabs_model_id' | 'elevenlabs_stability' | 'elevenlabs_similarity' | 'elevenlabs_style' | 'elevenlabs_speaker_boost' | 'city' | 'region' | 'country' | 'consent_given_at'>>): Promise<Profile | null> {
    try {
      const data = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        id,
        { ...updates, updated_at: new Date().toISOString() }
      );
      return mapDoc(data);
    } catch (error) {
      logger.error('Error updating profile:', error);
      return null;
    }
  },

  async updateAvatarUrl(id: string, avatarUrl: string | null): Promise<Profile | null> {
    return this.update(id, { avatar_url: avatarUrl });
  },

  async delete(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PROFILES, id);
      return true;
    } catch (error) {
      logger.error('Error deleting profile:', error);
      return false;
    }
  },

  async uploadAvatar(_profileId: string, _fileUri: string, _mimeType: string): Promise<string | null> {
    logger.warn('Avatar upload via storage should be used instead of Profile Service');
    return null;
  },
};

export const languageService = {
  async add(profileId: string, languageCode: string, languageName: string): Promise<UserLanguage | null> {
    try {
      const data = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_LANGUAGES,
        ID.unique(),
        { profile_id: profileId, language_code: languageCode, language_name: languageName }
      );
      return mapDoc(data);
    } catch (error) {
      logger.error('Error adding language:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<UserLanguage[] | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_LANGUAGES, [
        Query.equal('profile_id', profileId)
      ]);
      return response.documents.map(doc => mapDoc<UserLanguage>(doc));
    } catch (error) {
      logger.error('Error fetching languages:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USER_LANGUAGES, id);
      return true;
    } catch (error) {
      logger.error('Error deleting language:', error);
      return false;
    }
  },

  async deleteByProfileAndCode(profileId: string, languageCode: string): Promise<boolean> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_LANGUAGES, [
        Query.equal('profile_id', profileId),
        Query.equal('language_code', languageCode)
      ]);
      
      await Promise.all(
        response.documents.map((doc) =>
          databases.deleteDocument(DATABASE_ID, COLLECTIONS.USER_LANGUAGES, doc.$id)
        )
      );
      return true;
    } catch (error) {
      logger.error('Error deleting language by code:', error);
      return false;
    }
  },
};

export const familyMemberService = {
  async add(profileId: string, name: string): Promise<FamilyMember | null> {
    try {
      const data = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FAMILY_MEMBERS,
        ID.unique(),
        { profile_id: profileId, name }
      );
      return mapDoc(data);
    } catch (error) {
      logger.error('Error adding family member:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<FamilyMember[] | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.FAMILY_MEMBERS, [
        Query.equal('profile_id', profileId)
      ]);
      return response.documents.map(doc => mapDoc<FamilyMember>(doc));
    } catch (error) {
      logger.error('Error fetching family members:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.FAMILY_MEMBERS, id);
      return true;
    } catch (error) {
      logger.error('Error deleting family member:', error);
      return false;
    }
  },
};

export const friendService = {
  async add(profileId: string, name: string): Promise<Friend | null> {
    try {
      const data = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FRIENDS,
        ID.unique(),
        { profile_id: profileId, name }
      );
      return mapDoc(data);
    } catch (error) {
      logger.error('Error adding friend:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<Friend[] | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.FRIENDS, [
        Query.equal('profile_id', profileId)
      ]);
      return response.documents.map(doc => mapDoc<Friend>(doc));
    } catch (error) {
      logger.error('Error fetching friends:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.FRIENDS, id);
      return true;
    } catch (error) {
      logger.error('Error deleting friend:', error);
      return false;
    }
  },
};

export const storyService = {
  async create(story: Omit<Story, 'id' | 'created_at'>): Promise<Story> {
    try {
      const data = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.STORIES,
        ID.unique(),
        {
          profile_id: story.profile_id,
          language_code: story.language_code,
          title: story.title,
          content: story.content,
          audio_url: story.audio_url,
          season: story.season,
          theme: story.theme,
          mood: story.mood,
          word_count: story.word_count,
          share_token: story.share_token,
          like_count: story.like_count || 0,
          time_of_day: story.time_of_day,
          generated_at: story.generated_at,
        }
      );
      return mapDoc(data);
    } catch (error: any) {
      logger.error('Error creating story:', {
        message: error.message,
        code: error.code,
        response: error.response,
      });
      throw error;
    }
  },

  async getById(id: string): Promise<Story | null> {
    try {
      const data = await databases.getDocument(DATABASE_ID, COLLECTIONS.STORIES, id);
      return mapDoc(data);
    } catch (error) {
      logger.error('Error fetching story:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<Story[] | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.STORIES, [
        Query.equal('profile_id', profileId),
        Query.orderDesc('generated_at')
      ]);
      return response.documents.map(doc => mapDoc<Story>(doc));
    } catch (error) {
      logger.error('Error fetching stories:', error);
      return null;
    }
  },

  async getByProfileAndLanguage(profileId: string, languageCode: string): Promise<Story[] | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.STORIES, [
        Query.equal('profile_id', profileId),
        Query.equal('language_code', languageCode),
        Query.orderDesc('generated_at')
      ]);
      return response.documents.map(doc => mapDoc<Story>(doc));
    } catch (error) {
      logger.error('Error fetching stories by language:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Pick<Story, 'audio_url' | 'title' | 'content'>>): Promise<Story | null> {
    try {
      const data = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.STORIES,
        id,
        updates
      );
      return mapDoc(data);
    } catch (error) {
      logger.error('Error updating story:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.STORIES, id);
      return true;
    } catch (error) {
      logger.error('Error deleting story:', error);
      return false;
    }
  },
};

export const quizService = {
  async createQuestion(storyId: string, questionText: string, questionOrder: number): Promise<QuizQuestion | null> {
    try {
      const data = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.QUIZ_QUESTIONS,
        ID.unique(),
        { story_id: storyId, question_text: questionText, question_order: questionOrder }
      );
      return mapDoc(data);
    } catch (error) {
      logger.error('Error creating quiz question:', error);
      return null;
    }
  },

  async createAnswer(questionId: string, answerText: string, isCorrect: boolean, answerOrder: string): Promise<QuizAnswer | null> {
    try {
      const data = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.QUIZ_ANSWERS,
        ID.unique(),
        { question_id: questionId, answer_text: answerText, is_correct: isCorrect, answer_order: answerOrder }
      );
      return mapDoc(data);
    } catch (error) {
      logger.error('Error creating quiz answer:', error);
      return null;
    }
  },

  async getQuestionsByStoryId(storyId: string): Promise<QuizQuestionWithAnswers[] | null> {
    try {
      const qResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.QUIZ_QUESTIONS, [
        Query.equal('story_id', storyId),
        Query.orderAsc('question_order')
      ]);

      if (qResponse.documents.length === 0) return [];

      // Batch-fetch ALL answers for ALL questions in ONE query (eliminates N+1)
      const questionIds = qResponse.documents.map((q) => q.$id);
      const aResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.QUIZ_ANSWERS, [
        Query.equal('question_id', questionIds),
        Query.orderAsc('answer_order'),
        Query.limit(500),
      ]);

      // Group answers by question_id
      const answersByQuestion = new Map<string, QuizAnswer[]>();
      for (const aDoc of aResponse.documents) {
        const qId = aDoc.question_id as string;
        const mapped = mapDoc<QuizAnswer>(aDoc as Record<string, unknown>);
        const existing = answersByQuestion.get(qId);
        if (existing) {
          existing.push(mapped);
        } else {
          answersByQuestion.set(qId, [mapped]);
        }
      }

      return qResponse.documents.map((qDoc) => ({
        ...mapDoc<QuizQuestion>(qDoc as Record<string, unknown>),
        answers: answersByQuestion.get(qDoc.$id) ?? [],
      }));
    } catch (error) {
      logger.error('Error fetching quiz questions with answers:', error);
      return null;
    }
  },

  async createAttempt(profileId: string, storyId: string, score: number, totalQuestions: number): Promise<QuizAttempt | null> {
    try {
      const data = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.QUIZ_ATTEMPTS,
        ID.unique(),
        {
          profile_id: profileId,
          story_id: storyId,
          score,
          total_questions: totalQuestions,
          completed_at: new Date().toISOString(),
        }
      );
      return mapDoc(data);
    } catch (error) {
      logger.error('Error creating quiz attempt:', error);
      return null;
    }
  },

  async getAttemptsByProfileId(profileId: string): Promise<QuizAttempt[] | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.QUIZ_ATTEMPTS, [
        Query.equal('profile_id', profileId),
        Query.orderDesc('completed_at')
      ]);
      return response.documents.map(doc => mapDoc<QuizAttempt>(doc));
    } catch (error) {
      logger.error('Error fetching quiz attempts:', error);
      return null;
    }
  },
};

export const configService = {
  async getByKey(key: string): Promise<string | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CONFIG, [
        Query.equal('key', key),
        Query.limit(1)
      ]);
      return response.documents.length ? response.documents[0].value : null;
    } catch (error) {
      logger.error(`Error fetching config for key ${key}:`, error);
      return null;
    }
  }
};

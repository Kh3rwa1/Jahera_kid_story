import { databases, storage, ID, Query, DATABASE_ID, COLLECTIONS, STORAGE_BUCKETS } from '@/lib/appwrite';
import {
  Profile,
  UserLanguage,
  FamilyMember,
  Friend,
  Story,
  ProfileWithRelations,
  QuizQuestion,
  QuizAnswer,
  QuizAttempt,
  QuizQuestionWithAnswers,
} from '@/types/database';

function docToProfile(doc: any): Profile {
  return {
    $id: doc.$id,
    userId: doc.userId,
    kid_name: doc.kid_name,
    primary_language: doc.primary_language,
    age: doc.age ?? null,
    parent_pin: doc.parent_pin ?? null,
    share_token: doc.share_token ?? null,
    avatar_url: doc.avatar_url ?? null,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
  };
}

function docToUserLanguage(doc: any): UserLanguage {
  return {
    $id: doc.$id,
    profile_id: doc.profile_id,
    language_code: doc.language_code,
    language_name: doc.language_name,
    $createdAt: doc.$createdAt,
  };
}

function docToFamilyMember(doc: any): FamilyMember {
  return {
    $id: doc.$id,
    profile_id: doc.profile_id,
    name: doc.name,
    $createdAt: doc.$createdAt,
  };
}

function docToFriend(doc: any): Friend {
  return {
    $id: doc.$id,
    profile_id: doc.profile_id,
    name: doc.name,
    $createdAt: doc.$createdAt,
  };
}

function docToStory(doc: any): Story {
  return {
    $id: doc.$id,
    profile_id: doc.profile_id,
    language_code: doc.language_code,
    title: doc.title,
    content: doc.content,
    audio_url: doc.audio_url ?? null,
    season: doc.season,
    theme: doc.theme ?? null,
    mood: doc.mood ?? null,
    word_count: doc.word_count ?? null,
    share_token: doc.share_token ?? null,
    like_count: doc.like_count ?? 0,
    time_of_day: doc.time_of_day,
    generated_at: doc.generated_at,
    $createdAt: doc.$createdAt,
    location_city: doc.location_city ?? null,
    location_country: doc.location_country ?? null,
  };
}

function docToQuizQuestion(doc: any): QuizQuestion {
  return {
    $id: doc.$id,
    story_id: doc.story_id,
    question_text: doc.question_text,
    question_order: doc.question_order,
    $createdAt: doc.$createdAt,
  };
}

function docToQuizAnswer(doc: any): QuizAnswer {
  return {
    $id: doc.$id,
    question_id: doc.question_id,
    answer_text: doc.answer_text,
    is_correct: doc.is_correct,
    answer_order: doc.answer_order,
    $createdAt: doc.$createdAt,
  };
}

function docToQuizAttempt(doc: any): QuizAttempt {
  return {
    $id: doc.$id,
    profile_id: doc.profile_id,
    story_id: doc.story_id,
    score: doc.score,
    total_questions: doc.total_questions,
    completed_at: doc.completed_at,
    $createdAt: doc.$createdAt,
  };
}

export const profileService = {
  async create(userId: string, kidName: string, primaryLanguage: string): Promise<Profile | null> {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        ID.unique(),
        { userId, kid_name: kidName, primary_language: primaryLanguage }
      );
      return docToProfile(doc);
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  },

  async getById(id: string): Promise<Profile | null> {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, id);
      return docToProfile(doc);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  async getByUserId(userId: string): Promise<Profile | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.equal('userId', userId), Query.limit(1)]
      );
      if (response.documents.length === 0) return null;
      return docToProfile(response.documents[0]);
    } catch (error) {
      console.error('Error fetching profile by userId:', error);
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
    return this.getWithRelations(profile.$id);
  },

  async updateAvatarUrl(id: string, avatarUrl: string | null): Promise<Profile | null> {
    try {
      const doc = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        id,
        { avatar_url: avatarUrl }
      );
      return docToProfile(doc);
    } catch (error) {
      console.error('Error updating avatar:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Pick<Profile, 'kid_name' | 'primary_language' | 'avatar_url' | 'parent_pin' | 'age'>>): Promise<Profile | null> {
    try {
      const data: any = {};
      if (updates.kid_name !== undefined) data.kid_name = updates.kid_name;
      if (updates.primary_language !== undefined) data.primary_language = updates.primary_language;
      if (updates.avatar_url !== undefined) data.avatar_url = updates.avatar_url;
      if (updates.parent_pin !== undefined) data.parent_pin = updates.parent_pin;
      if (updates.age !== undefined) data.age = updates.age;

      const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, id, data);
      return docToProfile(doc);
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PROFILES, id);
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  },

  async uploadAvatar(profileId: string, fileUri: string, mimeType: string): Promise<string | null> {
    try {
      const fileName = `${profileId}_avatar.${mimeType.split('/')[1] || 'jpg'}`;
      const file = {
        uri: fileUri,
        name: fileName,
        type: mimeType,
        size: 0,
      };
      const uploaded = await storage.createFile(
        STORAGE_BUCKETS.AVATARS,
        ID.unique(),
        file as any
      );
      const preview = storage.getFilePreview(STORAGE_BUCKETS.AVATARS, uploaded.$id);
      return preview.toString();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  },
};

export const languageService = {
  async add(profileId: string, languageCode: string, languageName: string): Promise<UserLanguage | null> {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_LANGUAGES,
        ID.unique(),
        { profile_id: profileId, language_code: languageCode, language_name: languageName }
      );
      return docToUserLanguage(doc);
    } catch (error) {
      console.error('Error adding language:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<UserLanguage[] | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_LANGUAGES,
        [Query.equal('profile_id', profileId)]
      );
      return response.documents.map(docToUserLanguage);
    } catch (error) {
      console.error('Error fetching languages:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USER_LANGUAGES, id);
      return true;
    } catch (error) {
      console.error('Error deleting language:', error);
      return false;
    }
  },

  async deleteByProfileAndCode(profileId: string, languageCode: string): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_LANGUAGES,
        [Query.equal('profile_id', profileId), Query.equal('language_code', languageCode)]
      );
      await Promise.all(
        response.documents.map(doc =>
          databases.deleteDocument(DATABASE_ID, COLLECTIONS.USER_LANGUAGES, doc.$id)
        )
      );
      return true;
    } catch (error) {
      console.error('Error deleting language by code:', error);
      return false;
    }
  },
};

export const familyMemberService = {
  async add(profileId: string, name: string): Promise<FamilyMember | null> {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FAMILY_MEMBERS,
        ID.unique(),
        { profile_id: profileId, name }
      );
      return docToFamilyMember(doc);
    } catch (error) {
      console.error('Error adding family member:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<FamilyMember[] | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FAMILY_MEMBERS,
        [Query.equal('profile_id', profileId)]
      );
      return response.documents.map(docToFamilyMember);
    } catch (error) {
      console.error('Error fetching family members:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.FAMILY_MEMBERS, id);
      return true;
    } catch (error) {
      console.error('Error deleting family member:', error);
      return false;
    }
  },
};

export const friendService = {
  async add(profileId: string, name: string): Promise<Friend | null> {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.FRIENDS,
        ID.unique(),
        { profile_id: profileId, name }
      );
      return docToFriend(doc);
    } catch (error) {
      console.error('Error adding friend:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<Friend[] | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FRIENDS,
        [Query.equal('profile_id', profileId)]
      );
      return response.documents.map(docToFriend);
    } catch (error) {
      console.error('Error fetching friends:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.FRIENDS, id);
      return true;
    } catch (error) {
      console.error('Error deleting friend:', error);
      return false;
    }
  },
};

export const storyService = {
  async create(story: Omit<Story, '$id' | '$createdAt'>): Promise<Story | null> {
    try {
      const doc = await databases.createDocument(
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
          like_count: story.like_count,
          time_of_day: story.time_of_day,
          generated_at: story.generated_at,
          location_city: story.location_city ?? null,
          location_country: story.location_country ?? null,
        }
      );
      return docToStory(doc);
    } catch (error) {
      console.error('Error creating story:', error);
      return null;
    }
  },

  async getById(id: string): Promise<Story | null> {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.STORIES, id);
      return docToStory(doc);
    } catch (error) {
      console.error('Error fetching story:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<Story[] | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STORIES,
        [Query.equal('profile_id', profileId), Query.orderDesc('generated_at')]
      );
      return response.documents.map(docToStory);
    } catch (error) {
      console.error('Error fetching stories:', error);
      return null;
    }
  },

  async getByProfileAndLanguage(profileId: string, languageCode: string): Promise<Story[] | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STORIES,
        [
          Query.equal('profile_id', profileId),
          Query.equal('language_code', languageCode),
          Query.orderDesc('generated_at'),
        ]
      );
      return response.documents.map(docToStory);
    } catch (error) {
      console.error('Error fetching stories by language:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Pick<Story, 'audio_url' | 'title' | 'content'>>): Promise<Story | null> {
    try {
      const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.STORIES, id, updates);
      return docToStory(doc);
    } catch (error) {
      console.error('Error updating story:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.STORIES, id);
      return true;
    } catch (error) {
      console.error('Error deleting story:', error);
      return false;
    }
  },
};

export const quizService = {
  async createQuestion(storyId: string, questionText: string, questionOrder: number): Promise<QuizQuestion | null> {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.QUIZ_QUESTIONS,
        ID.unique(),
        { story_id: storyId, question_text: questionText, question_order: questionOrder }
      );
      return docToQuizQuestion(doc);
    } catch (error) {
      console.error('Error creating quiz question:', error);
      return null;
    }
  },

  async createAnswer(questionId: string, answerText: string, isCorrect: boolean, answerOrder: string): Promise<QuizAnswer | null> {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.QUIZ_ANSWERS,
        ID.unique(),
        { question_id: questionId, answer_text: answerText, is_correct: isCorrect, answer_order: answerOrder }
      );
      return docToQuizAnswer(doc);
    } catch (error) {
      console.error('Error creating quiz answer:', error);
      return null;
    }
  },

  async getQuestionsByStoryId(storyId: string): Promise<QuizQuestionWithAnswers[] | null> {
    try {
      const questionsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUIZ_QUESTIONS,
        [Query.equal('story_id', storyId), Query.orderAsc('question_order')]
      );

      const questionsWithAnswers = await Promise.all(
        questionsResponse.documents.map(async (q) => {
          const answersResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.QUIZ_ANSWERS,
            [Query.equal('question_id', q.$id), Query.orderAsc('answer_order')]
          );
          return {
            ...docToQuizQuestion(q),
            answers: answersResponse.documents.map(docToQuizAnswer),
          } as QuizQuestionWithAnswers;
        })
      );

      return questionsWithAnswers;
    } catch (error) {
      console.error('Error fetching quiz questions with answers:', error);
      return null;
    }
  },

  async createAttempt(profileId: string, storyId: string, score: number, totalQuestions: number): Promise<QuizAttempt | null> {
    try {
      const doc = await databases.createDocument(
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
      return docToQuizAttempt(doc);
    } catch (error) {
      console.error('Error creating quiz attempt:', error);
      return null;
    }
  },

  async getAttemptsByProfileId(profileId: string): Promise<QuizAttempt[] | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.QUIZ_ATTEMPTS,
        [Query.equal('profile_id', profileId), Query.orderDesc('completed_at')]
      );
      return response.documents.map(docToQuizAttempt);
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      return null;
    }
  },
};

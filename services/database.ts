import { supabase } from '@/lib/supabase';
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
  ProfileInterest,
} from '@/types/database';

function rowToProfile(row: any): Profile {
  return {
    $id: row.id,
    userId: row.user_id,
    kid_name: row.kid_name,
    primary_language: row.primary_language,
    age: row.age ?? null,
    parent_pin: row.parent_pin ?? null,
    share_token: row.share_token ?? null,
    avatar_url: row.avatar_url ?? null,
    $createdAt: row.created_at,
    $updatedAt: row.updated_at,
  };
}

function rowToUserLanguage(row: any): UserLanguage {
  return {
    $id: row.id,
    profile_id: row.profile_id,
    language_code: row.language_code,
    language_name: row.language_name,
    $createdAt: row.created_at,
  };
}

function rowToFamilyMember(row: any): FamilyMember {
  return {
    $id: row.id,
    profile_id: row.profile_id,
    name: row.name,
    $createdAt: row.created_at,
  };
}

function rowToFriend(row: any): Friend {
  return {
    $id: row.id,
    profile_id: row.profile_id,
    name: row.name,
    $createdAt: row.created_at,
  };
}

function rowToStory(row: any): Story {
  return {
    $id: row.id,
    profile_id: row.profile_id,
    language_code: row.language_code,
    title: row.title,
    content: row.content,
    audio_url: row.audio_url ?? null,
    season: row.season,
    theme: row.theme ?? null,
    mood: row.mood ?? null,
    word_count: row.word_count ?? null,
    share_token: row.share_token ?? null,
    like_count: row.like_count ?? 0,
    time_of_day: row.time_of_day,
    generated_at: row.generated_at,
    $createdAt: row.created_at,
    location_city: row.location_city ?? null,
    location_country: row.location_country ?? null,
  };
}

function rowToQuizQuestion(row: any): QuizQuestion {
  return {
    $id: row.id,
    story_id: row.story_id,
    question_text: row.question_text,
    question_order: row.question_order,
    $createdAt: row.created_at,
  };
}

function rowToQuizAnswer(row: any): QuizAnswer {
  return {
    $id: row.id,
    question_id: row.question_id,
    answer_text: row.answer_text,
    is_correct: row.is_correct,
    answer_order: row.answer_order,
    $createdAt: row.created_at,
  };
}

function rowToQuizAttempt(row: any): QuizAttempt {
  return {
    $id: row.id,
    profile_id: row.profile_id,
    story_id: row.story_id,
    score: row.score,
    total_questions: row.total_questions,
    completed_at: row.completed_at,
    $createdAt: row.created_at,
  };
}

export const profileService = {
  async create(userId: string, kidName: string, primaryLanguage: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({ user_id: userId, kid_name: kidName, primary_language: primaryLanguage })
        .select()
        .single();
      if (error) throw error;
      return rowToProfile(data);
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  },

  async getById(id: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return rowToProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  async getByUserId(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return rowToProfile(data);
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
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return rowToProfile(data);
    } catch (error) {
      console.error('Error updating avatar:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Pick<Profile, 'kid_name' | 'primary_language' | 'avatar_url' | 'parent_pin' | 'age'>>): Promise<Profile | null> {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.kid_name !== undefined) dbUpdates.kid_name = updates.kid_name;
      if (updates.primary_language !== undefined) dbUpdates.primary_language = updates.primary_language;
      if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
      if (updates.parent_pin !== undefined) dbUpdates.parent_pin = updates.parent_pin;
      if (updates.age !== undefined) dbUpdates.age = updates.age;

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return rowToProfile(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  },

  async uploadAvatar(_profileId: string, _fileUri: string, _mimeType: string): Promise<string | null> {
    return null;
  },
};

export const languageService = {
  async add(profileId: string, languageCode: string, languageName: string): Promise<UserLanguage | null> {
    try {
      const { data, error } = await supabase
        .from('user_languages')
        .insert({ profile_id: profileId, language_code: languageCode, language_name: languageName })
        .select()
        .single();
      if (error) throw error;
      return rowToUserLanguage(data);
    } catch (error) {
      console.error('Error adding language:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<UserLanguage[] | null> {
    try {
      const { data, error } = await supabase
        .from('user_languages')
        .select('*')
        .eq('profile_id', profileId);
      if (error) throw error;
      return (data || []).map(rowToUserLanguage);
    } catch (error) {
      console.error('Error fetching languages:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_languages').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting language:', error);
      return false;
    }
  },

  async deleteByProfileAndCode(profileId: string, languageCode: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_languages')
        .delete()
        .eq('profile_id', profileId)
        .eq('language_code', languageCode);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('family_members')
        .insert({ profile_id: profileId, name })
        .select()
        .single();
      if (error) throw error;
      return rowToFamilyMember(data);
    } catch (error) {
      console.error('Error adding family member:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<FamilyMember[] | null> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('profile_id', profileId);
      if (error) throw error;
      return (data || []).map(rowToFamilyMember);
    } catch (error) {
      console.error('Error fetching family members:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('family_members').delete().eq('id', id);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('friends')
        .insert({ profile_id: profileId, name })
        .select()
        .single();
      if (error) throw error;
      return rowToFriend(data);
    } catch (error) {
      console.error('Error adding friend:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<Friend[] | null> {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('profile_id', profileId);
      if (error) throw error;
      return (data || []).map(rowToFriend);
    } catch (error) {
      console.error('Error fetching friends:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('friends').delete().eq('id', id);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('stories')
        .insert({
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
        })
        .select()
        .single();
      if (error) throw error;
      return rowToStory(data);
    } catch (error) {
      console.error('Error creating story:', error);
      return null;
    }
  },

  async getById(id: string): Promise<Story | null> {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return rowToStory(data);
    } catch (error) {
      console.error('Error fetching story:', error);
      return null;
    }
  },

  async getByProfileId(profileId: string): Promise<Story[] | null> {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('profile_id', profileId)
        .order('generated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToStory);
    } catch (error) {
      console.error('Error fetching stories:', error);
      return null;
    }
  },

  async getByProfileAndLanguage(profileId: string, languageCode: string): Promise<Story[] | null> {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('profile_id', profileId)
        .eq('language_code', languageCode)
        .order('generated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToStory);
    } catch (error) {
      console.error('Error fetching stories by language:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Pick<Story, 'audio_url' | 'title' | 'content'>>): Promise<Story | null> {
    try {
      const { data, error } = await supabase
        .from('stories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return rowToStory(data);
    } catch (error) {
      console.error('Error updating story:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('stories').delete().eq('id', id);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert({ story_id: storyId, question_text: questionText, question_order: questionOrder })
        .select()
        .single();
      if (error) throw error;
      return rowToQuizQuestion(data);
    } catch (error) {
      console.error('Error creating quiz question:', error);
      return null;
    }
  },

  async createAnswer(questionId: string, answerText: string, isCorrect: boolean, answerOrder: string): Promise<QuizAnswer | null> {
    try {
      const { data, error } = await supabase
        .from('quiz_answers')
        .insert({ question_id: questionId, answer_text: answerText, is_correct: isCorrect, answer_order: answerOrder })
        .select()
        .single();
      if (error) throw error;
      return rowToQuizAnswer(data);
    } catch (error) {
      console.error('Error creating quiz answer:', error);
      return null;
    }
  },

  async getQuestionsByStoryId(storyId: string): Promise<QuizQuestionWithAnswers[] | null> {
    try {
      const { data: questions, error: qErr } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('story_id', storyId)
        .order('question_order', { ascending: true });
      if (qErr) throw qErr;

      const questionsWithAnswers = await Promise.all(
        (questions || []).map(async (q) => {
          const { data: answers } = await supabase
            .from('quiz_answers')
            .select('*')
            .eq('question_id', q.id)
            .order('answer_order', { ascending: true });
          return {
            ...rowToQuizQuestion(q),
            answers: (answers || []).map(rowToQuizAnswer),
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
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          profile_id: profileId,
          story_id: storyId,
          score,
          total_questions: totalQuestions,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return rowToQuizAttempt(data);
    } catch (error) {
      console.error('Error creating quiz attempt:', error);
      return null;
    }
  },

  async getAttemptsByProfileId(profileId: string): Promise<QuizAttempt[] | null> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('profile_id', profileId)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToQuizAttempt);
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      return null;
    }
  },
};

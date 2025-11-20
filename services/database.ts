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
} from '@/types/database';

export const profileService = {
  async create(kidName: string, primaryLanguage: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ kid_name: kidName, primary_language: primaryLanguage })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    return data;
  },

  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
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
    };
  },

  async update(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (error) {
      console.error('Error deleting profile:', error);
      return false;
    }

    return true;
  },

  async getFirst(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching first profile:', error);
      return null;
    }

    return data;
  },
};

export const languageService = {
  async add(
    profileId: string,
    languageCode: string,
    languageName: string
  ): Promise<UserLanguage | null> {
    const { data, error } = await supabase
      .from('user_languages')
      .insert({ profile_id: profileId, language_code: languageCode, language_name: languageName })
      .select()
      .single();

    if (error) {
      console.error('Error adding language:', error);
      return null;
    }

    return data;
  },

  async getByProfileId(profileId: string): Promise<UserLanguage[] | null> {
    const { data, error } = await supabase
      .from('user_languages')
      .select()
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error fetching languages:', error);
      return null;
    }

    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('user_languages').delete().eq('id', id);

    if (error) {
      console.error('Error deleting language:', error);
      return false;
    }

    return true;
  },

  async deleteByProfileAndCode(profileId: string, languageCode: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_languages')
      .delete()
      .eq('profile_id', profileId)
      .eq('language_code', languageCode);

    if (error) {
      console.error('Error deleting language:', error);
      return false;
    }

    return true;
  },
};

export const familyMemberService = {
  async add(profileId: string, name: string): Promise<FamilyMember | null> {
    const { data, error } = await supabase
      .from('family_members')
      .insert({ profile_id: profileId, name })
      .select()
      .single();

    if (error) {
      console.error('Error adding family member:', error);
      return null;
    }

    return data;
  },

  async getByProfileId(profileId: string): Promise<FamilyMember[] | null> {
    const { data, error } = await supabase
      .from('family_members')
      .select()
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error fetching family members:', error);
      return null;
    }

    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('family_members').delete().eq('id', id);

    if (error) {
      console.error('Error deleting family member:', error);
      return false;
    }

    return true;
  },
};

export const friendService = {
  async add(profileId: string, name: string): Promise<Friend | null> {
    const { data, error } = await supabase
      .from('friends')
      .insert({ profile_id: profileId, name })
      .select()
      .single();

    if (error) {
      console.error('Error adding friend:', error);
      return null;
    }

    return data;
  },

  async getByProfileId(profileId: string): Promise<Friend[] | null> {
    const { data, error } = await supabase
      .from('friends')
      .select()
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error fetching friends:', error);
      return null;
    }

    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('friends').delete().eq('id', id);

    if (error) {
      console.error('Error deleting friend:', error);
      return false;
    }

    return true;
  },
};

export const storyService = {
  async create(story: Omit<Story, 'id' | 'created_at'>): Promise<Story | null> {
    const { data, error } = await supabase.from('stories').insert(story).select().single();

    if (error) {
      console.error('Error creating story:', error);
      return null;
    }

    return data;
  },

  async getById(id: string): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching story:', error);
      return null;
    }

    return data;
  },

  async getByProfileId(profileId: string): Promise<Story[] | null> {
    const { data, error } = await supabase
      .from('stories')
      .select()
      .eq('profile_id', profileId)
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('Error fetching stories:', error);
      return null;
    }

    return data;
  },

  async getByProfileAndLanguage(profileId: string, languageCode: string): Promise<Story[] | null> {
    const { data, error } = await supabase
      .from('stories')
      .select()
      .eq('profile_id', profileId)
      .eq('language_code', languageCode)
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('Error fetching stories by language:', error);
      return null;
    }

    return data;
  },

  async update(id: string, updates: Partial<Story>): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating story:', error);
      return null;
    }

    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error} = await supabase.from('stories').delete().eq('id', id);

    if (error) {
      console.error('Error deleting story:', error);
      return false;
    }

    return true;
  },

  async getById(id: string): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching story:', error);
      return null;
    }

    return data;
  },
};

export const quizService = {
  async createQuestion(
    storyId: string,
    questionText: string,
    questionOrder: number
  ): Promise<QuizQuestion | null> {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({ story_id: storyId, question_text: questionText, question_order: questionOrder })
      .select()
      .single();

    if (error) {
      console.error('Error creating quiz question:', error);
      return null;
    }

    return data;
  },

  async createAnswer(
    questionId: string,
    answerText: string,
    isCorrect: boolean,
    answerOrder: string
  ): Promise<QuizAnswer | null> {
    const { data, error } = await supabase
      .from('quiz_answers')
      .insert({
        question_id: questionId,
        answer_text: answerText,
        is_correct: isCorrect,
        answer_order: answerOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quiz answer:', error);
      return null;
    }

    return data;
  },

  async getQuestionsByStoryId(storyId: string): Promise<QuizQuestionWithAnswers[] | null> {
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select()
      .eq('story_id', storyId)
      .order('question_order');

    if (questionsError) {
      console.error('Error fetching quiz questions:', questionsError);
      return null;
    }

    if (!questions || questions.length === 0) {
      return [];
    }

    const questionsWithAnswers = await Promise.all(
      questions.map(async question => {
        const { data: answers, error: answersError } = await supabase
          .from('quiz_answers')
          .select()
          .eq('question_id', question.id)
          .order('answer_order');

        if (answersError) {
          console.error('Error fetching quiz answers:', answersError);
          return { ...question, answers: [] };
        }

        return { ...question, answers: answers || [] };
      })
    );

    return questionsWithAnswers;
  },

  async createAttempt(
    profileId: string,
    storyId: string,
    score: number,
    totalQuestions: number
  ): Promise<QuizAttempt | null> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        profile_id: profileId,
        story_id: storyId,
        score,
        total_questions: totalQuestions,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quiz attempt:', error);
      return null;
    }

    return data;
  },

  async getAttemptsByProfileId(profileId: string): Promise<QuizAttempt[] | null> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select()
      .eq('profile_id', profileId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching quiz attempts:', error);
      return null;
    }

    return data;
  },
};

export interface Profile {
  id: string;
  kid_name: string;
  primary_language: string;
  created_at: string;
  updated_at: string;
}

export interface UserLanguage {
  id: string;
  profile_id: string;
  language_code: string;
  language_name: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  profile_id: string;
  name: string;
  created_at: string;
}

export interface Friend {
  id: string;
  profile_id: string;
  name: string;
  created_at: string;
}

export interface Story {
  id: string;
  profile_id: string;
  language_code: string;
  title: string;
  content: string;
  audio_url: string | null;
  season: string;
  time_of_day: string;
  generated_at: string;
  created_at: string;
}

export interface ProfileWithRelations extends Profile {
  languages: UserLanguage[];
  family_members: FamilyMember[];
  friends: Friend[];
}

export interface QuizQuestion {
  id: string;
  story_id: string;
  question_text: string;
  question_order: number;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  answer_order: string;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  profile_id: string;
  story_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  created_at: string;
}

export interface QuizQuestionWithAnswers extends QuizQuestion {
  answers: QuizAnswer[];
}

export interface StoryWithQuiz extends Story {
  quiz_questions: QuizQuestionWithAnswers[];
}

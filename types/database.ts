export interface Profile {
  id: string;
  user_id: string;
  kid_name: string;
  primary_language: string;
  age: number | null;
  parent_pin: string | null;
  share_token: string | null;
  avatar_url: string | null;
  elevenlabs_voice_id?: string | null;
  elevenlabs_model_id?: string | null;
  elevenlabs_stability?: number | null;
  elevenlabs_similarity?: number | null;
  elevenlabs_style?: number | null;
  elevenlabs_speaker_boost?: boolean | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  consent_given_at?: string | null;
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

export interface ProfileInterest {
  id: string;
  profile_id: string;
  interest: string;
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
  theme: string | null;
  mood: string | null;
  word_count: number | null;
  share_token: string | null;
  like_count: number;
  time_of_day: string;
  generated_at: string;
  created_at: string;
  location_city: string | null;
  location_country: string | null;
  behavior_goal?: string | null;
}

export interface ProfileWithRelations extends Profile {
  languages: UserLanguage[];
  family_members: FamilyMember[];
  interests: ProfileInterest[];
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

export interface Subscription {
  id: string;
  profile_id: string;
  plan: 'free' | 'pro' | 'family';
  stories_used_this_month: number;
  stories_limit: number;
  billing_period_start: string;
  billing_period_end: string;
  is_active: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatus {
  plan: 'free' | 'pro' | 'family';
  stories_used: number;
  stories_limit: number;
  can_generate: boolean;
  stories_remaining: number;
}

export interface Streak {
  id: string;
  profile_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_days_active: number;
  created_at: string;
  updated_at: string;
}

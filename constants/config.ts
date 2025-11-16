export const APP_CONFIG = {
  APP_NAME: 'DreamTales',
  VERSION: '1.0.0',

  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000,
  },

  VALIDATION: {
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 50,
    MIN_MEMBER_NAME_LENGTH: 2,
    MAX_MEMBER_NAME_LENGTH: 30,
  },

  STORY: {
    MIN_CONTENT_LENGTH: 50,
    MAX_TITLE_LENGTH: 100,
  },

  QUIZ: {
    QUESTIONS_PER_QUIZ: 3,
    ANSWERS_PER_QUESTION: 4,
    PASS_THRESHOLD: 66,
  },

  CACHE: {
    PROFILE_TTL: 5 * 60 * 1000,
    STORIES_TTL: 10 * 60 * 1000,
  },

  ANIMATION: {
    SKELETON_DURATION: 800,
    FADE_DURATION: 300,
  },
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  DATABASE_ERROR: 'Something went wrong. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  NO_PROFILE: 'Profile not found. Please create one first.',
  NO_STORIES: 'No stories found.',
  STORY_GENERATION_FAILED: 'Failed to generate story. Please try again.',
  QUIZ_GENERATION_FAILED: 'Failed to generate quiz. Please try again.',
  AUDIO_PLAYBACK_FAILED: 'Failed to play audio. Please try again.',
} as const;

export const SUCCESS_MESSAGES = {
  PROFILE_CREATED: 'Profile created successfully!',
  STORY_GENERATED: 'Story generated successfully!',
  QUIZ_COMPLETED: 'Quiz completed! Great job!',
  MEMBER_ADDED: 'Added successfully!',
  MEMBER_REMOVED: 'Removed successfully!',
  LANGUAGE_ADDED: 'Language added!',
  LANGUAGE_REMOVED: 'Language removed!',
} as const;

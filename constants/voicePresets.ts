export interface VoicePreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  elevenLabsVoiceId: string;
  settings: {
    stability: number;
    similarity: number;
    style: number;
    speakerBoost: boolean;
  };
  gender: 'female' | 'male';
  vibe: 'warm' | 'energetic' | 'calm' | 'playful';
  isPremium: boolean;
  languages: string[];
}

export const VOICE_PRESETS: VoicePreset[] = [
  { id: 'mom_voice', label: 'Mom Voice', emoji: '👩', description: 'Warm and comforting bedtime storyteller.', elevenLabsVoiceId: 'REPLACE_WITH_VOICE_ID', settings: { stability: 0.65, similarity: 0.85, style: 0.2, speakerBoost: true }, gender: 'female', vibe: 'warm', isPremium: false, languages: ['en', 'hi'] },
  { id: 'dad_voice', label: 'Dad Voice', emoji: '👨', description: 'Energetic and adventurous narration style.', elevenLabsVoiceId: 'REPLACE_WITH_VOICE_ID', settings: { stability: 0.55, similarity: 0.8, style: 0.45, speakerBoost: true }, gender: 'male', vibe: 'energetic', isPremium: false, languages: ['en', 'hi'] },
  { id: 'grandma_storyteller', label: 'Grandma Storyteller', emoji: '👵', description: 'Calm, classic, and soothing story vibes.', elevenLabsVoiceId: 'REPLACE_WITH_VOICE_ID', settings: { stability: 0.78, similarity: 0.82, style: 0.15, speakerBoost: true }, gender: 'female', vibe: 'calm', isPremium: true, languages: ['en'] },
  { id: 'fun_narrator', label: 'Fun Narrator', emoji: '🎭', description: 'Playful and animated for lively tales.', elevenLabsVoiceId: 'REPLACE_WITH_VOICE_ID', settings: { stability: 0.5, similarity: 0.75, style: 0.7, speakerBoost: true }, gender: 'male', vibe: 'playful', isPremium: true, languages: ['en'] },
  { id: 'hindi_dadi', label: 'Hindi Dadi', emoji: '🪔', description: 'Warm Hindi bedtime voice for cozy nights.', elevenLabsVoiceId: 'REPLACE_WITH_VOICE_ID', settings: { stability: 0.72, similarity: 0.84, style: 0.25, speakerBoost: true }, gender: 'female', vibe: 'warm', isPremium: true, languages: ['hi'] },
];

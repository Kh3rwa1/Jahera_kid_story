export interface StoryTemplate {
  id: string;
  title_template: string;
  content_template: string;
  behavior_goal: string;
  theme: string;
  mood: string;
  language_code: string;
  placeholder_fields: string[];
  word_count: number;
  created_at: string;
}

export interface HydratedTemplate {
  id: string;
  title: string;
  content: string;
  behavior_goal: string;
  theme: string;
  mood: string;
  word_count: number;
}

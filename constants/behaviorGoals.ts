export type BehaviorCategory = 'emotional' | 'social' | 'discipline' | 'cognitive';

export interface BehaviorGoal {
  id: string;
  label: string;
  emoji: string;
  description: string;
  promptInstruction: string;
  category: BehaviorCategory;
  lottieUrl?: string; // Fallback URL if Appwrite asset is missing
}

export const BEHAVIOR_GOALS: BehaviorGoal[] = [
  { 
    id: 'confidence', 
    label: 'Confidence', 
    emoji: '🌟', 
    description: 'Build self-belief through brave little wins.', 
    promptInstruction: 'The story must show the child taking small, courageous steps that grow into real confidence. Let setbacks happen, then show progress through persistence and support from friends. Do NOT lecture—teach through exciting events and meaningful choices.', 
    category: 'emotional',
    lottieUrl: 'https://assets9.lottiefiles.com/packages/lf20_w51pcehl.json'
  },
  { 
    id: 'sharing', 
    label: 'Sharing', 
    emoji: '🤝', 
    description: 'Help children discover the joy of sharing.', 
    promptInstruction: 'The story must naturally demonstrate why sharing with others brings happiness. Show the main character learning that giving feels better than keeping everything. Do NOT lecture—teach through story events and heartfelt moments.', 
    category: 'social',
    lottieUrl: 'https://assets2.lottiefiles.com/packages/lf20_7wwmupbm.json'
  },
  { 
    id: 'kindness', 
    label: 'Kindness', 
    emoji: '💖', 
    description: 'Encourage gentle words and thoughtful actions.', 
    promptInstruction: 'The adventure should include moments where kind actions change outcomes for the better. Show ripple effects of kindness across characters and the world around them. Do NOT lecture—make kindness part of the hero journey.', 
    category: 'social',
    lottieUrl: 'https://assets4.lottiefiles.com/packages/lf20_69yvunpg.json'
  },
  { 
    id: 'discipline', 
    label: 'Discipline', 
    emoji: '🧭', 
    description: 'Practice routines, focus, and follow-through.', 
    promptInstruction: 'The story should show the child succeeding by staying consistent, focused, and patient with a plan. Include tempting distractions and how steady effort helps the hero complete the mission. Do NOT lecture—teach through challenge-and-reward events.', 
    category: 'discipline',
    lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_vnikbeve.json'
  },
  { 
    id: 'less_screen', 
    label: 'Less Screen Time', 
    emoji: '🌳', 
    description: 'Inspire more real-world play and imagination.', 
    promptInstruction: 'The story should make offline adventures feel magical, playful, and deeply rewarding. Show the hero discovering joy through movement, nature, and human connection instead of screens. Do NOT lecture—let discovery and fun carry the message.', 
    category: 'discipline',
    lottieUrl: 'https://assets1.lottiefiles.com/packages/lf20_9n6mrv.json'
  },
  { 
    id: 'calmness', 
    label: 'Calmness', 
    emoji: '🧘', 
    description: 'Find balance and peace in any situation.', 
    promptInstruction: 'The story should focus on the hero finding their center through deep breathing, stillness, or mindful choices when things get chaotic. Show how staying calm helps the character think clearly and solve problems that panic cannot. Do NOT lecture—teach through peaceful transitions and thoughtful resolutions.', 
    category: 'emotional',
    lottieUrl: 'https://assets3.lottiefiles.com/packages/lf20_m6cu9zqh.json'
  },
  { 
    id: 'courage', 
    label: 'Courage', 
    emoji: '🦁', 
    description: 'Face fears with support and heart.', 
    promptInstruction: 'The narrative should include a fear or uncertainty that the hero gradually faces with bravery. Emphasize that courage means acting even when scared, not being fearless. Do NOT lecture—teach through adventurous choices and turning points.', 
    category: 'emotional',
    lottieUrl: 'https://assets5.lottiefiles.com/packages/lf20_h5gljt5v.json'
  },
  { 
    id: 'honesty', 
    label: 'Honesty', 
    emoji: '🪞', 
    description: 'Show that truth builds trust and repair.', 
    promptInstruction: 'The story should include a moment where telling the truth feels hard but leads to trust, relief, and growth. Let the character experience consequences, then healing through honesty. Do NOT lecture—teach through authentic story consequences.', 
    category: 'discipline',
    lottieUrl: 'https://assets8.lottiefiles.com/packages/lf20_it9pjc7i.json'
  },
  { 
    id: 'empathy', 
    label: 'Empathy', 
    emoji: '🫶', 
    description: 'Understand how others feel and respond kindly.', 
    promptInstruction: 'The story should place the hero in situations where they notice and respond to others’ feelings. Show perspective-taking changing a conflict into connection. Do NOT lecture—teach through emotional interactions and teamwork.', 
    category: 'social',
    lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_9n6mrv.json'
  },
  { 
    id: 'gratitude', 
    label: 'Gratitude', 
    emoji: '🙏', 
    description: 'Notice and appreciate everyday blessings.', 
    promptInstruction: 'The adventure should help the hero recognize small gifts, support, and moments of wonder. Show gratitude strengthening relationships and joy. Do NOT lecture—let appreciation emerge naturally from the journey.', 
    category: 'emotional',
    lottieUrl: 'https://assets9.lottiefiles.com/packages/lf20_kkflmtur.json'
  },
  { 
    id: 'teamwork', 
    label: 'Teamwork', 
    emoji: '🛠️', 
    description: 'Work together to solve big challenges.', 
    promptInstruction: 'The plot should require collaboration where each character contributes unique strengths. Show listening, cooperation, and shared success as the key to solving the central problem. Do NOT lecture—teach through mission-based teamwork.', 
    category: 'social',
    lottieUrl: 'https://assets1.lottiefiles.com/packages/lf20_5njp3vvi.json'
  },
  { 
    id: 'curiosity', 
    label: 'Curiosity', 
    emoji: '🔎', 
    description: 'Ask questions and explore with wonder.', 
    promptInstruction: 'The story should reward questions, exploration, and creative problem-solving. Let curiosity unlock clues, discoveries, or magical outcomes throughout the adventure. Do NOT lecture—teach through mystery, discovery, and play.', 
    category: 'cognitive',
    lottieUrl: 'https://assets6.lottiefiles.com/packages/lf20_kkflmtur.json'
  },
  { 
    id: 'responsibility', 
    label: 'Responsibility', 
    emoji: '🎒', 
    description: 'Take ownership of actions and duties.', 
    promptInstruction: 'The narrative should show the hero owning a task and following through even when it is difficult. Include consequences of forgetting, then growth through accountability and care. Do NOT lecture—teach through plot stakes and resolution.', 
    category: 'discipline',
    lottieUrl: 'https://assets7.lottiefiles.com/packages/lf20_it9pjc7i.json'
  },
];

export const BEHAVIOR_CATEGORIES: Array<{ id: BehaviorCategory; label: string; emoji: string }> = [
  { id: 'emotional', label: 'Emotional Growth', emoji: '💫' },
  { id: 'social', label: 'Social Skills', emoji: '🤗' },
  { id: 'discipline', label: 'Habits & Discipline', emoji: '🧠' },
  { id: 'cognitive', label: 'Thinking Skills', emoji: '🚀' },
];

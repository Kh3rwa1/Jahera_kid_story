export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface StoryContext {
  date: Date;
  season: Season;
  timeOfDay: TimeOfDay;
  dayOfWeek: string;
  monthName: string;
}

export function getSeason(date: Date): Season {
  const month = date.getMonth();

  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

export function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getDayOfWeek(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

export function getMonthName(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[date.getMonth()];
}

export function getCurrentContext(): StoryContext {
  const now = new Date();

  return {
    date: now,
    season: getSeason(now),
    timeOfDay: getTimeOfDay(now),
    dayOfWeek: getDayOfWeek(now),
    monthName: getMonthName(now),
  };
}

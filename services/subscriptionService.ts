import { supabase } from '@/lib/supabase';
import { SubscriptionStatus, Streak } from '@/types/database';

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 9999,
  family: 9999,
};

function rowToStreak(row: any): Streak {
  return {
    id: row.id,
    profile_id: row.profile_id,
    current_streak: row.current_streak || 0,
    longest_streak: row.longest_streak || 0,
    last_activity_date: row.last_activity_date ?? null,
    total_days_active: row.total_days_active || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function upsertSubscription(
  profileId: string,
  plan: string,
  storiesLimit: number,
  trialEndsAt?: string
): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();

    const payload: any = {
      profile_id: profileId,
      plan,
      stories_limit: storiesLimit,
      is_active: true,
      updated_at: new Date().toISOString(),
    };
    if (trialEndsAt) payload.trial_ends_at = trialEndsAt;

    if (existing) {
      const { error } = await supabase.from('subscriptions').update(payload).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('subscriptions').insert(payload);
      if (error) throw error;
    }
    return true;
  } catch (error) {
    console.error('Error upserting subscription:', error);
    return false;
  }
}

export const subscriptionService = {
  async getStatus(profileId: string): Promise<SubscriptionStatus> {
    try {
      const { data: subDoc } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      const plan = subDoc?.plan || 'free';
      const storiesLimit = PLAN_LIMITS[plan] ?? 3;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId)
        .gte('generated_at', startOfMonth.toISOString());

      const storiesUsed = count || 0;
      const storiesRemaining = Math.max(0, storiesLimit - storiesUsed);

      return {
        plan,
        stories_used: storiesUsed,
        stories_limit: storiesLimit,
        can_generate: plan !== 'free' || storiesRemaining > 0,
        stories_remaining: storiesRemaining,
      };
    } catch {
      return {
        plan: 'free',
        stories_used: 0,
        stories_limit: 3,
        can_generate: true,
        stories_remaining: 3,
      };
    }
  },

  async upgradeToPro(profileId: string): Promise<boolean> {
    return upsertSubscription(profileId, 'pro', 9999);
  },

  async upgradeToFamily(profileId: string): Promise<boolean> {
    return upsertSubscription(profileId, 'family', 9999);
  },

  async startTrial(profileId: string): Promise<boolean> {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    return upsertSubscription(profileId, 'pro', 9999, trialEnd.toISOString());
  },
};

export const streakService = {
  async getStreak(profileId: string): Promise<Streak | null> {
    try {
      const { data } = await supabase
        .from('streaks')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();
      if (!data) return null;
      return rowToStreak(data);
    } catch {
      return null;
    }
  },

  async updateStreak(profileId: string): Promise<Streak | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('streaks')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (!existing) {
        const { data, error } = await supabase
          .from('streaks')
          .insert({
            profile_id: profileId,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
            total_days_active: 1,
          })
          .select()
          .single();
        if (error) throw error;
        return rowToStreak(data);
      }

      const lastDate = existing.last_activity_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = existing.current_streak || 0;
      if (lastDate === yesterdayStr) {
        newStreak += 1;
      } else if (lastDate !== today) {
        newStreak = 1;
      }

      const longestStreak = Math.max(existing.longest_streak || 0, newStreak);
      const totalDaysActive = lastDate !== today ? (existing.total_days_active || 0) + 1 : existing.total_days_active;

      const { data, error } = await supabase
        .from('streaks')
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
          total_days_active: totalDaysActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return rowToStreak(data);
    } catch {
      return null;
    }
  },
};

export const interestService = {
  async getInterests(profileId: string): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('profile_interests')
        .select('interest')
        .eq('profile_id', profileId);
      return (data || []).map((row: any) => row.interest);
    } catch {
      return [];
    }
  },

  async setInterests(profileId: string, interests: string[]): Promise<boolean> {
    try {
      await supabase.from('profile_interests').delete().eq('profile_id', profileId);
      if (interests.length > 0) {
        const rows = interests.map(interest => ({ profile_id: profileId, interest }));
        const { error } = await supabase.from('profile_interests').insert(rows);
        if (error) throw error;
      }
      return true;
    } catch {
      return false;
    }
  },
};

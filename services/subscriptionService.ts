import { supabase } from '@/lib/supabase';
import { SubscriptionStatus, Streak } from '@/types/database';

export const subscriptionService = {
  async getStatus(profileId: string): Promise<SubscriptionStatus> {
    const { data, error } = await supabase.rpc('get_subscription_status', {
      p_profile_id: profileId,
    });

    if (error || !data) {
      return {
        plan: 'free',
        stories_used: 0,
        stories_limit: 3,
        can_generate: true,
        stories_remaining: 3,
      };
    }

    return data as SubscriptionStatus;
  },

  async upgradeToPro(profileId: string): Promise<boolean> {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        profile_id: profileId,
        plan: 'pro',
        stories_limit: 9999,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });

    return !error;
  },

  async upgradeToFamily(profileId: string): Promise<boolean> {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        profile_id: profileId,
        plan: 'family',
        stories_limit: 9999,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });

    return !error;
  },

  async startTrial(profileId: string): Promise<boolean> {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        profile_id: profileId,
        plan: 'pro',
        stories_limit: 9999,
        is_active: true,
        trial_ends_at: trialEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });

    return !error;
  },
};

export const streakService = {
  async getStreak(profileId: string): Promise<Streak | null> {
    const { data, error } = await supabase
      .from('streaks')
      .select()
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) return null;
    return data;
  },
};

export const interestService = {
  async getInterests(profileId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('profile_interests')
      .select('interest')
      .eq('profile_id', profileId);

    if (error || !data) return [];
    return data.map(r => r.interest);
  },

  async setInterests(profileId: string, interests: string[]): Promise<boolean> {
    const { error: deleteError } = await supabase
      .from('profile_interests')
      .delete()
      .eq('profile_id', profileId);

    if (deleteError) return false;

    if (interests.length === 0) return true;

    const { error: insertError } = await supabase
      .from('profile_interests')
      .insert(interests.map(interest => ({ profile_id: profileId, interest })));

    return !insertError;
  },
};

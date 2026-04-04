import { databases, COLLECTIONS, DATABASE_ID, ID, Query } from '@/lib/appwrite';
import { SubscriptionStatus, Streak } from '@/types/database';
import { revenueCatService, PlanType } from '@/services/revenueCatService';

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 9999,
  family: 9999,
};

function rowToStreak(row: any): Streak {
  if (!row) return null as any;
  const { $id, $createdAt, $updatedAt, current_streak, longest_streak, last_activity_date, total_days_active, profile_id } = row;
  return {
    id: $id,
    profile_id: profile_id,
    current_streak: current_streak || 0,
    longest_streak: longest_streak || 0,
    last_activity_date: last_activity_date ?? null,
    total_days_active: total_days_active || 0,
    created_at: $createdAt,
    updated_at: $updatedAt,
  };
}

async function upsertSubscription(
  profileId: string,
  plan: string,
  storiesLimit: number,
  trialEndsAt?: string
): Promise<boolean> {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SUBSCRIPTIONS, [
      Query.equal('profile_id', profileId),
      Query.limit(1)
    ]);

    const payload: any = {
      profile_id: profileId,
      plan,
      stories_limit: storiesLimit,
      is_active: true,
    };
    if (trialEndsAt) payload.trial_ends_at = trialEndsAt;

    if (response.documents.length > 0) {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.SUBSCRIPTIONS, response.documents[0].$id, payload);
    } else {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.SUBSCRIPTIONS, ID.unique(), payload);
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
      let plan: PlanType = 'free';

      const rcInfo = await revenueCatService.getCustomerInfo();
      if (rcInfo.isActive) {
        plan = rcInfo.plan;
        await upsertSubscription(profileId, plan, PLAN_LIMITS[plan] ?? 9999, rcInfo.expiresAt ?? undefined);
      } else {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SUBSCRIPTIONS, [
          Query.equal('profile_id', profileId),
          Query.limit(1)
        ]);
        plan = ((response.documents[0]?.plan) || 'free') as PlanType;
      }

      const storiesLimit = PLAN_LIMITS[plan] ?? 3;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const storiesResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.STORIES, [
        Query.equal('profile_id', profileId),
        Query.greaterThanEqual('generated_at', startOfMonth.toISOString()),
      ]);

      const used = storiesResponse.total ?? 0;
      const storiesRemaining = Math.max(0, storiesLimit - used);

      return {
        plan,
        stories_used: used,
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

  async syncFromRevenueCat(profileId: string): Promise<PlanType> {
    const rcInfo = await revenueCatService.getCustomerInfo();
    if (rcInfo.isActive) {
      await upsertSubscription(profileId, rcInfo.plan, PLAN_LIMITS[rcInfo.plan] ?? 9999, rcInfo.expiresAt ?? undefined);
      return rcInfo.plan;
    }
    return 'free';
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
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.STREAKS, [
        Query.equal('profile_id', profileId),
        Query.limit(1)
      ]);
      if (response.documents.length === 0) return null;
      return rowToStreak(response.documents[0]);
    } catch {
      return null;
    }
  },

  async updateStreak(profileId: string): Promise<Streak | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.STREAKS, [
        Query.equal('profile_id', profileId),
        Query.limit(1)
      ]);

      const existing = response.documents[0];

      if (!existing) {
        const created = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.STREAKS,
            ID.unique(),
            {
              profile_id: profileId,
              current_streak: 1,
              longest_streak: 1,
              last_activity_date: today,
              total_days_active: 1,
            }
        );
        return rowToStreak(created);
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
      const totalDaysActive = lastDate !== today
        ? (existing.total_days_active || 0) + 1
        : existing.total_days_active;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.STREAKS,
        existing.$id,
        {
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
          total_days_active: totalDaysActive,
        }
      );

      return rowToStreak(updated);
    } catch {
      return null;
    }
  },
};

export const interestService = {
  async getInterests(profileId: string): Promise<string[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILE_INTERESTS, [
        Query.equal('profile_id', profileId)
      ]);
      return response.documents.map((row: any) => row.interest);
    } catch {
      return [];
    }
  },

  async setInterests(profileId: string, interests: string[]): Promise<boolean> {
    try {
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILE_INTERESTS, [
        Query.equal('profile_id', profileId)
      ]);

      for (const doc of existing.documents) {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PROFILE_INTERESTS, doc.$id);
      }

      for (const interest of interests) {
        await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.PROFILE_INTERESTS,
            ID.unique(),
            { profile_id: profileId, interest }
        );
      }
      return true;
    } catch {
      return false;
    }
  },
};

import { databases, COLLECTIONS, DATABASE_ID, ID, Query } from '@/lib/appwrite';
import { SubscriptionStatus, Streak } from '@/types/database';
import { revenueCatService, PlanType } from '@/services/revenueCatService';
import { logger } from '@/utils/logger';

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 9999,
  family: 9999,
};

interface AppwriteStreakDoc {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  profile_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_days_active: number;
}

function rowToStreak(row: AppwriteStreakDoc | null): Streak {
  if (!row) return null as unknown as Streak;
  return {
    id: row.$id,
    profile_id: row.profile_id,
    current_streak: row.current_streak || 0,
    longest_streak: row.longest_streak || 0,
    last_activity_date: row.last_activity_date ?? null,
    total_days_active: row.total_days_active || 0,
    created_at: row.$createdAt,
    updated_at: row.$updatedAt,
  };
}

interface SubscriptionPayload {
  profile_id: string;
  plan: string;
  stories_limit: number;
  is_active: boolean;
  trial_ends_at?: string;
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

    const payload: SubscriptionPayload = {
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
    logger.error('Error upserting subscription:', error);
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
      return rowToStreak(response.documents[0] as unknown as AppwriteStreakDoc);
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
        return rowToStreak(created as unknown as AppwriteStreakDoc);
      }

      const doc = response.documents[0] as unknown as AppwriteStreakDoc;
      const lastDate = doc.last_activity_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = doc.current_streak || 0;
      if (lastDate === yesterdayStr) {
        newStreak += 1;
      } else if (lastDate !== today) {
        newStreak = 1;
      }

      const longestStreak = Math.max(doc.longest_streak || 0, newStreak);
      const totalDaysActive = lastDate !== today
        ? (doc.total_days_active || 0) + 1
        : doc.total_days_active;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.STREAKS,
        doc.$id,
        {
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
          total_days_active: totalDaysActive,
        }
      );

      return rowToStreak(updated as unknown as AppwriteStreakDoc);
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
      return response.documents.map((row) => (row as Record<string, unknown>).interest as string);
    } catch {
      return [];
    }
  },

  async setInterests(profileId: string, interests: string[]): Promise<boolean> {
    try {
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILE_INTERESTS, [
        Query.equal('profile_id', profileId)
      ]);

      // Parallel delete all existing interests
      await Promise.all(
        existing.documents.map((doc) =>
          databases.deleteDocument(DATABASE_ID, COLLECTIONS.PROFILE_INTERESTS, doc.$id)
        )
      );

      // Parallel create all new interests
      await Promise.all(
        interests.map((interest) =>
          databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.PROFILE_INTERESTS,
            ID.unique(),
            { profile_id: profileId, interest }
          )
        )
      );
      return true;
    } catch {
      return false;
    }
  },
};

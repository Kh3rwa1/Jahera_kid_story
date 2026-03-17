import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { SubscriptionStatus, Streak } from '@/types/database';

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 9999,
  family: 9999,
};

function docToStreak(doc: any): Streak {
  return {
    id: doc.$id,
    profile_id: doc.profile_id,
    current_streak: doc.current_streak || 0,
    longest_streak: doc.longest_streak || 0,
    last_activity_date: doc.last_activity_date ?? null,
    total_days_active: doc.total_days_active || 0,
    created_at: doc.$createdAt,
    updated_at: doc.$updatedAt,
  };
}

async function upsertSubscription(
  profileId: string,
  plan: string,
  storiesLimit: number,
  trialEndsAt?: string
): Promise<boolean> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SUBSCRIPTIONS,
      [Query.equal('profile_id', profileId), Query.limit(1)]
    );

    const payload: any = {
      profile_id: profileId,
      plan,
      stories_limit: storiesLimit,
      is_active: true,
    };
    if (trialEndsAt) payload.trial_ends_at = trialEndsAt;

    if (response.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SUBSCRIPTIONS,
        response.documents[0].$id,
        payload
      );
    } else {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SUBSCRIPTIONS,
        ID.unique(),
        payload
      );
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
      const subResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SUBSCRIPTIONS,
        [Query.equal('profile_id', profileId), Query.limit(1)]
      );

      const subDoc = subResponse.documents[0] ?? null;
      const plan = subDoc?.plan || 'free';
      const storiesLimit = PLAN_LIMITS[plan] ?? 3;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const storiesResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STORIES,
        [
          Query.equal('profile_id', profileId),
          Query.greaterThanEqual('generated_at', startOfMonth.toISOString()),
        ]
      );

      const storiesUsed = storiesResponse.total;
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
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STREAKS,
        [Query.equal('profile_id', profileId), Query.limit(1)]
      );
      if (response.documents.length === 0) return null;
      return docToStreak(response.documents[0]);
    } catch {
      return null;
    }
  },

  async updateStreak(profileId: string): Promise<Streak | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STREAKS,
        [Query.equal('profile_id', profileId), Query.limit(1)]
      );

      if (response.documents.length === 0) {
        const doc = await databases.createDocument(
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
        return docToStreak(doc);
      }

      const existing = response.documents[0];
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

      const doc = await databases.updateDocument(
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
      return docToStreak(doc);
    } catch {
      return null;
    }
  },
};

export const interestService = {
  async getInterests(profileId: string): Promise<string[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILE_INTERESTS,
        [Query.equal('profile_id', profileId)]
      );
      return response.documents.map((doc: any) => doc.interest);
    } catch {
      return [];
    }
  },

  async setInterests(profileId: string, interests: string[]): Promise<boolean> {
    try {
      const existing = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILE_INTERESTS,
        [Query.equal('profile_id', profileId)]
      );

      await Promise.all(
        existing.documents.map(doc =>
          databases.deleteDocument(DATABASE_ID, COLLECTIONS.PROFILE_INTERESTS, doc.$id)
        )
      );

      if (interests.length > 0) {
        await Promise.all(
          interests.map(interest =>
            databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.PROFILE_INTERESTS,
              ID.unique(),
              { profile_id: profileId, interest }
            )
          )
        );
      }
      return true;
    } catch {
      return false;
    }
  },
};

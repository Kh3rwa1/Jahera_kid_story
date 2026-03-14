import { supabase } from '@/lib/supabase';
import {
  Profile,
  UserLanguage,
  FamilyMember,
  Friend,
  Story,
  ProfileWithRelations,
  QuizQuestion,
  QuizAnswer,
  QuizAttempt,
} from '@/types/database';
import { DatabaseError, retryWithBackoff } from '@/utils/errorHandler';
import { validateKidName, validateMemberName, sanitizeInput } from '@/utils/validation';

export const profileServiceImproved = {
  async create(kidName: string, primaryLanguage: string): Promise<Profile> {
    const validatedName = validateKidName(kidName);

    return retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .insert({ kid_name: validatedName, primary_language: primaryLanguage })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to create profile: ${error.message}`);
      }

      if (!data) {
        throw new DatabaseError('No data returned from profile creation');
      }

      return data;
    });
  },

  async getById(id: string): Promise<Profile | null> {
    if (!id || typeof id !== 'string') {
      throw new DatabaseError('Invalid profile ID');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch profile: ${error.message}`);
    }

    return data;
  },

  async getWithRelations(id: string): Promise<ProfileWithRelations | null> {
    const [profile, languages, familyMembers, friends] = await Promise.allSettled([
      this.getById(id),
      languageServiceImproved.getByProfileId(id),
      familyMemberServiceImproved.getByProfileId(id),
      friendServiceImproved.getByProfileId(id),
    ]);

    const profileData = profile.status === 'fulfilled' ? profile.value : null;
    if (!profileData) return null;

    return {
      ...profileData,
      languages: languages.status === 'fulfilled' ? languages.value : [],
      family_members: familyMembers.status === 'fulfilled' ? familyMembers.value : [],
      friends: friends.status === 'fulfilled' ? friends.value : [],
      interests: [],
    };
  },

  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    if (updates.kid_name) {
      updates.kid_name = validateKidName(updates.kid_name);
    }

    return retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update profile: ${error.message}`);
      }

      if (!data) {
        throw new DatabaseError('No data returned from profile update');
      }

      return data;
    });
  },

  async delete(id: string): Promise<void> {
    return retryWithBackoff(async () => {
      const { error } = await supabase.from('profiles').delete().eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to delete profile: ${error.message}`);
      }
    });
  },
};

export const languageServiceImproved = {
  async add(profileId: string, languageCode: string, languageName: string): Promise<UserLanguage> {
    const sanitizedName = sanitizeInput(languageName);

    return retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('user_languages')
        .insert({
          profile_id: profileId,
          language_code: languageCode,
          language_name: sanitizedName,
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to add language: ${error.message}`);
      }

      if (!data) {
        throw new DatabaseError('No data returned from language addition');
      }

      return data;
    });
  },

  async getByProfileId(profileId: string): Promise<UserLanguage[]> {
    const { data, error } = await supabase
      .from('user_languages')
      .select()
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch languages: ${error.message}`);
    }

    return data || [];
  },

  async deleteByProfileAndCode(profileId: string, languageCode: string): Promise<void> {
    return retryWithBackoff(async () => {
      const { error } = await supabase
        .from('user_languages')
        .delete()
        .eq('profile_id', profileId)
        .eq('language_code', languageCode);

      if (error) {
        throw new DatabaseError(`Failed to delete language: ${error.message}`);
      }
    });
  },
};

export const familyMemberServiceImproved = {
  async add(profileId: string, name: string): Promise<FamilyMember> {
    const validatedName = validateMemberName(name);

    return retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('family_members')
        .insert({ profile_id: profileId, name: validatedName })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to add family member: ${error.message}`);
      }

      if (!data) {
        throw new DatabaseError('No data returned from family member addition');
      }

      return data;
    });
  },

  async getByProfileId(profileId: string): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from('family_members')
      .select()
      .eq('profile_id', profileId)
      .order('name', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch family members: ${error.message}`);
    }

    return data || [];
  },

  async delete(id: string): Promise<void> {
    return retryWithBackoff(async () => {
      const { error } = await supabase.from('family_members').delete().eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to delete family member: ${error.message}`);
      }
    });
  },
};

export const friendServiceImproved = {
  async add(profileId: string, name: string): Promise<Friend> {
    const validatedName = validateMemberName(name);

    return retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('friends')
        .insert({ profile_id: profileId, name: validatedName })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to add friend: ${error.message}`);
      }

      if (!data) {
        throw new DatabaseError('No data returned from friend addition');
      }

      return data;
    });
  },

  async getByProfileId(profileId: string): Promise<Friend[]> {
    const { data, error } = await supabase
      .from('friends')
      .select()
      .eq('profile_id', profileId)
      .order('name', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch friends: ${error.message}`);
    }

    return data || [];
  },

  async delete(id: string): Promise<void> {
    return retryWithBackoff(async () => {
      const { error } = await supabase.from('friends').delete().eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to delete friend: ${error.message}`);
      }
    });
  },
};

export const storyServiceImproved = {
  async getByProfileId(profileId: string): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select()
      .eq('profile_id', profileId)
      .order('generated_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch stories: ${error.message}`);
    }

    return data || [];
  },

  async getById(id: string): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch story: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    return retryWithBackoff(async () => {
      const { error } = await supabase.from('stories').delete().eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to delete story: ${error.message}`);
      }
    });
  },
};

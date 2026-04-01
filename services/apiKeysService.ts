import { supabase } from '@/lib/supabase';

export const API_KEY_NAMES = {
  OPENAI: 'openai_api_key',
  OPENROUTER: 'openrouter_api_key',
  ELEVENLABS: 'elevenlabs_api_key',
} as const;

export type ApiProvider = 'openai' | 'openrouter';

export const apiKeysService = {
  async getApiKey(keyName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('key_name', keyName)
        .maybeSingle();
      if (error) throw error;
      return data?.key_value ?? null;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  },

  async setApiKey(keyName: string, keyValue: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .upsert(
          { key_name: keyName, key_value: keyValue.trim(), is_active: true, updated_at: new Date().toISOString() },
          { onConflict: 'key_name' }
        );
      if (error) throw error;
    } catch (error) {
      console.error('Error setting API key:', error);
      throw error;
    }
  },

  async removeApiKey(keyName: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('key_name', keyName);
      if (error) throw error;
    } catch (error) {
      console.error('Error removing API key:', error);
    }
  },

  async getOpenAIKey(): Promise<string | null> {
    return this.getApiKey(API_KEY_NAMES.OPENAI);
  },

  async getOpenRouterKey(): Promise<string | null> {
    return this.getApiKey(API_KEY_NAMES.OPENROUTER);
  },

  async getElevenLabsKey(): Promise<string | null> {
    return this.getApiKey(API_KEY_NAMES.ELEVENLABS);
  },

  async setOpenAIKey(apiKey: string): Promise<void> {
    return this.setApiKey(API_KEY_NAMES.OPENAI, apiKey);
  },

  async setOpenRouterKey(apiKey: string): Promise<void> {
    return this.setApiKey(API_KEY_NAMES.OPENROUTER, apiKey);
  },

  async setElevenLabsKey(apiKey: string): Promise<void> {
    return this.setApiKey(API_KEY_NAMES.ELEVENLABS, apiKey);
  },

  async getActiveAIKey(): Promise<{ key: string; provider: ApiProvider } | null> {
    const openrouterKey = await this.getOpenRouterKey();
    if (openrouterKey && this.validateApiKey(API_KEY_NAMES.OPENROUTER, openrouterKey)) {
      return { key: openrouterKey, provider: 'openrouter' };
    }
    const openaiKey = await this.getOpenAIKey();
    if (openaiKey && this.validateApiKey(API_KEY_NAMES.OPENAI, openaiKey)) {
      return { key: openaiKey, provider: 'openai' };
    }
    return null;
  },

  validateApiKey(keyName: string, keyValue: string): boolean {
    if (!keyValue || keyValue.trim() === '') return false;
    if (keyValue === 'your-api-key-here') return false;

    switch (keyName) {
      case API_KEY_NAMES.OPENAI:
        return keyValue.startsWith('sk-') && keyValue.length > 20;
      case API_KEY_NAMES.OPENROUTER:
        return keyValue.startsWith('sk-or-') && keyValue.length > 20;
      case API_KEY_NAMES.ELEVENLABS:
        return keyValue.length > 20;
      default:
        return keyValue.length > 10;
    }
  },

  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '••••••••';
    const visibleStart = apiKey.substring(0, 8);
    const visibleEnd = apiKey.substring(apiKey.length - 4);
    return `${visibleStart}••••••••${visibleEnd}`;
  },
};

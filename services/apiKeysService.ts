import { supabase } from '@/lib/supabase';
import { DatabaseError } from '@/utils/errorHandler';

export interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const API_KEY_NAMES = {
  OPENAI: 'openai_api_key',
  ELEVENLABS: 'elevenlabs_api_key',
} as const;

export const apiKeysService = {
  async getApiKey(keyName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_api_key', {
        p_key_name: keyName,
      });

      if (error) {
        throw new DatabaseError(`Failed to get API key: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting API key:', error);
      throw error;
    }
  },

  async setApiKey(
    keyName: string,
    keyValue: string,
    description?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('set_api_key', {
        p_key_name: keyName,
        p_key_value: keyValue,
        p_description: description || null,
      });

      if (error) {
        throw new DatabaseError(`Failed to set API key: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error setting API key:', error);
      throw error;
    }
  },

  async getOpenAIKey(): Promise<string | null> {
    return this.getApiKey(API_KEY_NAMES.OPENAI);
  },

  async getElevenLabsKey(): Promise<string | null> {
    return this.getApiKey(API_KEY_NAMES.ELEVENLABS);
  },

  async setOpenAIKey(apiKey: string): Promise<string> {
    return this.setApiKey(
      API_KEY_NAMES.OPENAI,
      apiKey,
      'OpenAI API key for story generation'
    );
  },

  async setElevenLabsKey(apiKey: string): Promise<string> {
    return this.setApiKey(
      API_KEY_NAMES.ELEVENLABS,
      apiKey,
      'ElevenLabs API key for text-to-speech'
    );
  },

  validateApiKey(keyName: string, keyValue: string): boolean {
    if (!keyValue || keyValue.trim() === '') {
      return false;
    }

    if (keyValue === 'your-api-key-here') {
      return false;
    }

    switch (keyName) {
      case API_KEY_NAMES.OPENAI:
        return keyValue.startsWith('sk-') && keyValue.length > 20;
      case API_KEY_NAMES.ELEVENLABS:
        return keyValue.length > 20;
      default:
        return keyValue.length > 10;
    }
  },

  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '••••••••';
    }
    const visibleStart = apiKey.substring(0, 4);
    const visibleEnd = apiKey.substring(apiKey.length - 4);
    return `${visibleStart}••••••••${visibleEnd}`;
  },
};

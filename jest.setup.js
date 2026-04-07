// Mock node-appwrite for React Native Jest environment
jest.mock('node-appwrite', () => ({
  Client: jest.fn(),
  ID: { unique: jest.fn(() => 'unique-id') },
  Databases: jest.fn(),
  Users: jest.fn(),
  Storage: jest.fn(),
  Query: {
    equal: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
  },
}), { virtual: true });

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({ sound: { unloadAsync: jest.fn(), setOnPlaybackStatusUpdate: jest.fn() } }),
    },
    setAudioModeAsync: jest.fn(),
  },
}));

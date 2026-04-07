module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^node-appwrite$': '<rootDir>/jest.setup.js',
    '^react-native-reanimated$': require.resolve('react-native-reanimated/mock'),
  },
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native|react-native-appwrite)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js',
    '!**/infrastructure-scripts/**',
    '!**/appwrite/**',
  ],
  roots: [
    '<rootDir>/app',
    '<rootDir>/components',
    '<rootDir>/hooks',
    '<rootDir>/services',
    '<rootDir>/utils',
    '<rootDir>/contexts',
    '<rootDir>/constants',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/infrastructure-scripts/',
    '<rootDir>/appwrite/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/infrastructure-scripts/',
    '<rootDir>/appwrite/',
  ],
};

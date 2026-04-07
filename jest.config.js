module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
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
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/appwrite-init.js',
    '<rootDir>/test-.*\\.js',
    '<rootDir>/appwrite/',
    '<rootDir>/diagnose-appwrite.js',
    '<rootDir>/get-executions.js',
    '<rootDir>/appwrite-config-setup.js'
  ],
};

module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-svg|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-calendars|@notifee|zustand)/)',
  ],
  moduleNameMapper: {
    '^react-native-tts$': '<rootDir>/__mocks__/react-native-tts.js',
    '^react-native-keychain$': '<rootDir>/__mocks__/react-native-keychain.js',
    '^@react-native-firebase/auth$': '<rootDir>/__mocks__/@react-native-firebase/auth.js',
    '^@react-native-firebase/app$': '<rootDir>/__mocks__/@react-native-firebase/app.js',
    '^@notifee/react-native$': '<rootDir>/__mocks__/@notifee/react-native.js',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
};

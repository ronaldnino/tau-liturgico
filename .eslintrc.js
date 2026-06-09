module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  plugins: ['react', 'react-hooks', 'react-native', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  env: {
    'react-native/react-native': true,
  },
};

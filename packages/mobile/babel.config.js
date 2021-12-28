module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['react-native-reanimated/plugin'],
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          src: './src',
        },
      },
    ],
  ],
  env: {
    production: {
      plugins: [
        ['transform-remove-console'], // Remove console logs in production
      ],
    },
  },
};

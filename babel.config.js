module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['react-native-reanimated/plugin'],
    // [
    //   'module:react-native-dotenv',
    //   {
    //     moduleName: '@env',
    //     path: '.env',
    //     blacklist: null,
    //     whitelist: [
    //       'PARSE_APP_ID',
    //       'PARSE_SERVER_URL',
    //       'PARSE_APP_ID_DEV',
    //       'PARSE_SERVER_URL_DEV',
    //       'PARSE_SERVER_TERMS_URL',
    //     ],
    //     safe: false,
    //     allowUndefined: true,
    //   },
    // ],
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
};

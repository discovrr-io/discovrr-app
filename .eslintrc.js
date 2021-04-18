module.exports = {
  root: true,
  extends: ['airbnb', 'airbnb/hooks'],
  parser: 'babel-eslint',
  env: {
    browser: true,
    node: true,
    es6: true,
    mocha: true,
  },
  globals: {
    debugAppLogger: false,
  },
  rules: {
    'max-len': [1, 120, 2, { ignoreComments: true }],
    'no-use-before-define': ['error', { functions: false, classes: true, variables: false }],
    'object-curly-newline': ['error', { consistent: true }],
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/jsx-one-expression-per-line': ['warn', { allow: 'single-child' }],
    'react/prop-types': 0,
  },
};

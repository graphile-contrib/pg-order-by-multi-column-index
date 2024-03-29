module.exports = {
  env: {
    node: true,
    es6: true,
    "jest/globals": true,
  },
  parserOptions: {
    ecmaVersion: 9,
  },
  plugins: ["jest"],
  extends: [
    "eslint:recommended",
    "plugin:jest/recommended",
    "prettier"
  ],
  rules: {
    "jest/expect-expect": ["off"],
  },
};

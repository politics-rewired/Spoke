module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "airbnb",
    "plugin:prettier/recommended",
    "prettier/react",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jasmine: true,
    jest: true,
    node: true
  },
  rules: {
    "jsx-a11y/href-no-hash": ["off"],
    "react/jsx-filename-extension": ["warn", { extensions: [".js", ".jsx"] }],
    "max-len": [
      "warn",
      {
        code: 80,
        tabWidth: 2,
        comments: 80,
        ignoreComments: false,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }
    ],
    // Rewired
    "comma-dangle": ["error", "never"],
    semi: ["error", "always"]
  }
};

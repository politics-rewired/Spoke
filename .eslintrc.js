module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ["@typescript-eslint", "simple-import-sort"],
  extends: [
    "eslint:recommended",
    "airbnb",
    "plugin:react/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier/react",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended" // Make this the last element so prettier config overrides other formatting rules
  ],
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jasmine: true,
    jest: true,
    node: true
  },
  settings: {
    react: {
      version: "detect"
    },
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  },
  rules: {
    "simple-import-sort/sort": "error",
    "prettier/prettier": ["error", {}, { usePrettierrc: true }],
    "jsx-a11y/href-no-hash": ["off"],
    "react/jsx-filename-extension": ["warn", { extensions: [".js", ".jsx"] }],
    "max-len": [
      "warn",
      {
        code: 80,
        tabWidth: 2,
        comments: 120,
        ignoreComments: false,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }
    ],

    // Rewired
    // --------------------------------
    "comma-dangle": ["error", "never"],
    semi: ["error", "always"],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "import/extensions": ["error", "never"],
    "no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
    ],
    "@typescript-eslint/no-empty-function": "off",
    "no-nested-ternary": "off",
    "no-underscore-dangle": "off",
    "@typescript-eslint/no-non-null-assertion": "off",

    // Rules to get linting to pass
    camelcase: ["off", { properties: "never" }],
    "no-await-in-loop": ["off"],
    "@typescript-eslint/no-var-requires": ["off"],
    "import/order": ["off"],
    "no-console": ["off"],
    "prefer-promise-reject-errors": ["off"],
    "no-restricted-syntax": ["off"],
    "consistent-return": ["off"],
    "no-continue": ["off"],
    "no-param-reassign": ["off"],
    "guard-for-in": ["off"]
  },
  overrides: [
    {
      // enable the rule specifically for TypeScript files
      files: ["*.ts", "*.tsx"],
      rules: {
        "no-shadow": "off", // JS `no-shadow` rule doesn't handle enums correctly
        "@typescript-eslint/no-shadow": "error",
        "@typescript-eslint/explicit-module-boundary-types": ["error"]
      }
    }
  ]
};

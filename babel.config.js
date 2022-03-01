module.exports = {
  presets: [
    "@babel/preset-react",
    "@babel/preset-env",
    "@babel/preset-typescript"
  ],
  plugins: [
    ["@babel/plugin-transform-runtime", { corejs: 3 }],
    "tsconfig-paths-module-resolver",
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-export-default-from"
  ]
};

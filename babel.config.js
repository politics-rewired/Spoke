module.exports = {
  presets: [
    "@babel/preset-react",
    "@babel/preset-env",
    "@babel/preset-typescript"
  ],
  plugins: [
    "react-hot-loader/babel",
    ["@babel/plugin-transform-runtime", { corejs: 3 }],
    "@babel/plugin-proposal-class-properties"
  ]
};

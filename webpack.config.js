const { config } = require("./webpack/build-config");
const path = require("path");
const webpack = require("webpack");
const ManifestPlugin = require("webpack-manifest-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const basePlugins = [
  new webpack.DefinePlugin({
    "process.env.NODE_ENV": JSON.stringify(config.NODE_ENV),
    "process.env.PHONE_NUMBER_COUNTRY": JSON.stringify(
      config.PHONE_NUMBER_COUNTRY
    )
  }),
  // See: https://github.com/spiritit/timezonecomplete#webpack
  new webpack.ContextReplacementPlugin(
    // eslint-disable-next-line no-useless-escape
    /[\/\\]node_modules[\/\\]timezonecomplete[\/\\]/,
    path.resolve("tz-database-context"),
    {
      tzdata: "tzdata"
    }
  )
];

const productionPlugins = [
  // Ignore publicPath as we use STATIC_BASE_URL at runtime instead
  new ManifestPlugin({
    fileName: config.ASSETS_MAP_FILE,
    publicPath: ""
  })
];

module.exports = {
  context: path.resolve(__dirname, "src"),
  entry: {
    bundle: "./client/index.jsx"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".mjs", ".js", ".jsx", ".json"]
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      }
    ]
  },
  plugins: basePlugins.concat(config.isProduction ? productionPlugins : []),
  optimization: {
    minimize: config.isProduction,
    minimizer: [new TerserPlugin()]
  },
  devtool: config.isProduction ? "hidden-source-map" : "inline-source-map",
  output: {
    filename: config.isProduction ? "[name].[chunkhash].js" : "[name].js",
    path: path.resolve(config.isProduction ? config.ASSETS_DIR : __dirname),
    publicPath: "/assets/"
  },
  // See: https://webpack.js.org/configuration/dev-server/
  devServer: {
    contentBase: "/assets/",
    publicPath: "/assets/",
    hot: true,
    // this should be temporary until we get the real hostname plugged in everywhere
    disableHostCheck: true,
    headers: { "Access-Control-Allow-Origin": "*" },
    port: config.WEBPACK_PORT || config.PORT,
    proxy: {
      "*": `http://127.0.0.1:${config.DEV_APP_PORT}`
    },
    stats: "minimal"
  }
};

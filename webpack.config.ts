/* eslint-disable import/no-extraneous-dependencies */
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import * as webpack from "webpack";
import { WebpackManifestPlugin } from "webpack-manifest-plugin";

import { config } from "./webpack/build-config";

type WebpackConfiguration = webpack.Configuration & {
  devServer: Record<string, any>;
};

const webpackConfig: WebpackConfiguration = {
  mode: config.isProd ? "production" : "development",
  context: path.resolve(__dirname, "src"),
  entry: {
    bundle: "./client/index.jsx"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    fallback: { path: require.resolve("path-browserify") }
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          plugins: [
            config.isDevelopment && require.resolve("react-refresh/babel")
          ].filter(Boolean)
        }
      },
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      }
    ]
  },
  plugins: [
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
    ),
    // config.isDevelopment && new webpack.HotModuleReplacementPlugin(),
    config.isDevelopment && new ReactRefreshWebpackPlugin(),
    config.isProduction &&
      // Ignore publicPath as we use STATIC_BASE_URL at runtime instead
      new WebpackManifestPlugin({
        fileName: config.ASSETS_MAP_FILE,
        publicPath: ""
      })
  ].filter(Boolean),
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

module.exports = webpackConfig;

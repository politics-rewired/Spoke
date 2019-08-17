const { config } = require("./build-config");
const path = require("path");
const webpack = require("webpack");
const ManifestPlugin = require("webpack-manifest-plugin");

const DEBUG = !config.isProduction;

const plugins = [
  new webpack.DefinePlugin({
    "process.env.NODE_ENV": `"${config.NODE_ENV}"`,
    "process.env.PHONE_NUMBER_COUNTRY": `"${config.PHONE_NUMBER_COUNTRY}"`
  }),
  new webpack.ContextReplacementPlugin(
    /[\/\\]node_modules[\/\\]timezonecomplete[\/\\]/,
    path.resolve("tz-database-context"),
    {
      tzdata: "tzdata"
    }
  )
];
const jsxLoaders = [{ loader: "babel-loader" }];
const assetsDir = config.ASSETS_DIR;
const assetMapFile = config.ASSETS_MAP_FILE;
const outputFile = DEBUG ? "[name].js" : "[name].[chunkhash].js";

if (!DEBUG) {
  plugins.push(
    new ManifestPlugin({
      fileName: assetMapFile
    })
  );
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true
    })
  );
  plugins.push(
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  );
} else {
  plugins.push(new webpack.HotModuleReplacementPlugin());
  jsxLoaders.unshift({ loader: "react-hot-loader" });
}

const webpackConfig = {
  entry: {
    bundle: ["babel-polyfill", "./src/client/index.jsx"]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      },
      {
        test: /\.jsx?$/,
        use: jsxLoaders,
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  resolve: {
    extensions: [".js", ".jsx"]
  },
  plugins,
  devtool: config.isProduction ? "hidden-source-map" : "inline-source-map",
  output: {
    filename: outputFile,
    path: path.resolve(DEBUG ? __dirname : assetsDir),
    publicPath: "/assets/"
  }
};

module.exports = webpackConfig;

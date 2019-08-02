import { config } from "../src/config";
import WebpackDevServer from "webpack-dev-server";
import webpack from "webpack";
import webpackConfig from "./config";
import { log } from "../src/lib";

const webpackPort = config.WEBPACK_PORT;
const appPort = config.DEV_APP_PORT;
const webpackHost = config.WEBPACK_HOST;

Object.keys(webpackConfig.entry).forEach(key => {
  webpackConfig.entry[key].unshift(
    `webpack-dev-server/client?http://${webpackHost}:${webpackPort}/`
  );
  webpackConfig.entry[key].unshift("webpack/hot/only-dev-server");
});

const compiler = webpack(webpackConfig);
const connstring = `http://127.0.0.1:${appPort}`;

log.info(`Proxying requests to:${connstring}`);

const app = new WebpackDevServer(compiler, {
  contentBase: "/assets/",
  publicPath: "/assets/",
  hot: true,
  // this should be temporary until we get the real hostname plugged in everywhere
  disableHostCheck: true,
  headers: { "Access-Control-Allow-Origin": "*" },
  proxy: {
    "*": `http://127.0.0.1:${appPort}`
  },
  stats: {
    colors: true,
    hash: false,
    version: false,
    timings: false,
    assets: false,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    errors: false,
    errorDetails: false,
    warnings: true,
    publicPath: false
  }
});

app.listen(webpackPort || config.PORT, () => {
  log.info(
    `Webpack dev server is now running on http://${webpackHost}:${webpackPort}`
  );
});

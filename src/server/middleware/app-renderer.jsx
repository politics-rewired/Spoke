import { config } from "../../config";

import fs from "fs";
import path from "path";
import React from "react";
import { match } from "react-router";

import makeRoutes from "../../routes";
import renderIndex from "./render-index";

let assetMap = {
  "bundle.js": "/assets/bundle.js"
};
if (config.isProduction) {
  const assetMapData = JSON.parse(
    fs.readFileSync(
      // this is a bit overly complicated for the use case
      // of it being run from the build directory BY claudia.js
      // we need to make it REALLY relative, but not by the
      // starting process or the 'local' directory (which are both wrong then)
      config.ASSETS_DIR.startsWith(".")
        ? path.join(
            __dirname,
            "../../../../",
            config.ASSETS_DIR,
            config.ASSETS_MAP_FILE
          )
        : path.join(config.ASSETS_DIR, config.ASSETS_MAP_FILE)
    )
  );
  const staticBase = config.STATIC_BASE_URL;
  for (var a in assetMapData) {
    assetMap[a] = staticBase + assetMapData[a];
  }
}

const handleRequest = async (req, res) => {
  const authCheck = (nextState, replace) => {
    if (!req.isAuthenticated()) {
      replace({
        pathname: `/login?nextUrl=${nextState.location.pathname}`
      });
    }
  };

  const handleMatch = (error, redirectLocation, renderProps) => {
    if (error) {
      res.status(500).send(error.message);
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      const indexHtml = renderIndex(assetMap);
      res.send(indexHtml);
    } else {
      res.status(404).send("Not found");
    }
  };

  const matchOptions = {
    routes: makeRoutes(authCheck),
    location: req.url
  };

  match(matchOptions, handleMatch);
};

export default handleRequest;

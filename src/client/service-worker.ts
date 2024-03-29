/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

import type { RouteHandler } from "workbox-core";
import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { offlineFallback, warmStrategyCache } from "workbox-recipes";
import { setDefaultHandler } from "workbox-routing";
import { CacheFirst, NetworkOnly } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

// Claim open tabs once current SW version becomes active
clientsClaim();

// Precache all webpack-generated assets
precacheAndRoute(self.__WB_MANIFEST);

const OFFLINE_URL = "/assets/offline.html";

const GATEWAY_ERR_CODES = [
  502, // Bad Gateway -- received an invalid response from the upstream server
  503, // Service Unavailable -- server cannot handle the request
  504 // Gateway Timeout -- did not receive a timely response from the upstream server
];

const networkOnly = new NetworkOnly();

const networkOnlyHandlerWithGatewayErrorFallback: RouteHandler = async (
  params
) => {
  try {
    let response = await networkOnly.handle(params);
    const isGatewayErr = GATEWAY_ERR_CODES.includes(response.status);
    if (isGatewayErr && params.request.mode === "navigate") {
      response = (await caches.match(OFFLINE_URL)) ?? response;
    }
    return response;
  } catch (workboxErr) {
    console.error("workbox err", workboxErr);
    throw workboxErr;
  }
};

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Warm cache resources for offline fallback page
const strategy = new CacheFirst();
const urls = [
  "https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
];
warmStrategyCache({ urls, strategy });

// Bypass the cache for non-webpack assets (e.g. everything else)
setDefaultHandler(networkOnlyHandlerWithGatewayErrorFallback);

// Fall back to static page
offlineFallback({
  pageFallback: OFFLINE_URL
});

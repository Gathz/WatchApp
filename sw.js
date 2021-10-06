// Incrementing OFFLINE_VERSION will kick off the install event and force
// previously cached resources to be updated from the network.
const OFFLINE_VERSION = 1;
const CACHE_NAME = "offline";
// Customize this with a different URL if needed.
const OFFLINE_URL = "./offline.html";
const resourcesToPrecache = [
  "./assets/images/icons/icon-32x32.png",
  "./assets/images/icons/icon-76x76.png",
  "./assets/images/icons/icon-120x120.png",
  "./assets/images/icons/icon-144x144.png",
  "./assets/images/icons/icon-152x152.png",
  "./assets/images/icons/icon-167x167.png",
  "./assets/images/icons/icon-180x180.png",
  "./assets/images/icons/icon-192x192.png",
  "./assets/images/icons/icon-196x196.png",
  "./assets/images/icons/icon-512x512.png",
  "./assets/fonts/frontend/Quicksand-Bold.ttf",
  "./assets/fonts/frontend/Quicksand-Bold.woff",
  "./assets/fonts/frontend/Quicksand-Bold.woff2",
  "./assets/fonts/frontend/Quicksand-Light.ttf",
  "./assets/fonts/frontend/Quicksand-Light.woff",
  "./assets/fonts/frontend/Quicksand-Light.woff2",
  "./assets/fonts/frontend/Quicksand-Medium.ttf",
  "./assets/fonts/frontend/Quicksand-Medium.woff",
  "./assets/fonts/frontend/Quicksand-Medium.woff2",
  "./assets/fonts/frontend/Quicksand-Regular.ttf",
  "./assets/fonts/frontend/Quicksand-Regular.woff",
  "./assets/fonts/frontend/Quicksand-Regular.woff2",
  "./assets/fonts/frontend/Quicksand-SemiBold.ttf",
  "./assets/fonts/frontend/Quicksand-SemiBold.woff",
  "./assets/fonts/frontend/Quicksand-SemiBold.woff2",
  "./assets/fonts/frontend/barlowcondensed-bold-webfont.woff",
  "./assets/fonts/frontend/barlowcondensed-bold-webfont.woff2",
  "./assets/fonts/frontend/barlowcondensed-regular-webfont.woff",
  "./assets/fonts/frontend/barlowcondensed-regular-webfont.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Setting {cache: 'reload'} in the new request will ensure that the
      // response isn't fulfilled from the HTTP cache; i.e., it will be from
      // the network.
      await cache.addAll(resourcesToPrecache);
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
    })()
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if it's supported.
      // See https://developers.google.com/web/updates/2017/02/navigation-preload
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );

  // Tell the active service worker to take control of the page immediately.
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // We only want to call event.respondWith() if this is a navigation request
  // for an HTML page.
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported.
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          // Always try the network first.
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // catch is only triggered if an exception is thrown, which is likely
          // due to a network error.
          // If fetch() returns a valid HTTP response with a response code in
          // the 4xx or 5xx range, the catch() will NOT be called.
          console.log("Fetch failed; returning offline page instead.", error);

          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        }
      })()
    );
  }

  // If our if() condition is false, then this fetch handler won't intercept the
  // request. If there are any other fetch handlers registered, they will get a
  // chance to call event.respondWith(). If no fetch handlers call
  // event.respondWith(), the request will be handled by the browser as if there
  // were no service worker involvement.
});

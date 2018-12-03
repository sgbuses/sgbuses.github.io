importScripts('/async-waituntil.js');

const version = 'v0.041::';
const staticCacheName = version + 'static';
function updateStaticCache() {
    return caches.open(staticCacheName)
    .then( cache => {
        // These items won't block the installation of the Service Worker
        cache.addAll([
        '/nxy.css',
        '/nxy.png',
        '/nxy.svg',
        '/stops.json',
        '/routes.json'
          ]);
      return cache.addAll([
        '/',
        '/index.html',
        '/routes.html',
        '/jquery.js',
        '/scripts.js',
]);
    });
}

// Remove caches whose name is no longer valid
function clearOldCaches() {
    return caches.keys()
    .then( keys => {
        return Promise.all(keys
            .filter(key => key.indexOf(version) !== 0)
            .map(key => caches.delete(key))
        );
    });
}

self.addEventListener('install', event => {
    event.waitUntil(
        updateStaticCache()
        .then( () => self.skipWaiting() )
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        clearOldCaches()
        .then( () => self.clients.claim() )
    );
});

self.addEventListener('fetch', event => {
    let request = event.request;
    // Look in the cache first, fall back to the network
    event.respondWith(
        // CACHE
        caches.match(request)
        .then( responseFromCache => {
            // Did we find the file in the cache?
            if (responseFromCache) {
                // If so, fetch a fresh copy from the network in the background
                // (using the async waitUntil polyfill)
                event.waitUntil(
                    // NETWORK
                    fetch(request)
                    .then( responseFromFetch => {
                        // Stash the fresh copy in the cache
                        caches.open(staticCacheName)
                        .then( cache => {
                            cache.put(request, responseFromFetch);
                        });
                    })
                );
                return responseFromCache
            }
            // NETWORK
            // If the file wasn't in the cache, make a network request
            return fetch(request)
            .then( responseFromFetch => {
                // Stash a fresh copy in the cache in the background
                // (using the async waitUntil polyfill)
                let responseCopy = responseFromFetch.clone();
                event.waitUntil(
                    caches.open(staticCacheName)
                    .then( cache => {
                        cache.put(request, responseCopy);
                    })
                );
                return responseFromFetch;
            })
            .catch( () => {
      
                // If the request is for a page, show an offline message
                if (request.headers.get('Accept').includes('text/html')) {
                    return caches.match('/routes.html');
                }
            })
        })
    );
});


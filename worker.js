let currentTimestamp = 'initial';
self.addEventListener('message', (event) => {
    if (event.data.application) {
        currentTimestamp = event.data.application;
        caches.keys().then((cacheNames) => {
            return Promise.all(cacheNames.map((cacheName) => {
                if (cacheName !== currentTimestamp) {
                    return caches.delete(cacheName);
                }
            }));
        });
    }
});
self.addEventListener('fetch', (event) => {
    const requestedFile = event.request.url.replace(/.*\//, '');
    if (requestedFile.match('.js') || requestedFile.match('.css') || requestedFile.match('.scss') || requestedFile.match('.ts') || requestedFile.match('.json') || requestedFile.match('.html') || requestedFile.match('.md')) {
        event.respondWith(caches.match(event.request).then((resp) => {
            return resp || fetch(event.request).then((response) => {
                let responseClone = response.clone();
                if (!responseClone.redirected && responseClone.ok) {
                    caches.open(currentTimestamp).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            });
        }).catch(() => {
            return new Response('No internet');
        }));
    }
    else {
        event.respondWith(fetch(event.request).then((response) => {
            return response;
        }));
    }
});

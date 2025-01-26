const CACHE_NAME = 'bank-form-cache-v1';
const urlsToCache = [
  '/',
    '/auth/auth_form.html',
    '/bankform/bank_form.html',
     '/static/auth_style.css',
    '/static/bank_style.css',
    '/static/auth_script.js',
    '/static/bank_script.js',
];
self.addEventListener('install', event => {
      event.waitUntil(
        caches.open(CACHE_NAME)
       .then(cache => {
           return cache.addAll(urlsToCache);
       })
    );
});
self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
         return response || fetch(event.request);
      })
);
});
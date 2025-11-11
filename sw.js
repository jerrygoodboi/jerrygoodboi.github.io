// Service Worker for Ad Network Verification
self.addEventListener('install', function(event) {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating.');
});

self.addEventListener('fetch', function(event) {
  // Let the browser do its default thing for all requests
  return;
});

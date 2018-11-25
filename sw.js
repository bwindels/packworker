self.oninstall = function(event) {
  console.log("SW installing", self.requests);
  self.skipWaiting();
};

self.onactivate = function(event) {
	console.log("SW activating", self.requests);
	event.waitUntil(clients.claim());
}

self.onfetch = function(event) {
	//const request = self.requests.match(event.request).then(inflight => {
	//	return inflight || self.caches.match(event.request) || fetch(event.request);
	//});
	//event.respondWith(request);
	console.log("intercepted request ", event.request.url, self.requests);
	event.respondWith(fetch(event.request));
}
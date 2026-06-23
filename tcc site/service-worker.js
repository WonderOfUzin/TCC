// Service worker do Contador da Cantina
// Estratégia: cache-first para o app shell, com fallback de rede.
// Isso garante que o app abra e funcione mesmo sem internet/wi-fi instável.

const CACHE_NAME = "cantina-v1";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-72.png",
  "./icon-96.png",
  "./icon-128.png",
  "./icon-144.png",
  "./icon-152.png",
  "./icon-192.png",
  "./icon-384.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  // Só tratamos GET; outros métodos passam direto para a rede.
  if(event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request).then(function(response){
        // Guarda uma cópia no cache para a próxima vez que estiver offline.
        if(response && response.status === 200 && response.type === "basic"){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function(){
        // Sem rede e sem cache para esse recurso: tenta servir a página principal.
        return caches.match("./index.html");
      });
    })
  );
});

/* Hand Flow Art — offline cache (everything, incl. the AI model, is stored on the phone) */
const CACHE = 'hand-flow-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./mediapipe/hand_landmark_lite.tflite",
  "./mediapipe/hands.binarypb",
  "./mediapipe/hands.js",
  "./mediapipe/hands_solution_packed_assets.data",
  "./mediapipe/hands_solution_packed_assets_loader.js",
  "./mediapipe/hands_solution_simd_wasm_bin.data",
  "./mediapipe/hands_solution_simd_wasm_bin.js",
  "./mediapipe/hands_solution_simd_wasm_bin.wasm",
  "./mediapipe/hands_solution_wasm_bin.js",
  "./mediapipe/hands_solution_wasm_bin.wasm",
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

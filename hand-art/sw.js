/* Hand Flow Art — offline cache
   · 화면 파일(index.html 등): 온라인이면 항상 새로 받아옴(network-first), 오프라인이면 저장본 사용
   · AI 모델·런타임(mediapipe/): 한 번 받으면 그대로 재사용(버전 올려도 다시 받지 않음) */
const CORE = 'hand-flow-core-v54';
const MODEL = 'hand-flow-model-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const MODEL_ASSETS = [
  "./audio/where_the_stream_widens.mp3",
  "./audio/where_the_ocean_meets_sky.mp3",
  "./audio/glass_upon_the_lake.mp3",
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
  e.waitUntil(Promise.all([
    caches.open(CORE).then(c => c.addAll(CORE_ASSETS.map(u => new Request(u, { cache: 'reload' })))),
    caches.open(MODEL).then(async c => { for (const u of MODEL_ASSETS) if (!(await c.match(u))) await c.add(u); })
  ]).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // 옛 버전 저장본은 여기서 자동 삭제
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CORE && k !== MODEL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isModel = /\/(mediapipe|audio)\//.test(new URL(req.url).pathname);
  if (isModel) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(MODEL).then(c => c.put(req, cp)); } return res; })));
    return;
  }
  // network-first: 새 버전이 있으면 바로 반영, 실패(오프라인)하면 저장본
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(CORE).then(c => c.put(req, cp)); } return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
});

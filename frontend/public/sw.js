// Service worker minimal: membuat aplikasi bisa di-install (PWA) dan
// menampilkan halaman offline saat tidak ada koneksi.
// SENGAJA tidak meng-cache halaman/API: konten LMS berbeda per user (cookie
// login) dan harus selalu segar, jadi hanya halaman offline yang disimpan.
const CACHE = "lms-pplg-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
  );
});

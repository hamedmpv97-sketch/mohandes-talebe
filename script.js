// ===== آدرس‌های API گوگل اسکریپت =====
const LESSONS_API_URL = 'https://script.google.com/macros/s/AKfycbwE-6tgn6HJj0EUuLo98K4XWrNC6zFF1FLpZhfzdEAVb0Ka-MmifVMfwD8Cq1M300Q/exec';
const ARTICLES_API_URL = 'https://script.google.com/macros/s/AKfycbwhACP86erhULYh0CYphWbVHu8iAB_4XgF7HPI3M6o5C2cApauYKiZlD7SIlmvKUf5hIg/exec';

// ===== آدرس API دوره‌ها (شیت دوره‌ها) =====
const COURSES_API_URL = 'https://script.google.com/macros/s/AKfycbzWrsImaLC6uw_NpQdW2a_8rbRNyfiJ65F3WDoFLHke8l9k3n3QaelK0KJrZUWOWJT0nQ/exec';

// (اختیاری) آدرس API جلسات دوره‌ها
const COURSE_SESSIONS_API_URL = 'https://script.google.com/macros/s/AKfycbzWrsImaLC6uw_NpQdW2a_8rbRNyfiJ65F3WDoFLHke8l9k3n3QaelK0KJrZUWOWJT0nQ/exec?sheet=' + encodeURIComponent('جلسات دوره‌ها');

// ===== آدرس API بنرها =====
const BANNERS_API_URL = 'https://script.google.com/macros/s/AKfycbxZDnlSkK_5wCSqVLUE9FFXDT55tVq4Dt7Dbq6r8QzaKF_nr2O5sV6uJbf8yw8pDc-v4A/exec';

// ===== مدیریت ذخیره‌سازی فایل‌های آفلاین (IndexedDB) =====
const DB_NAME = 'OfflineMediaDB';
const STORE_NAME = 'media_files';

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveFileToOfflineDB(key, blob) {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(blob, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('خطا در ذخیره آفلاین:', err);
    return false;
  }
}

async function getFileFromOfflineDB(key) {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('خطا در دریافت فایل آفلاین:', err);
    return null;
  }
}

async function deleteFileFromOfflineDB(key) {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('خطا در حذف فایل آفلاین:', err);
  }
}

// ===== تبدیل لینک به لینک دانلود مستقیم =====
function toDirectDownloadUrl(url) {
  if (!url) return url;
  const u = String(url).trim();

  // Google Drive: /file/d/ID/view
  let m = u.match(/drive\.google\.com\/file\/d\/([^\/\?&#]+)/);
  if (m) return 'https://drive.google.com/uc?export=download&id=' + m[1];

  // Google Drive: open?id=ID  یا  uc?id=ID
  m = u.match(/drive\.google\.com\/(?:open|uc)\?(?:[^&]*&)*id=([^&\s]+)/);
  if (m) return 'https://drive.google.com/uc?export=download&id=' + m[1];

  // Dropbox
  if (/dropbox\.com/.test(u)) {
    return u.replace(/[?&]dl=0/, (x) => x.charAt(0) + 'dl=1');
  }

  return u;
}

document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);

  // ===== مدیریت اسپلش اسکرین =====
  const splashScreen = document.getElementById('splashScreen');
  const SPLASH_MIN_DURATION = 1500;
  const splashStartTime = Date.now();

  function hideSplash() {
    if (!splashScreen) return;
    const elapsed = Date.now() - splashStartTime;
    const remaining = Math.max(0, SPLASH_MIN_DURATION - elapsed);
    setTimeout(() => {
      splashScreen.classList.add('hide');
      setTimeout(() => {
        if (splashScreen && splashScreen.parentNode) {
          splashScreen.parentNode.removeChild(splashScreen);
        }
      }, 600);
    }, remaining);
  }

  window.addEventListener('load', hideSplash);
  setTimeout(hideSplash, 5000);

  // ===== المان‌ها =====
  const navItems = document.querySelectorAll('.nav-item');
  const categorySheet = $('categorySheet');
  const overlay = $('overlay');
  const closeSheetBtn = $('closeSheet');
  const lessonsPage = $('lessons-page');
  const sessionsPage = $('sessions-page');
  const favoritesPage = $('favorites-page');
  const mainContent = $('mainContent');
  const gradesWrapper = $('gradesWrapper');
  const sessionsList = $('sessionsList');
  const favoritesList = $('favoritesList');
  const sessionPageTitle = $('sessionPageTitle');
  const playerOverlay = $('playerOverlay');
  const videoPlayer = $('videoPlayer');
  const playerTitle = $('playerTitle');
  const closePlayer = $('closePlayer');
  const downloadsPage = $('downloads-page');
  const downloadsList = $('downloadsList');
  const articlesPage = $('articles-page');
  const articlesList = $('articlesList');
  const articleContentPage = $('article-content-page');
  const articleContentTitle = $('articleContentTitle');
  const articleContent = $('articleContent');

  const coursesPage = $('courses-page');
  const coursesWrapper = $('coursesWrapper');
  const courseDetailPage = $('course-detail-page');
  const courseDetailTitle = $('courseDetailTitle');
  const courseDetailWrapper = $('courseDetailWrapper');

  const searchPage = $('search-page');
  const searchInput = $('searchInput');
  const clearSearch = $('clearSearch');
  const searchTabs = $('searchTabs');
  const searchResults = $('searchResults');

  const bannersWrapper = $('bannersWrapper');

  let bannersData = [];
  let bannerIndex = 0;
  let bannerTimer = null;

  const playPauseBtn = $('playPauseBtn');
  const back10Btn = $('back10Btn');
  const forward10Btn = $('forward10Btn');
  const speedBtn = $('speedBtn');
  const sleepBtn = $('sleepBtn');
  const muteBtn = $('muteBtn');
  const pipBtn = $('pipBtn');
  const fullscreenBtn = $('fullscreenBtn');
  const progressWrap = $('progressWrap');
  const progressPlayed = $('progressPlayed');
  const progressBuffer = $('progressBuffer');
  const currentTimeEl = $('currentTime');
  const durationTimeEl = $('durationTime');
  const speedMenu = $('speedMenu');
  const playerToast = $('playerToast');
  const audioStage = $('audioStage');
  const audioArtwork = $('audioArtwork');

  // ===== مدیریت فول‌اسکرین و کنترل‌ها =====
  const playerContainer = $('playerContainer');
  const playerStageEl = $('playerStage');

  let controlsHideTimer = null;
  let controlsVisible = true;

  function isFullscreenActive() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function showPlayerControls() {
    if (!playerContainer) return;
    playerContainer.classList.remove('controls-hidden');
    controlsVisible = true;
    scheduleControlsHide();
  }

  function hidePlayerControls() {
    if (!playerContainer) return;
    playerContainer.classList.add('controls-hidden');
    controlsVisible = false;
  }

  function scheduleControlsHide() {
    if (controlsHideTimer) clearTimeout(controlsHideTimer);
    if (!isFullscreenActive()) return;
    controlsHideTimer = setTimeout(() => {
      if (isFullscreenActive() && activeMedia && !activeMedia.paused) {
        hidePlayerControls();
      }
    }, 3000);
  }

  function handleFullscreenChange() {
    if (isFullscreenActive()) {
      showPlayerControls();
    } else {
      if (controlsHideTimer) clearTimeout(controlsHideTimer);
      if (playerContainer) playerContainer.classList.remove('controls-hidden');
      controlsVisible = true;
    }
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

  if (playerStageEl) {
    playerStageEl.addEventListener('click', (e) => {
      if (!isFullscreenActive()) return;
      if (e.target.closest('.player-controls') || e.target.closest('.player-header')) return;

      if (controlsVisible) {
        hidePlayerControls();
      } else {
        showPlayerControls();
      }
    });
  }

  if (playerStageEl) {
    playerStageEl.addEventListener('mousemove', () => {
      if (isFullscreenActive() && !controlsVisible) {
        showPlayerControls();
      } else if (isFullscreenActive()) {
        scheduleControlsHide();
      }
    });
  }

  const audioPlayer = document.createElement('audio');
  audioPlayer.preload = 'metadata';
  audioPlayer.setAttribute('playsinline', '');
  audioPlayer.setAttribute('webkit-playsinline', '');
  audioPlayer.volume = 1;
  audioPlayer.muted = false;

  audioPlayer.style.cssText =
    'position:absolute;width:1px;height:1px;opacity:0;' +
    'pointer-events:none;left:-9999px;top:0;z-index:-1;';
  document.body.appendChild(audioPlayer);

  let lessonsData = {};
  let booksMap = {};
  let sleepTimer = null;
  let sleepMinutes = 0;
  let activeMedia = videoPlayer;
  let coursesData = [];
  let courseSessionsMap = {};
  let articlesData = [];

  let currentSearchTab = 'all';

  let currentActiveBlobUrl = null;

  // ===== LocalStorage =====
  const getFavorites = () => { try { return JSON.parse(localStorage.getItem('app_favorites')) || []; } catch (e) { return []; } };
  const saveFavorites = (f) => localStorage.setItem('app_favorites', JSON.stringify(f));
  const isFavorite = (link) => getFavorites().some(fav => fav.link === link);
  const getDownloads = () => { try { return JSON.parse(localStorage.getItem('app_downloads')) || []; } catch (e) { return []; } };
  const saveDownloads = (d) => localStorage.setItem('app_downloads', JSON.stringify(d));

  function addDownload(s) {
    const list = getDownloads();
    const existingIndex = list.findIndex(d => d.link === s.link);
    if (existingIndex > -1) {
      list[existingIndex] = s;
    } else {
      list.push(s);
    }
    saveDownloads(list);
  }

  // ===== دانلود فایل جلسه - نسخه نهایی برای WebView/Cordova =====
  async function downloadSessionFile(sessionData, btnEl) {
    if (!sessionData || !sessionData.link) {
      showToast('لینکی برای دانلود وجود ندارد');
      return;
    }

    // چک تکراری
    const existing = getDownloads().find(d => d.link === sessionData.link);
    if (existing && (existing.isStoredOffline || existing.userDownloaded)) {
      showToast('این فایل قبلاً دانلود شده است');
      return;
    }

    if (btnEl) {
      btnEl.disabled = true;
      btnEl.classList.add('downloading');
      btnEl.innerHTML = '<span class="material-symbols-outlined">progress_activity</span>';
    }

    const extMatch = sessionData.link.match(/\.([a-z0-9]+)(\?.*)?$/i);
    const ext = extMatch ? extMatch[1] : (isAudioFile(sessionData.link) ? 'mp3' : 'mp4');
    const safeName = (sessionData.title || 'فایل') + ' - ' +
                     (sessionData.number || '') + ' - ' +
                     (sessionData.topic || '');
    const filename = safeName.replace(/[\\/:*?"<>|]/g, '_') + '.' + ext;

    const url = sessionData.link;
    const isCordova = !!(window.cordova);
    let success = false;
    let storedOffline = false;

    console.log('[DL] starting:', url, '| cordova:', isCordova);

    // ============================================================
    // روش ۱: Cordova + File Plugin → ذخیره در پوشه Downloads گوشی
    // ============================================================
    if (isCordova && window.resolveLocalFileSystemURL) {
      try {
        console.log('[DL] trying Cordova File method...');
        const response = await fetch(url, { method: 'GET', cache: 'no-store' });
        console.log('[DL] fetch status:', response.status);

        if (response.ok) {
          const blob = await response.blob();
          console.log('[DL] blob size:', blob.size);

          if (blob.size > 0) {
            try {
              await saveFileToOfflineDB(sessionData.link, blob);
              storedOffline = true;
              console.log('[DL] saved to IndexedDB');
            } catch (e) {
              console.warn('[DL] IndexedDB failed:', e);
            }

            await new Promise((resolve, reject) => {
              const dirPath = cordova.file.externalRootDirectory + 'Download/';
              console.log('[DL] target dir:', dirPath);

              window.resolveLocalFileSystemURL(
                dirPath,
                (dirEntry) => {
                  dirEntry.getFile(filename, { create: true, exclusive: false },
                    (fileEntry) => {
                      fileEntry.createWriter((writer) => {
                        writer.onwriteend = () => {
                          console.log('[DL] ✅ saved:', fileEntry.toURL());
                          resolve();
                        };
                        writer.onerror = (e) => {
                          console.error('[DL] write error:', e);
                          reject(e);
                        };
                        writer.write(blob);
                      }, reject);
                    },
                    (err) => {
                      console.warn('[DL] getFile failed, trying dataDirectory:', err);
                      window.resolveLocalFileSystemURL(cordova.file.dataDirectory,
                        (dataDir) => {
                          dataDir.getFile(filename, { create: true }, (fe) => {
                            fe.createWriter((w) => {
                              w.onwriteend = () => { console.log('[DL] ✅ saved to app data'); resolve(); };
                              w.onerror = reject;
                              w.write(blob);
                            }, reject);
                          }, reject);
                        }, reject);
                    }
                  );
                },
                (err) => {
                  console.warn('[DL] resolve Downloads dir failed:', err);
                  reject(err);
                }
              );
            });

            success = true;
            console.log('[DL] ✅ Cordova File method succeeded');
          }
        }
      } catch (err) {
        console.warn('[DL] Cordova File method failed:', err.message || err);
      }
    }

    // ============================================================
    // روش ۲: مرورگر معمولی → blob + download
    // ============================================================
    if (!success && !isCordova) {
      try {
        console.log('[DL] trying browser blob method...');
        const response = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (response.ok) {
          const blob = await response.blob();
          if (blob.size > 0) {
            try {
              await saveFileToOfflineDB(sessionData.link, blob);
              storedOffline = true;
            } catch (e) {}

            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
            success = true;
            console.log('[DL] ✅ browser blob method succeeded');
          }
        }
      } catch (err) {
        console.warn('[DL] browser blob method failed:', err.message);
      }
    }

    // ============================================================
    // روش ۳: Fallback → باز کردن در مرورگر سیستم
    // ============================================================
    if (!success) {
      console.log('[DL] falling back to external browser...');
      try {
        if (isCordova && window.cordova.InAppBrowser) {
          cordova.InAppBrowser.open(url, '_system');
          success = true;
          showToast('در مرورگر باز شد - دانلود کنید');
        } else if (isCordova) {
          window.open(url, '_system');
          success = true;
          showToast('در مرورگر باز شد - دانلود کنید');
        } else {
          window.open(url, '_blank');
          success = true;
        }
      } catch (e) {
        console.error('[DL] fallback failed:', e);
      }
    }

    // ===== نتیجه نهایی =====
    if (success) {
      addDownload({
        link: sessionData.link,
        number: sessionData.number || '',
        topic: sessionData.topic || '',
        title: sessionData.title || '',
        img: sessionData.img || '',
        isStoredOffline: storedOffline,
        userDownloaded: true,
        downloadedAt: Date.now()
      });

      if (btnEl) {
        btnEl.classList.remove('downloading');
        btnEl.classList.add('downloaded');
        btnEl.disabled = false;
        btnEl.innerHTML = '<span class="material-symbols-outlined">check_circle</span>';
        btnEl.title = storedOffline ? 'دانلود شده - پخش آفلاین موجود' : 'دانلود شده';
      }
      showToast(storedOffline ? 'فایل در Downloads ذخیره شد' : 'دانلود انجام شد');
    } else {
      if (btnEl) {
        btnEl.classList.remove('downloading');
        btnEl.disabled = false;
        btnEl.innerHTML = '<span class="material-symbols-outlined">download</span>';
      }
      showToast('دانلود ناموفق بود');
    }
  }

  // ===== ذخیره و بازیابی آخرین جلسه دیده‌شده =====
  function saveLastSession(sessionData) {
    if (!sessionData || !sessionData.link) return;
    try {
      localStorage.setItem('last_session_data', JSON.stringify(sessionData));
      localStorage.setItem('last_session_time', Date.now().toString());
    } catch (e) {}
  }

  function getLastSession() {
    try {
      const raw = localStorage.getItem('last_session_data');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ===== ذخیره و بازیابی آخرین بازدیدها (دسترسی سریع) =====
  function saveLastVisited(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  function getLastVisited(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveLastVisitedLesson(sessionData) {
    if (!sessionData || !sessionData.link) return;
    saveLastVisited('last_visited_lesson', sessionData);
  }

  function saveLastVisitedCourse(course) {
    if (!course || !course.name) return;
    saveLastVisited('last_visited_course', course);
  }

  function saveLastVisitedArticle(articleData) {
    if (!articleData || !articleData.categoryTitle) return;
    saveLastVisited('last_visited_article', {
      categoryTitle: articleData.categoryTitle,
      items: (articleData.items || []).slice(0, 5),
      timestamp: Date.now()
    });
  }

  // ===== به‌روزرسانی کارت ادامه یادگیری =====
  function updateContinueLearningCard() {
    const card = document.getElementById('continueLearningCard');
    if (!card) return;

    const last = getLastSession();
    const titleEl = card.querySelector('.continue-title');
    const subEl = card.querySelector('.continue-sub');
    const progressTextEl = card.querySelector('.continue-progress-text');
    const progressFill = card.querySelector('.progress-bar-fill');

    if (!last) {
      if (titleEl) titleEl.textContent = 'شروع یادگیری';
      if (subEl) subEl.textContent = 'برای شروع، درسی را انتخاب کنید';
      if (progressTextEl) progressTextEl.textContent = '۰٪';
      if (progressFill) progressFill.style.width = '0%';
      return;
    }

    const fullTitle = last.title
      ? (last.number ? last.number + ' - ' + last.topic + ' (' + last.title + ')' : last.number + ' - ' + last.topic)
      : (last.number ? last.number + ' - ' + last.topic : 'آخرین درس');

    if (titleEl) titleEl.textContent = fullTitle;

    let progressPct = 0;
    let remainingText = 'ادامه دهید';
    try {
      const savedTime = parseFloat(localStorage.getItem('playback_' + last.link) || '0');
      const estimatedTotal = 30 * 60;
      if (savedTime > 0 && estimatedTotal > 0) {
        progressPct = Math.min(99, Math.round((savedTime / estimatedTotal) * 100));
        const remainSec = Math.max(0, estimatedTotal - savedTime);
        const remainMin = Math.ceil(remainSec / 60);
        remainingText = 'زمان باقی‌مانده: ' + remainMin + ' دقیقه';
      } else {
        remainingText = 'آماده پخش';
      }
    } catch (e) {}

    if (subEl) subEl.textContent = remainingText;
    if (progressTextEl) progressTextEl.textContent = progressPct + '٪';
    if (progressFill) progressFill.style.width = progressPct + '%';
  }

  // ===== تابع ادامه یادگیری =====
  function resumeLastLesson() {
    console.log("پخش آخرین درس انجام شد.");
    const last = getLastSession();
    if (!last || !last.link) {
      if (typeof showToast === 'function') {
        showToast('هنوز درسی پخش نکرده‌اید');
      }
      navigateTo('lessons');
      return;
    }
    navigateTo('player', { sessionData: last });
  }

  // ===== ناوبری با History API =====
  function updateView(state) {
    const view = (state && state.view) || 'home';
    const params = (state && state.params) || {};

    if (view === 'sheet') {
      categorySheet.classList.add('show');
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
      return;
    }

    categorySheet.classList.remove('show');
    overlay.classList.remove('show');
    document.body.style.overflow = '';

    document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
    mainContent.classList.add('hidden');
    playerOverlay.classList.remove('show');
    navItems.forEach(n => n.classList.remove('active'));

    if (view !== 'player') {
      if (videoPlayer.src) { videoPlayer.pause(); videoPlayer.removeAttribute('src'); videoPlayer.load(); }
      if (audioPlayer.src) { audioPlayer.pause(); audioPlayer.removeAttribute('src'); audioPlayer.load(); }
      if (currentActiveBlobUrl) {
        URL.revokeObjectURL(currentActiveBlobUrl);
        currentActiveBlobUrl = null;
      }
    }

    if (view !== 'home' && typeof stopBannerTimer === 'function') {
      stopBannerTimer();
    }

    switch (view) {
      case 'home': {
        mainContent.classList.remove('hidden');
        const h = document.querySelector('[data-page="home"]');
        if (h) h.classList.add('active');
        loadBannersFromSheet();
        updateContinueLearningCard();
        if (typeof startBannerTimer === 'function') startBannerTimer();
        break;
      }
      case 'lessons': {
        lessonsPage.classList.add('active');
        const c = document.querySelector('[data-page="categories"]');
        if (c) c.classList.add('active');
        if (Object.keys(lessonsData).length === 0) loadLessonsFromSheet();
        else renderLessons();
        break;
      }
      case 'sessions': {
        sessionsPage.classList.add('active');
        if (params.book) renderSessions(params.book);
        break;
      }
      case 'favorites': {
        favoritesPage.classList.add('active');
        const f = document.querySelector('[data-page="favorites"]');
        if (f) f.classList.add('active');
        renderFavorites();
        break;
      }
      case 'downloads': {
        downloadsPage.classList.add('active');
        const d = document.querySelector('[data-page="downloads"]');
        if (d) d.classList.add('active');
        renderDownloads();
        break;
      }
      case 'articles': {
        articlesPage.classList.add('active');
        const a = document.querySelector('[data-page="categories"]');
        if (a) a.classList.add('active');
        loadArticlesFromSheet();
        break;
      }
      case 'articleContent': {
        articleContentPage.classList.add('active');
        if (params.categoryTitle) renderDynamicArticleContent(params.categoryTitle, params.items || []);
        break;
      }
      case 'courses': {
        coursesPage.classList.add('active');
        const c = document.querySelector('[data-page="categories"]');
        if (c) c.classList.add('active');
        if (coursesData.length === 0) loadCoursesFromSheet();
        else renderCourses();
        break;
      }
      case 'courseDetail': {
        courseDetailPage.classList.add('active');
        if (params.course) renderCourseDetail(params.course);
        break;
      }
      case 'search': {
        searchPage.classList.add('active');
        const s = document.querySelector('[data-page="search"]');
        if (s) s.classList.add('active');
        preloadSearchData();
        if (searchInput) searchInput.focus();
        break;
      }
      case 'player': {
        playerOverlay.classList.add('show');
        if (params.sessionData) openPlayer(params.sessionData);
        break;
      }
    }
  }

  function navigateTo(view, params, replace) {
    params = params || {};
    const state = { view: view, params: params };
    updateView(state);
    if (replace) {
      history.replaceState(state, '');
    } else {
      history.pushState(state, '');
    }
  }

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view) {
      updateView(e.state);
    } else {
      const homeState = { view: 'home', params: {} };
      history.pushState(homeState, '');
      updateView(homeState);
    }
  });

  // ===== پلیر =====
  function isAudioFile(link) {
    if (!link) return false;
    const url = String(link).trim();
    const path = url.split('#')[0].split('?')[0].toLowerCase();
    const extMatch = path.match(/\.([a-z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : '';

    const audioExts = [
      'mp3','m4a','m4b','wav','ogg','oga','aac','flac',
      'opus','weba','aif','aiff','wma','caf','amr','3gp','3gpp'
    ];
    if (audioExts.includes(ext)) return true;
    if (/[?&](mime|type|format)=audio(%2F|\/)/i.test(url)) return true;

    return false;
  }

  async function openPlayer(sessionData) {
    if (!sessionData || !sessionData.link) return;

    playerTitle.textContent = (sessionData.number || '') + ' - ' + (sessionData.topic || '');
    playerOverlay.dataset.link = sessionData.link;
    playerOverlay.dataset.number = sessionData.number || '';
    playerOverlay.dataset.topic = sessionData.topic || '';
    playerOverlay.dataset.title = sessionData.title || '';
    playerOverlay.dataset.img = sessionData.img || '';

    saveLastSession(sessionData);
    saveLastVisitedLesson(sessionData);

    videoPlayer.pause();
    audioPlayer.pause();
    videoPlayer.removeAttribute('src');
    audioPlayer.removeAttribute('src');
    videoPlayer.load();
    audioPlayer.load();

    if (currentActiveBlobUrl) {
      URL.revokeObjectURL(currentActiveBlobUrl);
      currentActiveBlobUrl = null;
    }

    videoPlayer.muted = false;
    audioPlayer.muted = false;
    videoPlayer.volume = 1;
    audioPlayer.volume = 1;

    let mediaSrc = sessionData.link;
    const offlineBlob = await getFileFromOfflineDB(sessionData.link);
    if (offlineBlob) {
      currentActiveBlobUrl = URL.createObjectURL(offlineBlob);
      mediaSrc = currentActiveBlobUrl;
    }

    const isAudio = isAudioFile(sessionData.link);

    if (isAudio) {
      videoPlayer.style.display = 'none';
      audioStage.style.display = 'flex';
      audioArtwork.src = sessionData.img || 'images/default.gif';
      audioArtwork.onerror = function () { this.src = 'images/default.gif'; };
      audioPlayer.src = mediaSrc;
      activeMedia = audioPlayer;
    } else {
      videoPlayer.style.display = 'block';
      audioStage.style.display = 'none';
      videoPlayer.src = mediaSrc;
      activeMedia = videoPlayer;
    }

    const saved = localStorage.getItem('playback_' + sessionData.link);
    if (saved) {
      const t = parseFloat(saved);
      if (!isNaN(t)) {
        const restore = () => {
          try { activeMedia.currentTime = t; } catch (e) {}
          activeMedia.removeEventListener('loadedmetadata', restore);
        };
        activeMedia.addEventListener('loadedmetadata', restore);
      }
    }

    activeMedia.playbackRate = 1;
    if (speedBtn) speedBtn.textContent = '۱×';

    activeMedia.load();

    const tryPlay = () => {
      const p = activeMedia.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('پخش خودکار مسدود شد:', err);
          const retry = () => {
            activeMedia.play().catch(() => {});
            document.removeEventListener('click', retry);
            document.removeEventListener('touchstart', retry);
          };
          document.addEventListener('click', retry, { once: true });
          document.addEventListener('touchstart', retry, { once: true });
        });
      }
    };
    tryPlay();

    updatePlayPauseIcon();
    updateProgress();
  }

  function updatePlayPauseIcon() {
    if (!playPauseBtn) return;
    const icon = playPauseBtn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = activeMedia.paused ? 'play_arrow' : 'pause';
  }

  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) return '۰۰:۰۰';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const pad = (n) => String(n).padStart(2, '0');
    return pad(m) + ':' + pad(s);
  }

  function updateProgress() {
    if (!activeMedia || !activeMedia.duration || isNaN(activeMedia.duration)) return;
    const pct = (activeMedia.currentTime / activeMedia.duration) * 100;
    if (progressPlayed) progressPlayed.style.width = pct + '%';
    if (currentTimeEl) currentTimeEl.textContent = formatTime(activeMedia.currentTime);
    if (durationTimeEl) durationTimeEl.textContent = formatTime(activeMedia.duration);

    if (activeMedia.buffered && activeMedia.buffered.length > 0) {
      try {
        const bufferedEnd = activeMedia.buffered.end(activeMedia.buffered.length - 1);
        const bufPct = (bufferedEnd / activeMedia.duration) * 100;
        if (progressBuffer) progressBuffer.style.width = bufPct + '%';
      } catch (e) {}
    }
  }

  function showToast(msg) {
    if (!playerToast) return;
    playerToast.textContent = msg;
    playerToast.classList.add('show');
    clearTimeout(playerToast._t);
    playerToast._t = setTimeout(() => playerToast.classList.remove('show'), 2000);
  }

  [videoPlayer, audioPlayer].forEach(media => {
    media.addEventListener('timeupdate', () => {
      if (media !== activeMedia) return;
      updateProgress();
      if (media.currentTime > 0 && Math.floor(media.currentTime) % 5 === 0) {
        const linkKey = playerOverlay.dataset.link;
        if (linkKey) localStorage.setItem('playback_' + linkKey, media.currentTime);
      }
    });
    media.addEventListener('loadedmetadata', () => {
      if (media !== activeMedia) return;
      if (durationTimeEl) durationTimeEl.textContent = formatTime(media.duration);
      updateProgress();
    });
    media.addEventListener('play', () => {
      if (media === activeMedia) updatePlayPauseIcon();
      if (media === activeMedia && isFullscreenActive()) {
        scheduleControlsHide();
      }
    });
    media.addEventListener('pause', () => {
      if (media === activeMedia) updatePlayPauseIcon();
      if (media === activeMedia && isFullscreenActive()) {
        if (controlsHideTimer) clearTimeout(controlsHideTimer);
        showPlayerControls();
      }
    });
    media.addEventListener('ended', () => { if (media === activeMedia) updatePlayPauseIcon(); });
    media.addEventListener('error', () => {
      if (media !== activeMedia) return;
      showToast('خطا در پخش فایل');
    });
  });

  if (playPauseBtn) playPauseBtn.addEventListener('click', () => {
    if (activeMedia.paused) activeMedia.play().catch(() => {});
    else activeMedia.pause();
  });
  if (back10Btn) back10Btn.addEventListener('click', () => {
    activeMedia.currentTime = Math.max(0, activeMedia.currentTime - 10);
  });
  if (forward10Btn) forward10Btn.addEventListener('click', () => {
    if (activeMedia.duration) activeMedia.currentTime = Math.min(activeMedia.duration, activeMedia.currentTime + 10);
  });

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  if (speedMenu) {
    speeds.forEach(sp => {
      const b = document.createElement('button');
      b.textContent = sp + '×';
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        activeMedia.playbackRate = sp;
        if (speedBtn) speedBtn.textContent = sp + '×';
        speedMenu.classList.remove('show');
      });
      speedMenu.appendChild(b);
    });
  }
  if (speedBtn) speedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (speedMenu) speedMenu.classList.toggle('show');
  });
  document.addEventListener('click', () => { if (speedMenu) speedMenu.classList.remove('show'); });

  if (sleepBtn) sleepBtn.addEventListener('click', () => {
    if (sleepTimer) {
      clearTimeout(sleepTimer);
      sleepTimer = null;
      sleepMinutes = 0;
      sleepBtn.innerHTML = '<span class="material-symbols-outlined">bedtime</span>';
      showToast('تایمر خواب لغو شد');
      return;
    }
    sleepMinutes = (sleepMinutes + 15) % 60;
    if (sleepMinutes === 0) sleepMinutes = 15;
    sleepBtn.innerHTML = '<span class="material-symbols-outlined">bedtime</span> ' + sleepMinutes + 'د';
    sleepTimer = setTimeout(() => {
      activeMedia.pause();
      sleepTimer = null;
      sleepMinutes = 0;
      sleepBtn.innerHTML = '<span class="material-symbols-outlined">bedtime</span>';
      showToast('تایمر خواب فعال شد');
    }, sleepMinutes * 60 * 1000);
    showToast('تایمر خواب برای ' + sleepMinutes + ' دقیقه تنظیم شد');
  });

  if (muteBtn) muteBtn.addEventListener('click', () => {
    activeMedia.muted = !activeMedia.muted;
    const ic = muteBtn.querySelector('.material-symbols-outlined');
    if (ic) ic.textContent = activeMedia.muted ? 'volume_off' : 'volume_up';
  });

  if (pipBtn) pipBtn.addEventListener('click', async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (activeMedia.requestPictureInPicture) await activeMedia.requestPictureInPicture();
      else showToast('تصویر در تصویر پشتیبانی نمی‌شود');
    } catch (err) { showToast('تصویر در تصویر پشتیبانی نمی‌شود'); }
  });

  if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => {
    const container = playerOverlay.querySelector('.player-container');
    const isAudio = isAudioFile(playerOverlay.dataset.link);

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          if (videoPlayer.webkitEnterFullscreen) videoPlayer.webkitEnterFullscreen();
        });
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (videoPlayer.webkitEnterFullscreen) {
        videoPlayer.webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  });

  if (progressWrap) {
    let isSeeking = false;

    ['mousedown', 'touchstart'].forEach(evt => {
      progressWrap.addEventListener(evt, (e) => {
        isSeeking = true;
        updateSeekPosition(e);
      });
    });

    ['mousemove', 'touchmove'].forEach(evt => {
      document.addEventListener(evt, (e) => {
        if (!isSeeking) return;
        updateSeekPosition(e);
      });
    });

    ['mouseup', 'touchend'].forEach(evt => {
      document.addEventListener(evt, (e) => {
        if (!isSeeking) return;
        isSeeking = false;
        updateSeekPosition(e, true);
      });
    });

    function updateSeekPosition(e, applyJump = false) {
      const rect = progressWrap.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clickX = clientX - rect.left;
      let pct = clickX / rect.width;
      pct = Math.max(0, Math.min(1, pct));
      if (progressPlayed) progressPlayed.style.width = (pct * 100) + '%';
      if (applyJump && activeMedia && activeMedia.duration) {
        activeMedia.currentTime = pct * activeMedia.duration;
      }
    }
  }

  if (closePlayer) closePlayer.addEventListener('click', () => history.back());

  // ===== دریافت داده با تلاش مستقیم و پراکسی CORS =====
  async function fetchSheetData(url) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        redirect: 'follow'
      });
      if (res.ok) {
        const text = await res.text();
        return JSON.parse(text.replace(/^\uFEFF/, '').trim());
      }
      console.warn('Direct fetch status:', res.status);
    } catch (err) {
      console.warn('Direct fetch failed:', err.message);
    }

    const proxies = [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent(url),
      'https://corsproxy.io/?' + encodeURIComponent(url),
      'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url)
    ];

    for (const proxyUrl of proxies) {
      try {
        const res = await fetch(proxyUrl, { cache: 'no-store' });
        if (!res.ok) continue;
        const text = await res.text();
        const cleaned = text.replace(/^\uFEFF/, '').trim();
        if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
          return JSON.parse(cleaned);
        }
      } catch (err) {
        console.warn('Proxy failed:', proxyUrl, err.message);
      }
    }

    throw new Error('همه تلاش‌ها برای دریافت داده شکست خورد');
  }

  // ===== بارگذاری دروس =====
  async function loadLessonsFromSheet() {
    gradesWrapper.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">در حال بارگذاری دروس...</p>';
    try {
      const data = await fetchSheetData(LESSONS_API_URL);
      if (!Array.isArray(data)) throw new Error('پاسخ نامعتبر: آرایه نیست');

      lessonsData = {};
      booksMap = {};

      data.forEach(row => {
        const cleanRow = {};
        Object.keys(row).forEach(k => { cleanRow[k.trim()] = row[k]; });

        const grade = cleanRow['پایه'] ? String(cleanRow['پایه']).trim() : '';
        const lessonTitle = cleanRow['عنوان درس'] ? String(cleanRow['عنوان درس']).trim() : '';
        if (!grade || !lessonTitle) return;

        if (!lessonsData[grade]) lessonsData[grade] = [];

        let book = lessonsData[grade].find(b => b.title === lessonTitle);
        if (!book) {
          book = { title: lessonTitle, img: cleanRow['تصویر درس'] || 'images/default.gif', sessions: [] };
          lessonsData[grade].push(book);
          booksMap[lessonTitle] = book;
        }

        const sessionNum = cleanRow['شماره جلسه'] ? String(cleanRow['شماره جلسه']).trim() : '';
        const sessionTopic = cleanRow['موضوع جلسه'] ? String(cleanRow['موضوع جلسه']).trim() : '';
        const sessionLink = cleanRow['لینک ویدیو'] ? String(cleanRow['لینک ویدیو']).trim() : '';

        if (sessionNum && sessionLink) {
          book.sessions.push({ number: 'جلسه ' + sessionNum, topic: sessionTopic, link: sessionLink });
        }
      });

      if (Object.keys(lessonsData).length === 0) {
        gradesWrapper.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">داده‌ای از سرور دریافت نشد.</p>';
        return;
      }

      renderLessons();
    } catch (error) {
      console.error('خطا در دریافت دروس:', error);
      gradesWrapper.innerHTML = '<p style="text-align:center; color:#f44336; padding:20px;">⚠️ اتصال به سرور دروس برقرار نشد.<br><small style="font-size:11px;color:#999;">' + (error.message || '') + '</small></p>';
    }
  }

  function renderLessons() {
    gradesWrapper.innerHTML = '';
    Object.keys(lessonsData).forEach(grade => {
      const books = lessonsData[grade];
      const section = document.createElement('div');
      section.className = 'grade-section';

      let booksHtml = '';
      books.forEach(book => {
        booksHtml += '<div class="book-card" data-book-title="' + book.title + '">' +
          '<img src="' + book.img + '" alt="' + book.title + '" onerror="this.onerror=null; this.src=\'https://via.placeholder.com/100x140/ddd/666?text=بدون+عکس\';">' +
          '<div class="book-title">' + book.title + '</div>' +
          '</div>';
      });

      section.innerHTML = '<div class="grade-title">' + grade + '</div>' +
        '<div class="books-scroll">' + booksHtml + '</div>';
      gradesWrapper.appendChild(section);
    });
  }

  function renderSessions(book) {
    if (!book) return;
    sessionPageTitle.textContent = book.title;
    sessionsList.innerHTML = '';

    if (book.sessions && book.sessions.length > 0) {
      const downloads = getDownloads();

      book.sessions.forEach(session => {
        const favStatus = isFavorite(session.link);
        const isDownloaded = downloads.some(d => d.link === session.link && (d.isStoredOffline || d.userDownloaded));

        const card = document.createElement('div');
        card.className = 'session-card';
        card.innerHTML =
          '<div class="session-card-top">' +
            '<div class="session-card-info">' +
              '<h4 class="session-card-title">' + session.number + ' - ' + session.topic + '</h4>' +
              '<div class="session-card-actions">' +
                '<div class="stat-item favorite-btn">' +
                  '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' ' + (favStatus ? 1 : 0) + '; ' + (favStatus ? 'color: #e91e63;' : '') + '">favorite</span>' +
                '</div>' +
                '<button type="button" class="download-btn-session' + (isDownloaded ? ' downloaded' : '') + '" title="' + (isDownloaded ? 'دانلود شده' : 'دانلود برای استفاده آفلاین') + '">' +
                  '<span class="material-symbols-outlined">' + (isDownloaded ? 'check_circle' : 'download') + '</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
            '<img class="session-card-image" src="' + book.img + '" alt="' + book.title + '" onerror="this.onerror=null; this.src=\'https://via.placeholder.com/80x110/ddd/666?text=کتاب\';">' +
          '</div>';

        const favBtn = card.querySelector('.favorite-btn');
        const dlBtn = card.querySelector('.download-btn-session');

        favBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          toggleFavorite({
            link: session.link, title: book.title, topic: session.topic,
            number: session.number, img: book.img
          }, favBtn.querySelector('.material-symbols-outlined'));
        }, true);

        dlBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          if (dlBtn.classList.contains('downloaded')) {
            showToast('این فایل قبلاً دانلود شده است');
            return;
          }

          downloadSessionFile({
            link: session.link,
            number: session.number,
            topic: session.topic,
            title: book.title,
            img: book.img
          }, dlBtn);
        }, true);

        card.addEventListener('click', (e) => {
          if (e.target.closest('.download-btn-session')) return;
          if (e.target.closest('.favorite-btn')) return;

          navigateTo('player', {
            sessionData: { link: session.link, number: session.number, topic: session.topic, title: book.title, img: book.img }
          });
        });

        sessionsList.appendChild(card);
      });
    } else {
      sessionsList.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">هنوز جلسه‌ای برای این درس ثبت نشده است.</p>';
    }
  }

  function toggleFavorite(sessionData, iconEl) {
    let favs = getFavorites();
    const idx = favs.findIndex(f => f.link === sessionData.link);
    if (idx > -1) {
      favs.splice(idx, 1);
      if (iconEl) {
        iconEl.style.fontVariationSettings = "'FILL' 0";
        iconEl.style.color = '';
      }
    } else {
      favs.push(sessionData);
      if (iconEl) {
        iconEl.style.fontVariationSettings = "'FILL' 1";
        iconEl.style.color = '#e91e63';
      }
    }
    saveFavorites(favs);
  }

  function renderFavorites() {
    favoritesList.innerHTML = '';
    const favs = getFavorites();
    if (favs.length === 0) {
      favoritesList.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">لیست علاقمندی‌های شما خالی است.</p>';
      return;
    }
    favs.forEach(fav => {
      const card = document.createElement('div');
      card.className = 'session-card';
      card.innerHTML = '<div class="session-card-top">' +
        '<div class="session-card-info">' +
        '<h4 class="session-card-title">' + fav.number + ' - ' + fav.topic + '</h4>' +
        '<div class="stat-item favorite-btn active-fav">' +
        '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1; color: #e91e63;">favorite</span>' +
        '</div>' +
        '</div>' +
        '<img class="session-card-image" src="' + fav.img + '" alt="' + fav.title + '" onerror="this.onerror=null; this.src=\'https://via.placeholder.com/80x110/ddd/666?text=کتاب\';">' +
        '</div>';

      card.addEventListener('click', () => {
        navigateTo('player', { sessionData: fav });
      });

      const favBtn = card.querySelector('.favorite-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        saveFavorites(getFavorites().filter(f => f.link !== fav.link));
        renderFavorites();
      });

      favoritesList.appendChild(card);
    });
  }

  // ===== حذف یک آیتم از دانلودها و دیتابیس =====
  async function removeDownload(link) {
    const downloads = getDownloads();
    const filtered = downloads.filter(d => d.link !== link);
    saveDownloads(filtered);
    await deleteFileFromOfflineDB(link);
  }

  // ===== حذف همه دانلودها و دیتابیس =====
  async function clearAllDownloads() {
    const downloads = getDownloads();
    if (downloads.length === 0) return;

    for (const item of downloads) {
      await deleteFileFromOfflineDB(item.link);
    }

    saveDownloads([]);
    renderDownloads();
    showToast('همه دانلودها پاک شدند');
  }

  function renderDownloads() {
    downloadsList.innerHTML = '';
    const downloads = getDownloads();
    if (downloads.length === 0) {
      downloadsList.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">لیست دانلودهای شما خالی است.</p>';
      return;
    }

    const header = document.createElement('div');
    header.className = 'downloads-header';
    header.innerHTML =
      '<span class="downloads-count">' + downloads.length + ' مورد دانلود شده</span>' +
      '<button class="clear-all-btn" id="clearAllDownloads">' +
      '<span class="material-symbols-outlined">delete_sweep</span>' +
      'حذف همه' +
      '</button>';
    downloadsList.appendChild(header);

    header.querySelector('#clearAllDownloads').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('آیا از حذف همه دانلودها مطمئن هستید؟')) {
        await clearAllDownloads();
      }
    });

    downloads.forEach(dl => {
      const card = document.createElement('div');
      card.className = 'session-card download-card';
      card.innerHTML =
        '<div class="session-card-top">' +
          '<div class="session-card-info">' +
            '<h4 class="session-card-title">' + dl.number + ' - ' + dl.topic + '</h4>' +
            '<div class="download-info">' +
              '<span class="download-book-title">' + dl.title + '</span>' +
            '</div>' +
            '<div class="download-card-actions">' +
              '<div class="stat-item play-btn" title="پخش">' +
                '<span class="material-symbols-outlined">play_circle</span>' +
              '</div>' +
              '<button class="delete-download-btn" title="حذف از لیست">' +
                '<span class="material-symbols-outlined">delete</span>' +
                'حذف' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<img class="session-card-image" src="' + dl.img + '" alt="' + dl.title + '" ' +
            'onerror="this.onerror=null; this.src=\'https://via.placeholder.com/80x110/ddd/666?text=کتاب\';">' +
        '</div>';

      card.addEventListener('click', (e) => {
        if (e.target.closest('.delete-download-btn')) return;
        navigateTo('player', { sessionData: dl });
      });

      const delBtn = card.querySelector('.delete-download-btn');
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('این مورد از لیست دانلودها حذف شود؟')) {
          await removeDownload(dl.link);
          card.style.transition = 'opacity 0.25s, transform 0.25s';
          card.style.opacity = '0';
          card.style.transform = 'translateX(-30px)';
          setTimeout(() => {
            renderDownloads();
            showToast('از لیست دانلودها حذف شد');
          }, 250);
        }
      });

      downloadsList.appendChild(card);
    });
  }

  // ===== مقالات =====
  function normalizeText(text) {
    if (!text) return '';
    return String(text).replace(/ي/g, 'ی').replace(/ك/g, 'ک')
      .replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function getCategoryIcon(categoryName) {
    const name = normalizeText(categoryName);
    if (/زبان|لسان|گفتار|سخن|غیبت|تهمت|دروغ/.test(name)) return 'record_voice_over';
    if (/قلب|قلبی|درون|حسد|تکبر|عجب|ریا|کینه/.test(name)) return 'favorite';
    if (/جنس|شهوت|نگاه|حجاب|ازدواج|طلاق|زنا/.test(name)) return 'warning';
    if (/مال|اقتصاد|تجارت|کسب|ربا|رشوه|دزدی|دولت|خرید|فروش/.test(name)) return 'payments';
    if (/احکام|فقه|حلال|حرام|طهارت|نجاست|تقلید|اجتهاد/.test(name)) return 'gavel';
    if (/عقاید|اعتقاد|کلام|توحید|نبوت|امامت|معاد|تفسیر/.test(name)) return 'psychology';
    if (/اخلاق|رذائل|فضائل|سیرت|سلوک|معنویت|عرفان/.test(name)) return 'auto_stories';
    if (/قرآن|سوره|آیه|وحی|تدبر/.test(name)) return 'menu_book';
    if (/حدیث|روایت|سنت|نهج|صحیفه|اهل بیت|معصوم/.test(name)) return 'library_books';
    if (/نماز|صلات|عبادت|اذان|سجده/.test(name)) return 'schedule';
    if (/روزه|صوم|رمضان|اعتکاف/.test(name)) return 'nights_stay';
    if (/حج|عمره|زیارت|کعبه|مشهد|مدینه/.test(name)) return 'mosque';
    if (/دعا|نیایش|مناجات|ذکر|تسبیح|استغفار/.test(name)) return 'self_improvement';
    if (/خانواده|فرزند|تربیت|والدین|همسر|زناشویی/.test(name)) return 'family_restroom';
    if (/تاریخ|سیره|زندگانی|صحابه|امیر/.test(name)) return 'history_edu';
    if (/اجتماع|سیاسی|حکومت|جامعه|ولایت/.test(name)) return 'groups';
    if (/علم|دانش|فلسفه|منطق|عقل/.test(name)) return 'science';
    if (/سلامت|پزشک|درمان|بهداشت|طب/.test(name)) return 'health_and_safety';
    if (/زندگی|سبک|رفتار|آداب|مهارت/.test(name)) return 'lightbulb';
    return 'article';
  }

  async function loadArticlesFromSheet() {
    articlesList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">در حال بارگذاری مقالات...</p>';
    try {
      const data = await fetchSheetData(ARTICLES_API_URL);
      if (!Array.isArray(data)) throw new Error('پاسخ نامعتبر: آرایه نیست');

      articlesData = data;
      articlesList.innerHTML = '';
      if (data.length === 0) {
        articlesList.innerHTML = '<p style="text-align:center; padding:20px;">مقاله‌ای یافت نشد.</p>';
        return;
      }

      const grouped = {};
      const displayNames = {};
      data.forEach(item => {
        const key = normalizeText(item.category);
        if (!key) return;
        if (!grouped[key]) { grouped[key] = []; displayNames[key] = key; }
        grouped[key].push(item);
      });

      Object.keys(grouped).forEach(key => {
        const items = grouped[key];
        const iconName = getCategoryIcon(key);
        const card = document.createElement('div');
        card.className = 'article-category-card';
        card.innerHTML = '<div class="article-category-icon" style="background:#e0f2f1; color:#00796b;">' +
          '<span class="material-symbols-outlined">' + iconName + '</span>' +
          '</div>' +
          '<div class="article-category-text">' +
          '<h4>' + displayNames[key] + '</h4>' +
          '<span>' + items.length + ' موضوع</span>' +
          '</div>' +
          '<span class="material-symbols-outlined arrow">chevron_left</span>';

        card.addEventListener('click', () => {
          navigateTo('articleContent', { categoryTitle: displayNames[key], items: items });
        });

        articlesList.appendChild(card);
      });
    } catch (error) {
      console.error('خطا در دریافت مقالات:', error);
      articlesList.innerHTML = '<p style="text-align:center; color:#f44336; padding:20px;">⚠️ اتصال به سرور مقالات برقرار نشد.<br><small style="font-size:11px;color:#999;">' + (error.message || '') + '</small></p>';
    }
  }

  function renderDynamicArticleContent(categoryTitle, items) {
    articleContentTitle.textContent = categoryTitle;
    articleContent.innerHTML = '';
    items.forEach((item, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'article-item';
      itemEl.innerHTML = '<div class="article-item-number" style="background:#00796b;">' + (index + 1) + '</div>' +
        '<div class="article-item-text">' +
        '<h4><a href="' + (item.link || '#') + '" target="_blank" style="text-decoration:none; color:inherit;">' + item.title + '</a></h4>' +
        '<p>برای مطالعه کلیک کنید</p>' +
        '</div>';
      articleContent.appendChild(itemEl);
    });

    saveLastVisitedArticle({ categoryTitle: categoryTitle, items: items });
  }

  // ===== توابع دوره‌ها =====
  function parseCoursesFromRaw(data) {
    coursesData = data.map(row => {
      const clean = {};
      Object.keys(row).forEach(k => { clean[k.trim()] = row[k]; });
      return {
        name: (clean['نام دوره'] || '').toString().trim(),
        description: (clean['توضیحات دوره'] || '').toString().trim(),
        sessionsCount: (clean['تعداد جلسات'] || '').toString().trim(),
        format: (clean['فرمت آموزش‌ها'] || '').toString().trim(),
        compatibleWith: (clean['قابل اجرا بر روی'] || '').toString().trim(),
        requiredEquipment: (clean['وسیله مورد نیاز'] || '').toString().trim(),
        audience: (clean['مخاطب'] || '').toString().trim(),
        image: (clean['آدرس عکس دوره'] || '').toString().trim()
      };
    }).filter(c => c.name);
  }

  function parseCourseSessionsFromRaw(data) {
    courseSessionsMap = {};
    data.forEach(row => {
      const clean = {};
      Object.keys(row).forEach(k => { clean[k.trim()] = row[k]; });
      const courseName = (clean['نام دوره'] || '').toString().trim();
      if (!courseName) return;
      if (!courseSessionsMap[courseName]) courseSessionsMap[courseName] = [];
      const num = (clean['شماره جلسه'] || '').toString().trim();
      const topic = (clean['موضوع جلسه'] || '').toString().trim();
      const link = (clean['لینک ویدیو'] || '').toString().trim();
      if (num && link) {
        courseSessionsMap[courseName].push({
          number: 'جلسه ' + num,
          topic: topic,
          link: link
        });
      }
    });
  }

  async function loadCoursesFromSheet() {
    coursesWrapper.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">در حال بارگذاری دوره‌ها...</p>';
    try {
      const data = await fetchSheetData(COURSES_API_URL);
      if (!Array.isArray(data)) throw new Error('پاسخ نامعتبر: آرایه نیست');
      parseCoursesFromRaw(data);

      if (COURSE_SESSIONS_API_URL) {
        try {
          const sdata = await fetchSheetData(COURSE_SESSIONS_API_URL);
          if (Array.isArray(sdata)) parseCourseSessionsFromRaw(sdata);
        } catch (e) { console.warn('جلسات دوره بارگذاری نشد:', e); }
      }

      if (coursesData.length === 0) {
        coursesWrapper.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">دوره‌ای یافت نشد.</p>';
        return;
      }
      renderCourses();
    } catch (error) {
      console.error('خطا در دریافت دوره‌ها:', error);
      coursesWrapper.innerHTML = '<p style="text-align:center; color:#f44336; padding:20px;">⚠️ اتصال به سرور دوره‌ها برقرار نشد.<br><small style="font-size:11px;color:#999;">' + (error.message || '') + '</small></p>';
    }
  }

  function renderCourses() {
    coursesWrapper.innerHTML = '';
    coursesData.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      const img = course.image || 'https://via.placeholder.com/100x130/ddd/666?text=دوره';
      card.innerHTML =
        '<img class="course-card-image" src="' + img + '" alt="' + course.name + '" ' +
          'onerror="this.onerror=null;this.src=\'https://via.placeholder.com/100x130/ddd/666?text=دوره\';">' +
        '<div class="course-card-info">' +
          '<h3 class="course-card-title">' + course.name + '</h3>' +
          '<p class="course-card-desc">' + (course.description || '') + '</p>' +
          '<div class="course-card-meta">' +
            (course.sessionsCount
              ? '<span class="course-meta-badge"><span class="material-symbols-outlined">playlist_play</span>' + course.sessionsCount + '</span>'
              : '') +
            (course.audience
              ? '<span class="course-meta-badge"><span class="material-symbols-outlined">group</span>' + course.audience + '</span>'
              : '') +
          '</div>' +
        '</div>';
      card.addEventListener('click', () => {
        navigateTo('courseDetail', { course: course });
      });
      coursesWrapper.appendChild(card);
    });
  }

  function renderCourseDetail(course) {
    if (!course) return;
    courseDetailTitle.textContent = course.name;
    courseDetailWrapper.innerHTML = '';

    saveLastVisitedCourse(course);

    const img = course.image || 'https://via.placeholder.com/110x145/ddd/666?text=دوره';

    const header = document.createElement('div');
    header.className = 'course-detail-header';
    header.innerHTML =
      '<img class="course-detail-image" src="' + img + '" alt="' + course.name + '" ' +
        'onerror="this.onerror=null;this.src=\'https://via.placeholder.com/110x145/ddd/666?text=دوره\';">' +
      '<div class="course-detail-header-info">' +
        '<h3 class="course-detail-name">' + course.name + '</h3>' +
        '<p class="course-detail-description">' + (course.description || '') + '</p>' +
      '</div>';
    courseDetailWrapper.appendChild(header);

    const infoCard = document.createElement('div');
    infoCard.className = 'course-info-card';

    const rows = [
      { label: 'تعداد جلسات', value: course.sessionsCount, icon: 'playlist_play' },
      { label: 'فرمت آموزش', value: course.format, icon: 'movie' },
      { label: 'قابل اجرا بر روی', value: course.compatibleWith, icon: 'devices' },
      { label: 'وسایل موردنیاز', value: course.requiredEquipment, icon: 'construction' },
      { label: 'مخاطب', value: course.audience, icon: 'group' }
    ].filter(r => r.value);

    let infoHtml = '<div class="course-info-card-title">' +
      '<span class="material-symbols-outlined">info</span>مشخصات دوره</div>';
    rows.forEach(r => {
      infoHtml +=
        '<div class="course-info-row">' +
          '<span class="material-symbols-outlined">' + r.icon + '</span>' +
          '<span class="course-info-row-label">' + r.label + ':</span>' +
          '<span class="course-info-row-value">' + r.value + '</span>' +
        '</div>';
    });
    infoCard.innerHTML = infoHtml;
    courseDetailWrapper.appendChild(infoCard);

    const sessions = courseSessionsMap[course.name] || [];
    if (sessions.length > 0) {
      const sessionsTitle = document.createElement('div');
      sessionsTitle.className = 'course-sessions-title';
      sessionsTitle.innerHTML = '<span class="material-symbols-outlined">video_library</span>' +
        'جلسات دوره (' + sessions.length + ' جلسه)';
      courseDetailWrapper.appendChild(sessionsTitle);

      const downloads = getDownloads();

      sessions.forEach(session => {
        const isDownloaded = downloads.some(d => d.link === session.link && (d.isStoredOffline || d.userDownloaded));

        const card = document.createElement('div');
        card.className = 'session-card';
        card.innerHTML =
          '<div class="session-card-top">' +
            '<div class="session-card-info">' +
              '<h4 class="session-card-title">' + session.number + ' - ' + session.topic + '</h4>' +
              '<div class="session-card-actions">' +
                '<div class="stat-item play-btn">' +
                  '<span class="material-symbols-outlined">play_circle</span>' +
                '</div>' +
                '<button type="button" class="download-btn-session' + (isDownloaded ? ' downloaded' : '') + '" title="' + (isDownloaded ? 'دانلود شده' : 'دانلود برای استفاده آفلاین') + '">' +
                  '<span class="material-symbols-outlined">' + (isDownloaded ? 'check_circle' : 'download') + '</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
            '<img class="session-card-image" src="' + img + '" alt="' + course.name + '" ' +
              'onerror="this.onerror=null;this.src=\'https://via.placeholder.com/80x110/ddd/666?text=دوره\';">' +
          '</div>';

        const dlBtn = card.querySelector('.download-btn-session');

        dlBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          if (dlBtn.classList.contains('downloaded')) {
            showToast('این فایل قبلاً دانلود شده است');
            return;
          }

          downloadSessionFile({
            link: session.link,
            number: session.number,
            topic: session.topic,
            title: course.name,
            img: img
          }, dlBtn);
        }, true);

        card.addEventListener('click', (e) => {
          if (e.target.closest('.download-btn-session')) return;

          navigateTo('player', {
            sessionData: {
              link: session.link,
              number: session.number,
              topic: session.topic,
              title: course.name,
              img: img
            }
          });
        });

        courseDetailWrapper.appendChild(card);
      });
    }
  }

  // ===== سیستم جستجوی جامع =====
  function preloadSearchData() {
    if (Object.keys(lessonsData).length === 0) loadLessonsFromSheet();
    if (coursesData.length === 0) loadCoursesFromSheet();
    if (articlesData.length === 0) loadArticlesFromSheet();
  }

  function handleSearch() {
    const query = normalizeText(searchInput.value.trim().toLowerCase());

    if (clearSearch) {
      clearSearch.style.display = query ? 'block' : 'none';
    }

    if (!query) {
      searchResults.innerHTML = '<p class="search-empty">عبارتی برای جستجو وارد کنید...</p>';
      return;
    }

    const results = [];

    if (currentSearchTab === 'all' || currentSearchTab === 'lessons') {
      Object.keys(lessonsData).forEach(grade => {
        lessonsData[grade].forEach(book => {
          const bookTitleNorm = normalizeText(book.title.toLowerCase());

          if (bookTitleNorm.includes(query)) {
            results.push({
              type: 'lesson_book',
              badge: 'درس / کتاب',
              title: book.title,
              subtitle: 'پایه ' + grade,
              img: book.img,
              data: book
            });
          }

          if (book.sessions && book.sessions.length > 0) {
            book.sessions.forEach(session => {
              const numNorm = normalizeText((session.number || '').toLowerCase());
              const topicNorm = normalizeText((session.topic || '').toLowerCase());
              if (numNorm.includes(query) || topicNorm.includes(query)) {
                results.push({
                  type: 'lesson_session',
                  badge: 'جلسه درس',
                  title: session.number + ' - ' + session.topic,
                  subtitle: book.title,
                  img: book.img,
                  data: {
                    link: session.link,
                    number: session.number,
                    topic: session.topic,
                    title: book.title,
                    img: book.img
                  }
                });
              }
            });
          }
        });
      });
    }

    if (currentSearchTab === 'all' || currentSearchTab === 'courses') {
      coursesData.forEach(course => {
        const nameNorm = normalizeText(course.name.toLowerCase());
        const descNorm = normalizeText((course.description || '').toLowerCase());

        if (nameNorm.includes(query) || descNorm.includes(query)) {
          results.push({
            type: 'course',
            badge: 'دوره آموزشی',
            title: course.name,
            subtitle: course.description || 'بدون توضیح',
            img: course.image || 'https://via.placeholder.com/80x110/ddd/666?text=دوره',
            data: course
          });
        }

        const csessions = courseSessionsMap[course.name] || [];
        csessions.forEach(session => {
          const numNorm = normalizeText((session.number || '').toLowerCase());
          const topicNorm = normalizeText((session.topic || '').toLowerCase());
          if (numNorm.includes(query) || topicNorm.includes(query)) {
            results.push({
              type: 'course_session',
              badge: 'جلسه دوره',
              title: session.number + ' - ' + session.topic,
              subtitle: course.name,
              img: course.image || 'https://via.placeholder.com/80x110/ddd/666?text=دوره',
              data: {
                link: session.link,
                number: session.number,
                topic: session.topic,
                title: course.name,
                img: course.image
              }
            });
          }
        });
      });
    }

    if (currentSearchTab === 'all' || currentSearchTab === 'articles') {
      articlesData.forEach(article => {
        const titleNorm = normalizeText((article.title || '').toLowerCase());
        const catNorm = normalizeText((article.category || '').toLowerCase());

        if (titleNorm.includes(query) || catNorm.includes(query)) {
          results.push({
            type: 'article',
            badge: 'مقاله',
            title: article.title,
            subtitle: article.category ? 'دسته‌بندی: ' + article.category : 'مقاله آموزشی',
            link: article.link,
            data: article
          });
        }
      });
    }

    renderSearchResults(results);
  }

  function renderSearchResults(results) {
    searchResults.innerHTML = '';

    if (results.length === 0) {
      searchResults.innerHTML = '<p class="search-empty">نتیجه‌ای با این عبارت پیدا نشد.</p>';
      return;
    }

    results.forEach(item => {
      const card = document.createElement('div');
      card.className = 'session-card search-result-item';

      let imgHtml = '';
      if (item.img) {
        imgHtml = '<img class="session-card-image" src="' + item.img + '" alt="' + item.title + '" onerror="this.onerror=null; this.src=\'https://via.placeholder.com/80x110/ddd/666?text=عکس\';">';
      } else {
        imgHtml = '<div class="article-category-icon" style="background:#e0f2f1; color:#00796b; width:50px; height:50px; border-radius:10px; display:flex; align-items:center; justify-content:center;"><span class="material-symbols-outlined">article</span></div>';
      }

      card.innerHTML = '<div class="session-card-top">' +
        '<div class="session-card-info">' +
        '<span class="search-badge">' + item.badge + '</span>' +
        '<h4 class="session-card-title">' + item.title + '</h4>' +
        '<p class="search-subtitle">' + item.subtitle + '</p>' +
        '</div>' +
        imgHtml +
        '</div>';

      card.addEventListener('click', () => {
        if (item.type === 'lesson_book') {
          navigateTo('sessions', { book: item.data });
        } else if (item.type === 'course') {
          navigateTo('courseDetail', { course: item.data });
        } else if (item.type === 'lesson_session' || item.type === 'course_session') {
          navigateTo('player', { sessionData: item.data });
        } else if (item.type === 'article') {
          if (item.link) {
            window.open(item.link, '_blank');
          } else {
            showToast('لینکی برای این مقاله وجود ندارد');
          }
        }
      });

      searchResults.appendChild(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      searchInput.value = '';
      handleSearch();
      searchInput.focus();
    });
  }

  if (searchTabs) {
    searchTabs.querySelectorAll('.search-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        searchTabs.querySelectorAll('.search-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSearchTab = btn.getAttribute('data-tab');
        handleSearch();
      });
    });
  }

  document.querySelectorAll('.open-search-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo('search');
    });
  });

  // ===== بنرها =====
  async function loadBannersFromSheet() {
    if (!bannersWrapper) return;

    if (bannersData.length > 0) {
      renderBanners();
      return;
    }

    bannersWrapper.innerHTML = '<p class="banners-loading">در حال بارگذاری بنرها...</p>';

    try {
      const data = await fetchSheetData(BANNERS_API_URL);
      if (!Array.isArray(data)) throw new Error('پاسخ نامعتبر: آرایه نیست');

      bannersData = data.map(row => {
        const clean = {};
        Object.keys(row).forEach(k => { clean[k.trim()] = row[k]; });
        return {
          name: (clean['نام بنر'] || '').toString().trim(),
          image: (clean['آدرس تصویر'] || '').toString().trim(),
          link: (clean['لینک'] || '').toString().trim()
        };
      }).filter(b => b.image && b.link);

      if (bannersData.length === 0) {
        bannersWrapper.innerHTML = '<p class="banners-empty">بنری یافت نشد.</p>';
        return;
      }

      renderBanners();
    } catch (error) {
      console.error('خطا در دریافت بنرها:', error);
      bannersWrapper.innerHTML = '<p class="banners-empty">⚠️ اتصال به سرور بنرها برقرار نشد.</p>';
    }
  }

  function renderBanners() {
    bannersWrapper.innerHTML = '';

    if (bannersData.length === 0) {
      bannersWrapper.innerHTML = '<p class="banners-empty">بنری یافت نشد.</p>';
      return;
    }

    const carousel = document.createElement('div');
    carousel.className = 'banner-carousel';

    const track = document.createElement('div');
    track.className = 'banner-track';

    bannersData.forEach(banner => {
      const slide = document.createElement('a');
      slide.className = 'banner-slide';
      slide.href = banner.link;
      slide.target = '_blank';
      slide.rel = 'noopener noreferrer';

      const img = document.createElement('img');
      img.src = banner.image;
      img.alt = banner.name;
      img.loading = 'lazy';
      img.onerror = function () {
        this.onerror = null;
        this.src = 'https://via.placeholder.com/320x130/ddd/666?text=' +
          encodeURIComponent(banner.name);
      };

      slide.appendChild(img);
      track.appendChild(slide);
    });

    carousel.appendChild(track);

    const dots = document.createElement('div');
    dots.className = 'banner-dots';

    bannersData.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'banner-dot' + (i === 0 ? ' active' : '');
      dot.dataset.index = i;
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goToBanner(i);
        restartBannerTimer();
      });
      dots.appendChild(dot);
    });

    carousel.appendChild(dots);
    bannersWrapper.appendChild(carousel);

    bannerIndex = 0;
    applyBannerTransform();
    startBannerTimer();
  }

  function goToBanner(index) {
    if (bannersData.length === 0) return;
    if (index < 0) index = bannersData.length - 1;
    if (index >= bannersData.length) index = 0;

    bannerIndex = index;
    applyBannerTransform();
  }

  function applyBannerTransform() {
    const track = document.querySelector('.banner-track');
    if (!track) return;

    track.style.transform = 'translateX(' + (-bannerIndex * 100) + '%)';

    const dots = document.querySelectorAll('.banner-dot');
    dots.forEach((d, i) => {
      if (i === bannerIndex) d.classList.add('active');
      else d.classList.remove('active');
    });
  }

  function startBannerTimer() {
    stopBannerTimer();
    if (bannersData.length <= 1) return;

    bannerTimer = setInterval(() => {
      goToBanner(bannerIndex + 1);
    }, 5000);
  }

  function stopBannerTimer() {
    if (bannerTimer) {
      clearInterval(bannerTimer);
      bannerTimer = null;
    }
  }

  function restartBannerTimer() {
    stopBannerTimer();
    startBannerTimer();
  }

  // ===== دکمه‌های دسترسی سریع =====
  const btnLastLesson = document.getElementById('btn-last-lesson');
  if (btnLastLesson) {
    btnLastLesson.addEventListener('click', (e) => {
      e.preventDefault();
      const last = getLastVisited('last_visited_lesson');
      if (last && last.link) {
        navigateTo('player', { sessionData: last });
      } else {
        showToast('شما هنوز هیچ درسی را گوش نکرده‌اید');
      }
    });
  }

  const btnLastCourse = document.getElementById('btn-last-course');
  if (btnLastCourse) {
    btnLastCourse.addEventListener('click', (e) => {
      e.preventDefault();
      const last = getLastVisited('last_visited_course');
      if (last && last.name) {
        navigateTo('courseDetail', { course: last });
      } else {
        showToast('شما هنوز هیچ دوره‌ای را مشاهده نکرده‌اید');
      }
    });
  }

  const btnLastArticle = document.getElementById('btn-last-article');
  if (btnLastArticle) {
    btnLastArticle.addEventListener('click', (e) => {
      e.preventDefault();
      const last = getLastVisited('last_visited_article');
      if (last && last.categoryTitle) {
        navigateTo('articleContent', {
          categoryTitle: last.categoryTitle,
          items: last.items || []
        });
      } else {
        showToast('شما هنوز هیچ مقاله‌ای را مطالعه نکرده‌اید');
      }
    });
  }

  // ===== رویدادها =====
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      if (page === 'categories') navigateTo('sheet');
      else navigateTo(page);
    });
  });

  document.querySelectorAll('.sheet-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-target');
      if (target === 'lessons') navigateTo('lessons');
      else if (target === 'articles') navigateTo('articles');
      else if (target === 'courses') navigateTo('courses');
    });
  });

  if (closeSheetBtn) closeSheetBtn.addEventListener('click', () => history.back());
  if (overlay) overlay.addEventListener('click', () => {
    if (categorySheet.classList.contains('show')) history.back();
  });

  ['backToHome', 'backToLessons', 'backToHomeFromFav',
   'backToHomeFromDownloads', 'backToHomeFromArticles', 'backToArticles',
   'backToHomeFromSearch', 'backToHomeFromCourses', 'backToCourses'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('click', () => history.back());
  });

  if (gradesWrapper) {
    gradesWrapper.addEventListener('click', (e) => {
      const card = e.target.closest('.book-card');
      if (!card) return;
      const title = card.getAttribute('data-book-title');
      const book = booksMap[title];
      if (!book) return;
      if (!book.sessions || book.sessions.length === 0) {
        showToast('برای این درس هنوز جلسه‌ای ثبت نشده است.');
        return;
      }
      navigateTo('sessions', { book: book });
    });
  }

  let touchStartY = 0;
  if (categorySheet) {
    categorySheet.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; });
    categorySheet.addEventListener('touchend', (e) => {
      if (e.changedTouches[0].clientY - touchStartY > 100) history.back();
    });
  }

  // ===== مقداردهی اولیه =====
  history.replaceState({ view: 'home', params: {} }, '');
  history.pushState({ view: 'home', params: {} }, '');
  updateView({ view: 'home', params: {} });

  // ===== در معرض دسترسی قرار دادن توابع برای HTML =====
  window.navigateTo = navigateTo;
  window.resumeLastLesson = resumeLastLesson;
  window.updateContinueLearningCard = updateContinueLearningCard;
  window.downloadSessionFile = downloadSessionFile;
});
let siteLanguage = 'zh';
try { siteLanguage = localStorage.getItem('site-language') === 'en' ? 'en' : 'zh'; } catch {}
let translationData;
let translationPromise;
const originalText = new WeakMap();
const originalAttributes = new WeakMap();
function initializePage() {
  initializeTranslation();
const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const emailNotice = document.createElement("div");
emailNotice.className = "email-notice";
emailNotice.setAttribute("role", "status");
emailNotice.setAttribute("aria-live", "polite");
document.body.append(emailNotice);
let emailNoticeTimer;
document.querySelectorAll("[data-copy-email]").forEach((button) => {
  button.addEventListener("click", async () => {
    const email = button.dataset.copyEmail;
    try {
      await navigator.clipboard.writeText(email);
      emailNotice.textContent = (siteLanguage === "en" ? "Email copied: " : "邮箱已复制：") + email;
    } catch {
      emailNotice.textContent = siteLanguage === "en" ? "Email: " + email + " (please copy manually)" : "邮箱：" + email + "（请手动复制）";
    }
    emailNotice.classList.add("visible");
    clearTimeout(emailNoticeTimer);
    emailNoticeTimer = setTimeout(() => emailNotice.classList.remove("visible"), 5000);
  });
});

// Mark the section currently being read in the floating guide.
(() => {
 const nav = document.querySelector('.academic-nav');
 if (!nav) return;
 const links = [...nav.querySelectorAll('a:not(.guide-back)')];
 const sections = links.map(a => document.querySelector(a.getAttribute('href')));
 let queued = false;
 function update() {
  queued = false;
  if (!nav.getClientRects().length) return;
  const edge = nav.getBoundingClientRect().bottom + 45;
  let current = 0;
  sections.forEach((section, i) => { if (section && section.getBoundingClientRect().top <= edge) current = i; });
  links.forEach((a, i) => { a.classList.toggle('is-current', i === current); if(i === current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
 }
 window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, {passive:true});
 document.querySelector('.profile-details')?.addEventListener('toggle', update);
 update();
})();

document.querySelectorAll('.game-portrait-toggle').forEach(button => {
 button.addEventListener('click', () => {
  const caption = document.getElementById(button.getAttribute('aria-controls'));
  caption.hidden = !caption.hidden;
  button.setAttribute('aria-expanded', String(!caption.hidden));
 });
});

document.querySelectorAll('.sidebar-music').forEach(player => {
  if (player.dataset.initialized) return;
  player.dataset.initialized = 'true';
  const tracks = [
    { src: 'assets/spring-love-cherry-blossoms.mp3', title: '除了春天爱情和樱花', artist: 'HIGH4 · IU' },
    { src: 'assets/dancing-with-our-hands-tied.mp3', title: 'Dancing With Our Hands Tied', artist: 'Taylor Swift' }
  ];
  const audio = player.querySelector('audio');
  let host = document.getElementById('persistent-audio');
  if (!host) { host = document.createElement('div'); host.id = 'persistent-audio'; host.hidden = true; document.body.append(host); }
  host.append(audio);
  const button = player.querySelector('.music-play');
  const volume = player.querySelector('.music-volume');
  const formatTime = seconds => {
    if (!Number.isFinite(seconds)) return '--:--';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };
  const updateTime = () => {
    player.querySelector('.music-current').textContent = formatTime(audio.currentTime);
    player.querySelector('.music-duration').textContent = formatTime(audio.duration);
  };
  ['timeupdate', 'loadedmetadata', 'durationchange', 'emptied'].forEach(event => audio.addEventListener(event, updateTime));
  updateTime();
  let index = 0;
  let awaitingInteraction = true;
  audio.volume = Number(volume.value);
  const update = () => {
    button.textContent = audio.paused ? '▶' : 'Ⅱ';
    button.setAttribute('aria-label', siteLanguage === 'en' ? (audio.paused ? 'Play' : 'Pause') : (audio.paused ? '播放' : '暂停'));
    button.setAttribute('aria-pressed', String(!audio.paused));
  };
  const play = async () => {
    try { await audio.play(); awaitingInteraction = false; } catch { update(); }
  };
  button.addEventListener('click', () => {
    awaitingInteraction = false;
    if (audio.paused) play(); else audio.pause();
  });
  volume.addEventListener('input', () => { audio.volume = Number(volume.value); });
  const startOnInteraction = event => {
    if (awaitingInteraction && !player.contains(event.target)) play();
  };
  document.addEventListener('click', startOnInteraction);
  document.addEventListener('keydown', startOnInteraction);
  audio.addEventListener('play', () => { awaitingInteraction = false; update(); });
  audio.addEventListener('pause', update);
  audio.addEventListener('ended', () => {
    index = (index + 1) % tracks.length;
    const track = tracks[index];
    player.querySelector('.sidebar-music-title').textContent = siteLanguage === 'en' && index === 0 ? 'Not Spring, Love, or Cherry Blossoms' : track.title;
    player.querySelector('.sidebar-music-artist').textContent = track.artist;
    audio.src = track.src;
    play();
  });
  play();
});

}
initializePage();

// Keep the audio element connected while replacing the visible page.
(() => {
  let navigation = 0;
  async function navigate(url, push) {
    const request = ++navigation;
    try {
      const response = await fetch(url.href);
      if (!response.ok) throw new Error('Navigation failed');
      const next = new DOMParser().parseFromString(await response.text(), 'text/html');
      if (!next.querySelector('.sidebar-music')) throw new Error('Unsupported page');
      if (request !== navigation) return;
      const player = document.querySelector('.sidebar-music');
      const host = document.getElementById('persistent-audio');
      next.querySelector('.sidebar-music').replaceWith(player);
      next.querySelectorAll('script').forEach(script => script.remove());
      document.title = next.title;
      document.body.className = next.body.className;
      [...document.body.childNodes].forEach(node => { if (node !== host) node.remove(); });
      document.body.append(...next.body.childNodes);
      if (push) history.pushState(null, '', url.href);
      initializePage();
      window.scrollTo(0, 0);
      if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
    } catch { if (request === navigation) location.assign(url.href); }
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !url.pathname.endsWith('.html') || url.pathname === location.pathname) return;
    event.preventDefault();
    navigate(url, true);
  });
  window.addEventListener('popstate', () => navigate(new URL(location.href), false));
})();

async function initializeTranslation() {
  const button = document.querySelector('.language-toggle');
  if (!button) return;
  button.addEventListener('click', async () => {
    siteLanguage = siteLanguage === 'en' ? 'zh' : 'en';
    try { localStorage.setItem('site-language', siteLanguage); } catch {}
    await applyTranslation();
  });
  await applyTranslation();
}
async function applyTranslation() {
  const button = document.querySelector('.language-toggle');
  if (!button) return;
  try {
    if (!translationData) {
      translationPromise ||= fetch('translations.json?v=117').then(response => {
        if (!response.ok) throw new Error('Translation unavailable');
        return response.json();
      });
      translationData = await translationPromise;
    }
    const english = siteLanguage === 'en';
    document.documentElement.lang = english ? 'en' : 'zh-CN';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('script, style, [translate="no"], .language-toggle, .sidebar-music-title, .music-play, .music-time')) continue;
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const original = originalText.get(node);
      const key = original.trim();
      if (translationData[key]) node.nodeValue = english ? original.replace(key, translationData[key]) : original;
    }
    document.querySelectorAll('[aria-label], [title], [placeholder], [alt]').forEach(element => {
      if (element === button || element.classList.contains('music-play') || element.closest('[translate="no"]')) return;
      if (!originalAttributes.has(element)) {
        originalAttributes.set(element, Object.fromEntries(['aria-label','title','placeholder','alt'].filter(key => element.hasAttribute(key)).map(key => [key,element.getAttribute(key)])));
      }
      Object.entries(originalAttributes.get(element)).forEach(([key,value]) => {
        element.setAttribute(key, english && translationData[value] ? translationData[value] : value);
      });
    });
    const song = document.querySelector('.sidebar-music-title');
    if (song && ['除了春天爱情和樱花','Not Spring, Love, or Cherry Blossoms'].includes(song.textContent)) song.textContent = english ? 'Not Spring, Love, or Cherry Blossoms' : '除了春天爱情和樱花';
    const playButton = document.querySelector('.music-play');
    const audio = document.querySelector('#persistent-audio audio');
    if (playButton && audio) playButton.setAttribute('aria-label', english ? (audio.paused ? 'Play' : 'Pause') : (audio.paused ? '播放' : '暂停'));
    button.textContent = english ? '中文' : 'EN';
    button.setAttribute('aria-label', english ? '切换为中文' : 'Switch to English');
    button.setAttribute('lang', english ? 'zh-CN' : 'en');
  } catch {
    translationPromise = null;
    button.textContent = '重试 / Retry';
  }
}

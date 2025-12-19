const bannerInput = document.getElementById("bannerInput");
const popupInput = document.getElementById("popupInput");

const desktopBanner = document.getElementById("desktopBanner");
const mobileBanner = document.getElementById("mobileBanner");

const desktopOverlay = document.getElementById("desktopPopupOverlay");
const mobileOverlay = document.getElementById("mobilePopupOverlay");

const desktopPopup = document.getElementById("desktopPopup");
const mobilePopup = document.getElementById("mobilePopup");

const popupDelaySelect = document.getElementById("popupDelay");
const popupCloseDelaySelect = document.getElementById("popupCloseDelay");

const bannerDisplayTime = document.getElementById("bannerDisplayTime");
const bannerListEl = document.getElementById("bannerList");
const retryBtn = document.getElementById("retryPopupBtn"); // added (was missing)

// PHONE WIDTH CONTROLS
const phoneFrame = document.getElementById("phoneFrame");
const phoneWidth = document.getElementById("phoneWidth");
const phoneWidthValue = document.getElementById("phoneWidthValue");

if (phoneFrame && phoneWidth && phoneWidthValue) {
  // initialize width on load
  phoneFrame.style.width = phoneWidth.value + "px";
  phoneWidthValue.textContent = phoneWidth.value + "px";

  phoneWidth.addEventListener("input", () => {
    phoneFrame.style.width = phoneWidth.value + "px";
    phoneWidthValue.textContent = phoneWidth.value + "px";
  });
}

/* ======================================================
   BANNER PLAYLIST (persistent cycle)
====================================================== */

let banners = [];            // playlist: [{id, src}, ...]
let currentIndex = -1;       // index in playlist currently shown
let bannerTimer = null;

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function renderBannerList() {
  bannerListEl.innerHTML = "";
  banners.forEach((item, i) => {
    const li = document.createElement("li");
    li.dataset.id = item.id;
    if (i === currentIndex) li.classList.add("current");
    li.innerHTML = `<img src="${item.src}"><button class="banner-remove" data-id="${item.id}">×</button>`;
    bannerListEl.appendChild(li);
  });
}

function displayAtIndex(i) {
  if (banners.length === 0 || i < 0) {
    desktopBanner.innerHTML = `<div class="ad-placeholder">Desktop Banner</div>`;
    mobileBanner.innerHTML = `<div class="ad-placeholder">Mobile Banner</div>`;
    currentIndex = -1;
    renderBannerList();
    return;
  }
  currentIndex = ((i % banners.length) + banners.length) % banners.length;
  const b = banners[currentIndex];
  desktopBanner.innerHTML = `<img src="${b.src}">`;
  mobileBanner.innerHTML = `<img src="${b.src}">`;
  renderBannerList();
}

function startBannerLoop() {
  clearTimeout(bannerTimer);
  if (banners.length === 0) {
    displayAtIndex(-1);
    return;
  }
  // if nothing currently selected, start at 0
  if (currentIndex === -1) currentIndex = 0;
  displayAtIndex(currentIndex);
  const duration = Number(bannerDisplayTime.value) * 1000;
  bannerTimer = setTimeout(() => {
    currentIndex = (currentIndex + 1) % banners.length;
    startBannerLoop();
  }, duration);
}

function stopBannerLoop() {
  clearTimeout(bannerTimer);
  bannerTimer = null;
}

/* handle remove clicks */
bannerListEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".banner-remove");
  if (!btn) return;
  const id = btn.dataset.id;
  const idx = banners.findIndex(x => x.id === id);
  if (idx === -1) return;

  // remove the item
  banners.splice(idx, 1);

  // adjust currentIndex
  if (idx < currentIndex) {
    currentIndex -= 1;
  } else if (idx === currentIndex) {
    // if we removed the currently showing banner:
    if (banners.length === 0) {
      stopBannerLoop();
      displayAtIndex(-1);
      return;
    } else {
      // keep same index (it now refers to next item in the shifted array)
      if (currentIndex >= banners.length) currentIndex = 0;
    }
  }
  // restart loop to reflect changes immediately
  startBannerLoop();
});

/* load banners (supports multiple files) */
bannerInput.addEventListener("change", () => {
  const files = Array.from(bannerInput.files);
  if (!files.length) return;

  let remaining = files.length;
  files.forEach(file => {
    const reader = new FileReader();
    const id = genId();
    reader.onload = () => {
      banners.push({ id, src: reader.result });
      remaining--;
      if (remaining === 0) {
        // if loop not running, start it; otherwise continue cycling and newly added banners will appear in turn
        if (currentIndex === -1 || !bannerTimer) {
          startBannerLoop();
        } else {
          renderBannerList();
        }
      }
    };
    reader.readAsDataURL(file);
  });

  // reset input so same file can be re-added later if needed
  bannerInput.value = "";
});

/* ======================================================
   POPUP CONTENT (IMAGE OR PLACEHOLDER)
====================================================== */
function renderPopupContent(target, imageSrc = null) {
  target.innerHTML = `
    ${
      imageSrc
        ? `<img src="${imageSrc}">`
        : `<div class="popup-placeholder">Popup Ad</div>`
    }
    <div class="countdown"></div>
  `;
}

/* Initial placeholder (important!) */
renderPopupContent(desktopPopup);
renderPopupContent(mobilePopup);

/* ======================================================
   LOAD POPUP IMAGE
====================================================== */
popupInput.addEventListener("change", () => {
  const file = popupInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    renderPopupContent(desktopPopup, reader.result);
    renderPopupContent(mobilePopup, reader.result);
    retryPopups();
  };
  reader.readAsDataURL(file);
});

/* ======================================================
   POPUP SCHEDULING (SAFE)
====================================================== */
const popupTimeouts = new WeakMap();
const popupIntervals = new WeakMap();

function schedulePopup(overlay) {
  clearPopupTimers(overlay);

  const delay = Number(popupDelaySelect.value) * 1000;
  const timeout = setTimeout(() => showPopup(overlay), delay);

  popupTimeouts.set(overlay, timeout);
}

function showPopup(overlay) {
  overlay.classList.add("active");

  const countdown = overlay.querySelector(".countdown");
  let time = Number(popupCloseDelaySelect.value);

  countdown.textContent = time;
  countdown.classList.remove("ready");
  countdown.onclick = null;

  const interval = setInterval(() => {
    time--;
    if (time > 0) {
      countdown.textContent = time;
    } else {
      clearInterval(interval);
      countdown.textContent = "✕";
      countdown.classList.add("ready");
      countdown.onclick = () => overlay.classList.remove("active");
    }
  }, 1000);

  popupIntervals.set(overlay, interval);
}

function clearPopupTimers(overlay) {
  if (popupTimeouts.has(overlay)) {
    clearTimeout(popupTimeouts.get(overlay));
    popupTimeouts.delete(overlay);
  }

  if (popupIntervals.has(overlay)) {
    clearInterval(popupIntervals.get(overlay));
    popupIntervals.delete(overlay);
  }

  overlay.classList.remove("active");

  const countdown = overlay.querySelector(".countdown");
  if (countdown) {
    countdown.classList.remove("ready");
    countdown.onclick = null;
  }
}

/* ======================================================
   RETRY POPUP
====================================================== */
function retryPopups() {
  clearPopupTimers(desktopOverlay);
  clearPopupTimers(mobileOverlay);

  schedulePopup(desktopOverlay);
  schedulePopup(mobileOverlay);
}

retryBtn.addEventListener("click", () => {
  retryPopups();
});

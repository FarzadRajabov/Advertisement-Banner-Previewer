const bannerInput = document.getElementById('bannerInput');
const popupInput = document.getElementById('popupInput');

const desktopBanner = document.getElementById('desktopBanner');
const mobileBanner = document.getElementById('mobileBanner');

const desktopPopup = document.getElementById('desktopPopup');
const mobilePopup = document.getElementById('mobilePopup');

const desktopOverlay = document.getElementById('desktopPopupOverlay');
const mobileOverlay = document.getElementById('mobilePopupOverlay');

bannerInput.addEventListener('change', () => loadBanner());
popupInput.addEventListener('change', () => loadPopup());

function loadBanner() {
  const file = bannerInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    desktopBanner.innerHTML = `<img src="${reader.result}">`;
    mobileBanner.innerHTML = `<img src="${reader.result}">`;
  };
  reader.readAsDataURL(file);
}

function loadPopup() {
  const file = popupInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const popupHTML = `<img src="${reader.result}"><div class="countdown">5</div>`;
    desktopPopup.innerHTML = popupHTML;
    mobilePopup.innerHTML = popupHTML;
    startPopup(desktopOverlay);
    startPopup(mobileOverlay);
  };
  reader.readAsDataURL(file);
}

function startPopup(overlay) {
  let time = 5;
  const countdown = overlay.querySelector('.countdown');
  overlay.classList.remove('active');
  countdown.textContent = time;

  setTimeout(() => {
    overlay.classList.add('active');
    const interval = setInterval(() => {
      time--;
      if (time > 0) countdown.textContent = time;
      else {
        clearInterval(interval);
        countdown.textContent = '✕';
        countdown.classList.add('ready');
        countdown.onclick = () => overlay.classList.remove('active');
      }
    }, 1000);
  }, 2000);
}

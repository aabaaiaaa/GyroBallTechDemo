'use strict';

export function initFullscreen() {
  const btn = document.getElementById('btn-fullscreen');
  const el  = document.documentElement;

  // Hide button entirely if the Fullscreen API is unavailable (e.g. iOS Safari).
  const canFullscreen = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!canFullscreen) {
    btn.classList.add('hidden');
    return;
  }

  function _isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function _update() {
    const full = _isFullscreen();
    btn.querySelector('.icon-expand').classList.toggle('hidden', full);
    btn.querySelector('.icon-compress').classList.toggle('hidden', !full);
    btn.setAttribute('aria-label', full ? 'Exit full screen' : 'Enter full screen');
  }

  btn.addEventListener('click', () => {
    if (_isFullscreen()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  });

  document.addEventListener('fullscreenchange',       _update);
  document.addEventListener('webkitfullscreenchange', _update);
}

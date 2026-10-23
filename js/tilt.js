/* ================= 3D TILT (mouse parallax + idle sway) =================
   The whole machine leans a little toward the mouse. Tilt.hold(true) freezes it,
   which the lever uses so the machine stands still while you are on the lever. */
const rig = document.getElementById('rig');
const Tilt = (() => {
  let rx = 6, ry = -6, trx = 6, tryy = -6;     // current / target rotation (deg)
  let sway = 0, swayT = 0, held = 0;
  const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('pointermove', e => {
    if (held || e.pointerType === 'touch') return;
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    tryy = -6 + nx * 20;
    trx = 6 - ny * 8;
  }, { passive: true });

  function hold(on) {
    held = Math.max(0, held + (on ? 1 : -1));
    if (held) { trx = rx; tryy = ry; swayT = sway; }   // stop exactly where we are
  }

  (function loop(t) {
    if (!held) swayT = calm ? 0 : Math.sin(t / 2300) * 2.2;
    sway += (swayT - sway) * 0.1;
    rx += (trx - rx) * 0.07;
    ry += (tryy - ry) * 0.07;
    rig.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + (ry + sway).toFixed(2) + 'deg)';
    requestAnimationFrame(loop);
  })(0);

  return { hold };
})();

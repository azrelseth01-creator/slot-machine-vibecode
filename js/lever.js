/* ================= LEVER =================
   Goals: easy to grab, never jumps under the cursor, feels mechanical,
   and always springs back cleanly.

   - The knob follows your pointer 1:1. At grab time we sample where the knob
     sits on screen for every angle, so dragging maps pointer travel to angle
     exactly, perspective included. There is no jump on the first move.
   - A touch of smoothing removes hand jitter. Ratchet clicks every 15 degrees.
   - Pulling past ~93% commits: clunk, reels spin, lever pins to the bottom
     until you let go, then springs back with a bounce.
   - Let go after ~2/3 of a pull and the lever finishes the pull for you.
     Let go earlier and it eases back without spinning.
   - A tap, the PULL button, Space, Enter or Arrow Down do a clean auto-pull.
   - The 3D tilt freezes while your pointer is on the lever or it is moving. */
const LeverCtl = (() => {
  const arm = document.getElementById('arm');
  const knob = document.getElementById('knob');

  const FIRE = 168;      // degrees at which the pull commits
  const COMMIT = 115;    // release past this and the lever finishes the pull
  const DETENT = 15;     // degrees between ratchet clicks

  let angle = 0, shown = 0, goal = 0;
  let anim = 0, follow = 0;
  let dragging = false, fired = false, hovering = false, holding = false;
  let downY = 0, grabY = 0, moved = 0, downT = 0, lastDetent = 0;
  let table = null;

  /* ---------- helpers ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeOut3 = t => 1 - Math.pow(1 - t, 3);
  const easeIn2 = t => t * t;
  const bounceOut = t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
    return n * (t -= 2.625 / d) * t + .984375;
  };

  function setAngle(a) {
    angle = a;
    arm.style.transform = 'rotateX(' + (-a) + 'deg)';
    knob.style.transform = 'rotateX(' + a + 'deg)';        // keep the knob facing you
  }
  setAngle(0);

  function updateHold() {
    const want = dragging || hovering || anim !== 0;
    if (want !== holding) { holding = want; Tilt.hold(want); }
  }

  function animateTo(to, ms, easeFn, done) {
    cancelAnimationFrame(anim);
    const from = angle, t0 = performance.now();
    (function step(now) {
      const p = clamp((now - t0) / ms, 0, 1);
      setAngle(from + (to - from) * easeFn(p));
      if (p < 1) anim = requestAnimationFrame(step);
      else { anim = 0; updateHold(); if (done) done(); }
    })(t0);
    updateHold();
  }
  function stopAnim() { cancelAnimationFrame(anim); anim = 0; }

  /* ---------- screen-position table (exact 1:1 tracking) ---------- */
  function sample() {
    const keep = angle, t = [];
    for (let a = 0; a <= 180; a += 6) {
      setAngle(a);
      const r = knob.getBoundingClientRect();
      t.push({ a: a, y: r.top + r.height / 2 });
    }
    setAngle(keep);
    table = t;
  }
  function yAt(a) {
    const i = clamp(Math.floor(a / 6), 0, table.length - 2);
    const k = clamp((a - table[i].a) / 6, 0, 1);
    return table[i].y + (table[i + 1].y - table[i].y) * k;
  }
  function angleAt(y) {
    if (y <= table[0].y) return 0;
    const last = table[table.length - 1];
    if (y >= last.y) return 180;
    for (let i = 0; i < table.length - 1; i++) {
      const a = table[i], b = table[i + 1];
      if (y >= a.y && y <= b.y) return a.a + (b.a - a.a) * ((y - a.y) / ((b.y - a.y) || 1));
    }
    return 0;
  }

  /* ---------- pull / release ---------- */
  function commit() {
    if (fired) return;
    fired = true;
    sfx.clunk();
    if (navigator.vibrate) navigator.vibrate(22);
    spin();
  }
  function springBack(big) {
    if (big) { sfx.spring(); animateTo(0, 700, bounceOut); }
    else { sfx.tick(0.8); animateTo(0, 260, easeOut3); }
  }
  function autoPull() {
    if (spinning) { nudge(); return; }
    ensureAudio();
    stopAnim();
    sfx.ratchet();
    animateTo(178, 320, easeIn2, () => {
      commit();
      fired = false;                         // free for the next pull
      setTimeout(() => springBack(true), 140);
    });
  }
  function nudge() {                          // "still spinning" feedback
    if (anim || dragging) return;
    sfx.tick(0.6);
    animateTo(7, 90, easeOut3, () => animateTo(0, 180, easeOut3));
  }

  /* ---------- dragging ---------- */
  function tick() {
    if (!dragging) return;
    const target = fired ? 180 : goal;
    shown += (target - shown) * 0.55;        // light smoothing, no visible lag
    if (Math.abs(target - shown) < 0.05) shown = target;
    setAngle(shown);

    const d = Math.floor(shown / DETENT);
    if (d !== lastDetent) {
      if (d > lastDetent) sfx.tick(0.7 + (shown / 180) * 0.9);
      lastDetent = d;
    }
    if (!fired && goal >= FIRE) commit();
    follow = requestAnimationFrame(tick);
  }

  function release() {
    if (!dragging) return;
    dragging = false;
    cancelAnimationFrame(follow);
    arm.classList.remove('grab');
    document.body.classList.remove('lever-drag');
    const wasFired = fired;
    const tap = moved < 5 && performance.now() - downT < 350;
    fired = false;

    if (wasFired) springBack(true);
    else if (tap) autoPull();
    else if (shown >= COMMIT) {
      animateTo(178, 140, easeIn2, () => {   // let the spring finish the job
        commit();
        fired = false;
        setTimeout(() => springBack(true), 120);
      });
    }
    else springBack(shown > 60);
    updateHold();
  }

  arm.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    ensureAudio();
    knob.classList.remove('attn');
    if (spinning) { nudge(); return; }
    stopAnim();
    arm.setPointerCapture(e.pointerId);
    sample();
    dragging = true; fired = false; moved = 0; downT = performance.now();
    downY = e.clientY;
    grabY = yAt(angle);                      // where the knob really is right now
    shown = goal = angle;
    lastDetent = Math.floor(angle / DETENT);
    arm.classList.add('grab');
    document.body.classList.add('lever-drag');
    updateHold();
    cancelAnimationFrame(follow);
    follow = requestAnimationFrame(tick);
  });
  arm.addEventListener('pointermove', e => {
    if (!dragging) return;
    moved = Math.max(moved, Math.abs(e.clientY - downY));
    goal = angleAt(grabY + (e.clientY - downY));
  });
  arm.addEventListener('pointerup', release);
  arm.addEventListener('pointercancel', release);
  arm.addEventListener('lostpointercapture', release);
  window.addEventListener('blur', release);
  arm.addEventListener('dragstart', e => e.preventDefault());
  arm.addEventListener('contextmenu', e => { if (dragging) e.preventDefault(); });

  arm.addEventListener('pointerenter', () => { hovering = true; updateHold(); });
  arm.addEventListener('pointerleave', () => { hovering = false; updateHold(); });
  arm.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); autoPull(); }
  });

  /* ---------- other ways to pull ---------- */
  pullBtn.addEventListener('click', autoPull);
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && document.activeElement === document.body) { e.preventDefault(); autoPull(); }
  });

  return { autoPull, angle: () => angle, isDragging: () => dragging };
})();
window.autoPull = LeverCtl.autoPull;

/* ============================================================
   EFFECTS: cursor, audio, neural canvas, sphere, boot,
   scroll reveal, navbar, button ripple
   (shared helpers used by deepfake.js and fakenews.js)
============================================================ */

/* ---------- CURSOR ---------- */
const cursorRing = document.getElementById('cursor-ring');
const cursorDot = document.getElementById('cursor-dot');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursorDot.style.left = mx + 'px'; cursorDot.style.top = my + 'px';
});
(function animCursor() {
  rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
  cursorRing.style.left = rx + 'px'; cursorRing.style.top = ry + 'px';
  requestAnimationFrame(animCursor);
})();
document.querySelectorAll('button,a,[data-hover]').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursorRing.style.width = '48px'; cursorRing.style.height = '48px';
    cursorRing.style.borderColor = 'rgba(0,212,255,1)';
  });
  el.addEventListener('mouseleave', () => {
    cursorRing.style.width = '28px'; cursorRing.style.height = '28px';
    cursorRing.style.borderColor = 'rgba(0,212,255,0.7)';
  });
});

/* ---------- WEB AUDIO (sci-fi sounds) ---------- */
let audioCtx;
function getAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx; }
function playTone(freq, dur, type = 'sine', vol = 0.06) {
  try {
    const ac = getAudio();
    const o = ac.createOscillator(); const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.start(); o.stop(ac.currentTime + dur);
  } catch (e) { }
}
function playClick() { playTone(800, 0.08, 'square', 0.04); }
function playBeep() { playTone(1200, 0.15, 'sine', 0.05); setTimeout(() => playTone(1600, 0.15, 'sine', 0.04), 180); }
function playScan() { playTone(400, 0.5, 'sawtooth', 0.03); }
function playSuccess() { playTone(600, 0.2, 'sine', 0.05); setTimeout(() => playTone(800, 0.2, 'sine', 0.04), 250); setTimeout(() => playTone(1000, 0.3, 'sine', 0.05), 500); }

/* ---------- NEURAL NETWORK CANVAS ---------- */
const nnCanvas = document.getElementById('neural-canvas');
const nnCtx = nnCanvas.getContext('2d');
let nnW, nnH;
function resizeNN() { nnW = nnCanvas.width = window.innerWidth; nnH = nnCanvas.height = window.innerHeight; }
resizeNN(); window.addEventListener('resize', resizeNN);

class NNode {
  constructor() { this.reset(true) }
  reset(init = false) {
    this.x = Math.random() * nnW; this.y = init ? Math.random() * nnH : nnH + 10;
    this.vx = (Math.random() - 0.5) * 0.3; this.vy = -(Math.random() * 0.35 + 0.08);
    this.r = Math.random() * 1.6 + 0.4;
    this.op = Math.random() * 0.45 + 0.05;
    this.hue = [200, 220, 260, 185][Math.floor(Math.random() * 4)];
  }
  update() { this.x += this.vx; this.y += this.vy; this.op -= 0.0006; if (this.y < -10 || this.op <= 0) this.reset(); }
  draw() { nnCtx.beginPath(); nnCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2); nnCtx.fillStyle = `hsla(${this.hue},90%,70%,${this.op})`; nnCtx.fill(); }
}
class NetNode {
  constructor() { this.x = Math.random() * nnW; this.y = Math.random() * nnH; this.vx = (Math.random() - 0.5) * 0.25; this.vy = (Math.random() - 0.5) * 0.25; }
  update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > nnW) this.vx *= -1; if (this.y < 0 || this.y > nnH) this.vy *= -1; }
}
const nNodes = []; for (let i = 0; i < 120; i++) nNodes.push(new NNode());
const netNodes = []; for (let i = 0; i < 55; i++) netNodes.push(new NetNode());
let cmx = nnW / 2, cmy = nnH / 2;
document.addEventListener('mousemove', e => { cmx = e.clientX; cmy = e.clientY });

function nnAnimate() {
  nnCtx.clearRect(0, 0, nnW, nnH);
  for (let i = 0; i < netNodes.length; i++) {
    netNodes[i].update();
    for (let j = i + 1; j < netNodes.length; j++) {
      const dx = netNodes[i].x - netNodes[j].x, dy = netNodes[i].y - netNodes[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 130) {
        const cdx = cmx - (netNodes[i].x + netNodes[j].x) / 2;
        const cdy = cmy - (netNodes[i].y + netNodes[j].y) / 2;
        const cd = Math.sqrt(cdx * cdx + cdy * cdy);
        const boost = cd < 200 ? (1 - cd / 200) * 0.3 : 0;
        nnCtx.beginPath();
        nnCtx.moveTo(netNodes[i].x, netNodes[i].y); nnCtx.lineTo(netNodes[j].x, netNodes[j].y);
        nnCtx.strokeStyle = `rgba(0,212,255,${(0.1 * (1 - d / 130) + boost).toFixed(3)})`;
        nnCtx.lineWidth = 0.6; nnCtx.stroke();
      }
    }
    nnCtx.beginPath(); nnCtx.arc(netNodes[i].x, netNodes[i].y, 1.2, 0, Math.PI * 2);
    nnCtx.fillStyle = 'rgba(0,212,255,0.3)'; nnCtx.fill();
  }
  nNodes.forEach(n => { n.update(); n.draw(); });
  requestAnimationFrame(nnAnimate);
}
nnAnimate();

/* ---------- HOLOGRAPHIC SPHERE ---------- */
const sCanvas = document.getElementById('sphere-canvas');
const sCtx = sCanvas.getContext('2d');
const SW = 460, SH = 460, SR = 160, NPTS = 600;
let sMouseX = 0, sMouseY = 0, sRotY = 0, sRotX = 0;
const sPts = [];
for (let i = 0; i < NPTS; i++) {
  const theta = Math.acos(-1 + 2 * i / NPTS);
  const phi = Math.sqrt(NPTS * Math.PI) * theta;
  sPts.push({ ox: SR * Math.sin(theta) * Math.cos(phi), oy: SR * Math.sin(theta) * Math.sin(phi), oz: SR * Math.cos(theta), phase: Math.random() * Math.PI * 2 });
}
const CONNECTIONS = [];
for (let i = 0; i < NPTS; i++) {
  for (let j = i + 1; j < NPTS; j++) {
    const dx = sPts[i].ox - sPts[j].ox, dy = sPts[i].oy - sPts[j].oy, dz = sPts[i].oz - sPts[j].oz;
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 45) CONNECTIONS.push([i, j]);
  }
}
sCanvas.addEventListener('mousemove', e => {
  const r = sCanvas.getBoundingClientRect();
  sMouseX = (e.clientX - r.left - SW / 2) / SW;
  sMouseY = (e.clientY - r.top - SH / 2) / SH;
});
let sTime = 0;
function sphereAnimate() {
  sTime += 0.008;
  sRotY += (sMouseX * 0.8 - sRotY) * 0.06;
  sRotX += (-sMouseY * 0.5 - sRotX) * 0.06;
  sCtx.clearRect(0, 0, SW, SH);
  const cy = Math.cos(sRotY + sTime * 0.3), sy = Math.sin(sRotY + sTime * 0.3);
  const cx = Math.cos(sRotX), sx = Math.sin(sRotX);

  const proj = sPts.map((p) => {
    const pulse = 1 + Math.sin(sTime * 2 + p.phase) * 0.04;
    const ox = p.ox * pulse, oy = p.oy * pulse, oz = p.oz * pulse;
    const rx = ox * cy + oz * sy, rz = -ox * sy + oz * cy;
    const ry = oy * cx - rz * sx, rz2 = oy * sx + rz * cx;
    const fov = 500; const z = rz2 + fov;
    return { x: SW / 2 + rx * fov / z, y: SH / 2 + ry * fov / z, z: rz2, r: 2.5 * fov / z };
  });

  sCtx.lineWidth = 0.5;
  CONNECTIONS.forEach(([i, j]) => {
    const a = proj[i], b = proj[j];
    const minZ = Math.min(a.z, b.z);
    const op = Math.max(0, (minZ + SR) / (SR * 2) * 0.4);
    const hue = 180 + minZ / SR * 60;
    sCtx.beginPath(); sCtx.moveTo(a.x, a.y); sCtx.lineTo(b.x, b.y);
    sCtx.strokeStyle = `hsla(${hue},90%,70%,${op.toFixed(3)})`; sCtx.stroke();
  });

  proj.forEach(p => {
    const op = Math.max(0, (p.z + SR) / (SR * 2));
    const hue = 180 + p.z / SR * 60;
    const grd = sCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2);
    grd.addColorStop(0, `hsla(${hue},90%,80%,${(op * 0.9).toFixed(3)})`);
    grd.addColorStop(1, `hsla(${hue},90%,70%,0)`);
    sCtx.beginPath(); sCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    sCtx.fillStyle = grd; sCtx.fill();
  });

  const cg = sCtx.createRadialGradient(SW / 2, SH / 2, 0, SW / 2, SH / 2, 120);
  cg.addColorStop(0, 'rgba(0,212,255,0.08)');
  cg.addColorStop(0.5, 'rgba(124,58,237,0.04)');
  cg.addColorStop(1, 'transparent');
  sCtx.fillStyle = cg; sCtx.fillRect(0, 0, SW, SH);

  requestAnimationFrame(sphereAnimate);
}
sphereAnimate();

/* ---------- BOOT SEQUENCE ---------- */
const bootStatuses = ['LOADING NEURAL CORE', 'CALIBRATING DETECTORS', 'MOUNTING INFERENCE ENGINE', 'SYNCING MODEL WEIGHTS', 'ACTIVATING SUBSYSTEMS', 'READY'];
let bootProg = 0;
const bootBar = document.getElementById('boot-bar');
const bootStatus = document.getElementById('boot-status');
const bootOverlay = document.getElementById('boot-overlay');
function bootStep() {
  bootProg = Math.min(bootProg + Math.random() * 18 + 8, 100);
  bootBar.style.width = bootProg + '%';
  const si = Math.floor(bootProg / 100 * bootStatuses.length);
  bootStatus.innerHTML = bootStatuses[Math.min(si, bootStatuses.length - 1)] + '...';
  playTone(400 + bootProg * 5, 0.06, 'square', 0.02);
  if (bootProg >= 100) {
    bootStatus.innerHTML = '<span>SYSTEM ONLINE</span>';
    setTimeout(() => { bootOverlay.classList.add('hidden'); setTimeout(() => bootOverlay.remove(), 1000); }, 600);
  } else { setTimeout(bootStep, 80 + Math.random() * 120); }
}
setTimeout(bootStep, 300);

/* ---------- SCROLL REVEAL ---------- */
const revObs = new IntersectionObserver(e => { e.forEach(en => { if (en.isIntersecting) en.target.classList.add('vis'); }); }, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(r => revObs.observe(r));

/* ---------- NAVBAR ACTIVE LINK ---------- */
const navLinkEls = document.querySelectorAll('.nav-link');
window.addEventListener('scroll', () => {
  let cur = 'hero';
  document.querySelectorAll('section,div[id]').forEach(s => { if (window.scrollY >= s.offsetTop - 90) cur = s.id; });
  navLinkEls.forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === '#' + cur) a.classList.add('active');
  });
});

/* ---------- RIPPLE ON BUTTONS ---------- */
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', function (e) {
    playClick();
    const r = document.createElement('span');
    r.className = 'btn-ripple';
    const rect = btn.getBoundingClientRect();
    const sz = Math.max(rect.width, rect.height) * 2;
    r.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - rect.left - sz / 2}px;top:${e.clientY - rect.top - sz / 2}px;`;
    btn.appendChild(r); setTimeout(() => r.remove(), 700);
  });
});

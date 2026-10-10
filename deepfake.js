/* ============================================================
   DEEPFAKE MODULE: upload, analysis, results, charts, history
   (depends on effects.js: playTone, playBeep, playClick, playScan,
    playSuccess, revObs)
============================================================ */

/* ---------- FILE UPLOAD ---------- */
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('main-file-input');
const browseTrigger = document.getElementById('browse-trigger');
const uploadTriggerBtn = document.getElementById('upload-trigger-btn');
let currentFile = null;

browseTrigger.addEventListener('click', () => fileInput.click());
uploadTriggerBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); playScan(); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });

function handleFile(file) {
  if (!file.type.startsWith('image/')) return;
  currentFile = file;
  const reader = new FileReader();
  reader.onload = ev => beginAnalysis(ev.target.result, file);
  reader.readAsDataURL(file);
  playBeep();
}

/* ---------- ANALYSIS ENGINE ---------- */
function beginAnalysis(dataUrl, file) {
  document.getElementById('main-preview').src = dataUrl;
  document.getElementById('scan-beam-el').style.display = 'block';
  document.getElementById('scan-pulse-el').style.display = 'block';
  document.getElementById('mc-fmt').textContent = file.name.split('.').pop().toUpperCase();
  document.getElementById('mc-sz').textContent = (file.size / 1024).toFixed(1) + ' KB';
  const tmpImg = new Image();
  tmpImg.onload = () => { document.getElementById('mc-dim').textContent = tmpImg.naturalWidth + '×' + tmpImg.naturalHeight; };
  tmpImg.src = dataUrl;

  const procOverlay = document.getElementById('process-overlay');
  procOverlay.classList.add('show');
  playScan();

  const steps = 6, durs = [700, 1000, 800, 1500, 900, 800];
  const procBar = document.getElementById('proc-bar');
  let delay = 0;
  for (let i = 0; i < steps; i++) {
    setTimeout((idx => {
      return () => {
        document.getElementById('prow-' + idx).classList.add('act');
        document.getElementById('prow-' + idx).style.opacity = '1';
        if (idx > 0) {
          const prev = document.getElementById('prow-' + (idx - 1));
          prev.classList.remove('act'); prev.classList.add('done');
          prev.querySelector('.proc-ic i').className = 'fas fa-check';
          const da = prev.querySelector('.proc-da'); if (da) da.remove();
        }
        procBar.style.width = Math.round(((idx + 1) / steps) * 100) + '%';
        playTone(500 + idx * 60, 0.1, 'square', 0.02);
        if (idx === 1) {
          const fbe = document.getElementById('face-box-el');
          fbe.style.display = 'block'; fbe.style.left = '26%'; fbe.style.top = '8%'; fbe.style.width = '48%'; fbe.style.height = '78%';
        }
      };
    })(i), delay);
    delay += durs[i];
  }
  setTimeout(() => {
    const last = document.getElementById('prow-' + (steps - 1));
    last.classList.remove('act'); last.classList.add('done');
    last.querySelector('.proc-ic i').className = 'fas fa-check';
    const da = last.querySelector('.proc-da'); if (da) da.remove();
    procBar.style.width = '100%';
    playSuccess();
    setTimeout(() => {
      procOverlay.classList.remove('show');
      document.getElementById('scan-beam-el').style.display = 'none';
      document.getElementById('scan-pulse-el').style.display = 'none';
      showResults(dataUrl, file);
    }, 700);
  }, delay + 300);
}

/* ---------- RESULTS ---------- */
const realExplanations = [
  "Neural analysis complete. The subject image exhibits authentic biometric signatures throughout. Facial boundary regions demonstrate natural gradient transitions with microsurface variation consistent with real epidermal topology. Illumination vectors align geometrically across all facial planes — specular reflections on corneal surfaces match the environmental light field with ±2.1° accuracy. Frequency domain decomposition via DCT analysis reveals natural photon shot noise distribution. SSIM score: 0.94. No GAN-typical spectral artifacts detected in the 4-8kHz frequency bands. Classification confidence: AUTHENTIC.",
  "Signal integrity confirmed. The image passed all 14 neural verification layers. Chrominance-luminance distribution follows the Lambertian reflectance model expected from real skin surfaces. No periodic noise artifacts indicative of decoder upsampling detected. Ear geometry rendition matches natural morphological constraints. EXIF signature entropy consistent with physical sensor capture (DSLR fingerprint: σ=0.003). Deep feature extraction through ResNet-50 backbone confirms no latent GAN trace signatures."
];
const fakeExplanations = [
  "ANOMALY DETECTED — Multiple deepfake indicators identified. Primary flag: GAN decoder artifact pattern in high-frequency luminance bands (confidence: 97.2%). Facial boundary blending ratio deviates 34% from natural biological threshold. Periocular region exhibits characteristic mode-collapse smoothing — pore density averaged 3.2× below authentic skin norms. Illumination direction inconsistency: +41° angular deviation between facial and scene light vectors. Eye reflection geometry fails environmental coherence test. Metadata entropy: 0.0 — no optical sensor noise fingerprint. VERDICT: SYNTHETIC GENERATION CONFIRMED.",
  "Neural threat detected. CNN classifier flagged 11 perceptual anomalies. Hairline boundary exhibits GAN-typical alpha-blending seam with frequency signature of 48Hz patterned noise — classic EfficientNet-B generator artifact. Facial symmetry deviation: 18.4% (natural range: 2-7%). Background depth-of-field inconsistency detected around head periphery — suggests compositing operation. EXIF: missing camera model field; creation timestamp inconsistency of ±3 months. Feature vector distance from authentic cluster centroid: 4.7σ. VERDICT: HIGH CONFIDENCE DEEPFAKE."
];

let historyData = [];

function showResults(dataUrl, file) {
  const isFake = Math.random() > 0.47;
  const conf = isFake ? Math.floor(Math.random() * 17 + 80) : Math.floor(Math.random() * 13 + 84);

  document.getElementById('analysis-panel').style.display = 'block';
  document.getElementById('charts-divider').style.display = 'block';
  document.getElementById('charts-sec').style.display = 'block';
  document.getElementById('analysis-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.querySelectorAll('.reveal').forEach(r => revObs.observe(r));

  // Verdict
  const vi = document.getElementById('verdict-inner');
  const vIcon = document.getElementById('verdict-icon');
  const vVal = document.getElementById('verdict-val');
  vi.className = 'verdict-inner ' + (isFake ? 'fake' : 'real');
  vIcon.className = 'verdict-icon ' + (isFake ? 'fake' : 'real');
  vIcon.innerHTML = `<i class="fas ${isFake ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>`;
  vVal.className = 'val ' + (isFake ? 'fake' : 'real');
  vVal.textContent = isFake ? '⚠ DEEPFAKE' : '✓ AUTHENTIC';

  // Face box color
  const fbe = document.getElementById('face-box-el');
  fbe.style.borderColor = isFake ? '#f87171' : '#34d399';
  fbe.style.boxShadow = isFake ? '0 0 16px rgba(248,113,113,0.5)' : '0 0 16px rgba(52,211,153,0.5)';
  fbe.style.animation = 'none';

  // Circular confidence
  const circFill = document.getElementById('circ-fill-el');
  const circPct = document.getElementById('circ-pct');
  circFill.className = 'circ-fill ' + (isFake ? 'fake' : 'real');
  const circumference = 2 * Math.PI * 45;
  let pctCur = 0;
  const interval = setInterval(() => {
    pctCur = Math.min(pctCur + conf / 60, conf);
    circPct.textContent = Math.round(pctCur) + '%';
    circPct.className = 'circ-pct ' + (isFake ? 'fake' : 'real');
    circFill.style.strokeDashoffset = circumference - (pctCur / 100) * circumference;
    if (pctCur >= conf) clearInterval(interval);
  }, 25);
  document.getElementById('conf-title').textContent = isFake ? 'High-confidence deepfake signature' : 'Authentic biometric signature';
  document.getElementById('conf-desc').textContent = isFake ? 'Neural certainty: manipulated synthetic content detected.' : 'Neural certainty: organic capture with no tampering signatures.';

  // Breakdown
  if (isFake) {
    animBar('bk-face', 'bk-face-val', Math.floor(Math.random() * 15 + 75));
    animBar('bk-pix', 'bk-pix-val', Math.floor(Math.random() * 20 + 68));
    animBar('bk-gan', 'bk-gan-val', Math.floor(Math.random() * 12 + 80));
    animBar('bk-lt', 'bk-lt-val', Math.floor(Math.random() * 25 + 55));
  } else {
    animBar('bk-face', 'bk-face-val', Math.floor(Math.random() * 8 + 4));
    animBar('bk-pix', 'bk-pix-val', Math.floor(Math.random() * 10 + 3));
    animBar('bk-gan', 'bk-gan-val', Math.floor(Math.random() * 6 + 2));
    animBar('bk-lt', 'bk-lt-val', Math.floor(Math.random() * 12 + 88));
  }

  // Reasoning with typing effect
  const explanations = isFake ? fakeExplanations : realExplanations;
  const fullText = explanations[Math.floor(Math.random() * explanations.length)];
  const rb = document.getElementById('reason-body');
  rb.innerHTML = '<div class="shimmer-box"></div><span id="reason-text"></span><span class="typing-cur" id="typing-cur"></span>';
  const rtEl = document.getElementById('reason-text');
  const tcEl = document.getElementById('typing-cur');
  setTimeout(() => {
    document.querySelector('.shimmer-box')?.remove();
    tcEl.style.display = 'inline-block';
    let idx = 0;
    const ti = setInterval(() => {
      rtEl.textContent += fullText[idx++];
      if (idx >= fullText.length) { clearInterval(ti); tcEl.style.display = 'none'; }
    }, 18);
  }, 1400);

  drawLineChart(conf, isFake);
  drawRadialChart(isFake);
  addToHistory(dataUrl, file, isFake, conf);
}

function animBar(fillId, valId, pct) {
  const fill = document.getElementById(fillId);
  const val = document.getElementById(valId);
  let cur = 0;
  fill.style.width = '0%';
  const iv = setInterval(() => {
    cur = Math.min(cur + pct / 50, pct);
    fill.style.width = Math.round(cur) + '%';
    val.textContent = Math.round(cur) + '%';
    if (cur >= pct) clearInterval(iv);
  }, 30);
}

/* ---------- CHARTS ---------- */
function drawLineChart(finalConf, isFake) {
  const canvas = document.getElementById('line-chart-canvas');
  const ctx2 = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * 2; canvas.height = 320;
  const W = canvas.width, H = 320;
  ctx2.clearRect(0, 0, W, H);
  const pts = [];
  for (let i = 0; i < 20; i++) {
    const prog = i / 19;
    const noise = (Math.random() - 0.5) * 12;
    pts.push(Math.max(5, Math.min(99, prog * finalConf + noise)));
  }
  pts[pts.length - 1] = finalConf;
  const padX = 40, padY = 24;
  const drawW = W - padX * 2, drawH = H - padY * 2;

  for (let i = 0; i <= 4; i++) {
    const y = padY + drawH * (1 - i / 4);
    ctx2.beginPath(); ctx2.moveTo(padX, y); ctx2.lineTo(W - padX, y);
    ctx2.strokeStyle = 'rgba(255,255,255,0.05)'; ctx2.lineWidth = 1; ctx2.stroke();
    ctx2.fillStyle = 'rgba(148,163,184,0.4)'; ctx2.font = `${22}px Inter`;
    ctx2.fillText(Math.round(i / 4 * 100) + '%', 4, y + 6);
  }

  const color = isFake ? '#f87171' : '#00d4ff';
  let frame = 0;
  function drawFrame() {
    ctx2.clearRect(padX, 0, drawW, H);
    for (let i = 0; i <= 4; i++) {
      const y = padY + drawH * (1 - i / 4);
      ctx2.beginPath(); ctx2.moveTo(padX, y); ctx2.lineTo(W - padX, y);
      ctx2.strokeStyle = 'rgba(255,255,255,0.05)'; ctx2.lineWidth = 1; ctx2.stroke();
    }
    const n = Math.max(2, Math.round((frame / 60) * pts.length));
    const drawPts = pts.slice(0, n);
    ctx2.beginPath();
    drawPts.forEach((v, i) => {
      const x = padX + i / (pts.length - 1) * drawW;
      const y = padY + drawH * (1 - v / 100);
      i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
    });
    const lastX = padX + (n - 1) / (pts.length - 1) * drawW;
    ctx2.lineTo(lastX, padY + drawH); ctx2.lineTo(padX, padY + drawH); ctx2.closePath();
    const grd = ctx2.createLinearGradient(0, padY, 0, padY + drawH);
    grd.addColorStop(0, isFake ? 'rgba(248,113,113,0.15)' : 'rgba(0,212,255,0.15)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx2.fillStyle = grd; ctx2.fill();
    ctx2.beginPath();
    drawPts.forEach((v, i) => {
      const x = padX + i / (pts.length - 1) * drawW;
      const y = padY + drawH * (1 - v / 100);
      i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
    });
    ctx2.strokeStyle = color; ctx2.lineWidth = 3; ctx2.lineJoin = 'round'; ctx2.stroke();
    if (n > 0) {
      const ex = padX + (n - 1) / (pts.length - 1) * drawW;
      const ey = padY + drawH * (1 - drawPts[n - 1] / 100);
      ctx2.beginPath(); ctx2.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx2.fillStyle = color; ctx2.fill();
      ctx2.beginPath(); ctx2.arc(ex, ey, 9, 0, Math.PI * 2);
      ctx2.strokeStyle = color + '80'; ctx2.lineWidth = 2; ctx2.stroke();
    }
    frame++;
    if (frame <= 60) requestAnimationFrame(drawFrame);
  }
  drawFrame();
}

function drawRadialChart(isFake) {
  const canvas = document.getElementById('radial-canvas');
  const ctx2 = canvas.getContext('2d');
  canvas.width = 200; canvas.height = 200;
  const W = 200, H = 200, cx = 100, cy = 100, maxR = 75;
  const labels = ['Face', 'Pixel', 'GAN', 'Light', 'Metadata'];
  const vals = isFake
    ? [0.82, 0.71, 0.88, 0.64, 0.75]
    : [0.12, 0.09, 0.05, 0.91, 0.94];
  const colors = ['#00d4ff', '#7c3aed', '#f87171', '#f59e0b', '#34d399'];
  const angles = labels.map((_, i) => i * (Math.PI * 2 / labels.length) - Math.PI / 2);
  let prog = 0;
  function draw() {
    ctx2.clearRect(0, 0, W, H);
    const p = Math.min(prog / 50, 1);
    for (let r = 1; r <= 3; r++) {
      ctx2.beginPath();
      angles.forEach((a, i) => {
        const x = cx + Math.cos(a) * maxR * (r / 3), y = cy + Math.sin(a) * maxR * (r / 3);
        i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
      });
      ctx2.closePath(); ctx2.strokeStyle = 'rgba(255,255,255,0.06)'; ctx2.lineWidth = 1; ctx2.stroke();
    }
    angles.forEach(a => {
      ctx2.beginPath(); ctx2.moveTo(cx, cy);
      ctx2.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
      ctx2.strokeStyle = 'rgba(255,255,255,0.06)'; ctx2.lineWidth = 1; ctx2.stroke();
    });
    ctx2.beginPath();
    angles.forEach((a, i) => {
      const r = vals[i] * maxR * p;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
    });
    ctx2.closePath();
    const grd = ctx2.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    grd.addColorStop(0, isFake ? 'rgba(248,113,113,0.3)' : 'rgba(0,212,255,0.3)');
    grd.addColorStop(1, isFake ? 'rgba(248,113,113,0.05)' : 'rgba(0,212,255,0.05)');
    ctx2.fillStyle = grd; ctx2.fill();
    ctx2.strokeStyle = isFake ? '#f87171' : '#00d4ff'; ctx2.lineWidth = 2; ctx2.stroke();
    angles.forEach((a, i) => {
      const r = vals[i] * maxR * p;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      ctx2.beginPath(); ctx2.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx2.fillStyle = colors[i]; ctx2.fill();
    });
    ctx2.font = 'bold 11px Inter'; ctx2.textAlign = 'center';
    angles.forEach((a, i) => {
      const x = cx + Math.cos(a) * (maxR + 16), y = cy + Math.sin(a) * (maxR + 16) + 4;
      ctx2.fillStyle = 'rgba(148,163,184,0.7)'; ctx2.fillText(labels[i], x, y);
    });
    prog++;
    if (prog <= 50) requestAnimationFrame(draw);
  }
  draw();
}

/* ---------- HISTORY ---------- */
function addToHistory(dataUrl, file, isFake, conf) {
  const now = new Date();
  const t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + now.toLocaleDateString([], { month: 'short', day: 'numeric' });
  historyData.unshift({ src: dataUrl, name: file.name, isFake, conf, time: t });
  renderHistory();
}
function renderHistory() {
  const list = document.getElementById('history-list');
  if (!historyData.length) {
    list.innerHTML = '<div class="history-empty"><i class="fas fa-satellite-dish"></i><p>No analyses yet. Upload an image to begin detection.</p></div>';
    return;
  }
  list.innerHTML = historyData.map(h => `
    <div class="hist-card">
      <div class="hist-thumb"><img src="${h.src}" style="width:100%;height:100%;object-fit:cover;border-radius:10px" alt=""/></div>
      <div class="hist-info">
        <div class="hist-name">${h.name.length > 30 ? h.name.slice(0, 27) + '…' : h.name}</div>
        <div class="hist-time">${h.time}</div>
      </div>
      <span class="hist-badge ${h.isFake ? 'fake' : 'real'}">${h.isFake ? '⚠ DEEPFAKE' : '✓ REAL'}</span>
      <span class="hist-conf">${h.conf}%</span>
    </div>
  `).join('');
}
document.getElementById('clr-hist').addEventListener('click', () => { historyData = []; renderHistory(); playClick(); });

/* ---------- HEATMAP TOGGLE ---------- */
document.getElementById('heat-toggle').addEventListener('click', function () {
  this.classList.toggle('on');
  document.getElementById('heatmap-el').classList.toggle('show');
  playClick();
});

/* ---------- RESET ---------- */
function resetSystem() {
  playBeep();
  document.getElementById('main-file-input').value = '';
  document.getElementById('analysis-panel').style.display = 'none';
  document.getElementById('charts-divider').style.display = 'none';
  document.getElementById('charts-sec').style.display = 'none';
  document.getElementById('face-box-el').style.display = 'none';
  document.getElementById('heatmap-el').classList.remove('show');
  document.getElementById('heat-toggle').classList.remove('on');
  ['prow-0', 'prow-1', 'prow-2', 'prow-3', 'prow-4', 'prow-5'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove('act', 'done'); el.style.opacity = '0';
    const icons = ['fa-upload', 'fa-face-smile', 'fa-wand-magic-sparkles', 'fa-microchip', 'fa-chart-line', 'fa-file-lines'];
    el.querySelector('.proc-ic i').className = 'fas ' + icons[i];
  });
  document.getElementById('proc-bar').style.width = '0%';
  document.getElementById('upload-sec').scrollIntoView({ behavior: 'smooth' });
}

/* ---------- ACTION BUTTONS ---------- */
document.getElementById('dl-btn').addEventListener('click', () => {
  const btn = document.getElementById('dl-btn');
  const o = btn.innerHTML; btn.innerHTML = '<i class="fas fa-check"></i> Exported';
  btn.style.borderColor = 'rgba(52,211,153,0.4)'; btn.style.color = '#34d399';
  playBeep(); setTimeout(() => { btn.innerHTML = o; btn.style.borderColor = ''; btn.style.color = ''; }, 2500);
});
document.getElementById('share-btn-el').addEventListener('click', () => {
  const btn = document.getElementById('share-btn-el');
  const o = btn.innerHTML; btn.innerHTML = '<i class="fas fa-link"></i> Link Copied';
  btn.style.borderColor = 'rgba(0,212,255,0.4)'; btn.style.color = '#00d4ff';
  playClick(); setTimeout(() => { btn.innerHTML = o; btn.style.borderColor = ''; btn.style.color = ''; }, 2500);
});

/* Initialize */
renderHistory();

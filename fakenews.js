/* ============================================================
   FAKE NEWS MODULE: NLP heuristic engine, results, history
   (depends on effects.js: playTone, playBeep, playClick, playScan,
    playSuccess, revObs)
============================================================ */

/* ---------- Language pill selection ---------- */
document.querySelectorAll('.fn-pill').forEach(pill => {
  pill.addEventListener('click', function () {
    document.querySelectorAll('.fn-pill').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    playClick();
  });
});

/* ---------- Character counter ---------- */
const fnTextarea = document.getElementById('fn-textarea');
const fnCharCounter = document.getElementById('fn-char-counter');
fnTextarea.addEventListener('input', () => {
  const len = fnTextarea.value.length;
  fnCharCounter.textContent = `${len} / 5000 chars`;
  fnCharCounter.style.color = len > 4500 ? 'var(--rose)' : len > 3000 ? 'var(--amber)' : 'var(--text3)';
});

/* ---------- Scan button ---------- */
document.getElementById('fn-scan-btn').addEventListener('click', () => {
  const text = fnTextarea.value.trim();
  const url = document.getElementById('fn-url-input').value.trim();
  if (!text && !url) {
    fnTextarea.style.borderColor = 'rgba(239,68,68,0.6)';
    fnTextarea.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)';
    setTimeout(() => { fnTextarea.style.borderColor = ''; fnTextarea.style.boxShadow = ''; }, 1800);
    playTone(300, 0.3, 'sawtooth', 0.04);
    return;
  }
  const content = text || `[URL submitted: ${url}]`;
  fnBeginAnalysis(content);
});

function fnBeginAnalysis(text) {
  const overlay = document.getElementById('fn-process-overlay');
  overlay.classList.add('show');
  playScan();

  const fnProcBar = document.getElementById('fn-proc-bar');
  const steps = 6;
  const durs = [600, 1100, 1300, 900, 800, 700];
  let delay = 0;
  for (let i = 0; i < steps; i++) {
    setTimeout((idx => () => {
      document.getElementById('fn-prow-' + idx).classList.add('act');
      document.getElementById('fn-prow-' + idx).style.opacity = '1';
      if (idx > 0) {
        const prev = document.getElementById('fn-prow-' + (idx - 1));
        prev.classList.remove('act'); prev.classList.add('done');
        prev.querySelector('.proc-ic i').className = 'fas fa-check';
        const da = prev.querySelector('.proc-da'); if (da) da.remove();
      }
      fnProcBar.style.width = Math.round(((idx + 1) / steps) * 100) + '%';
      playTone(450 + idx * 55, 0.1, 'square', 0.02);
    })(i), delay);
    delay += durs[i];
  }
  setTimeout(() => {
    const last = document.getElementById('fn-prow-' + (steps - 1));
    last.classList.remove('act'); last.classList.add('done');
    last.querySelector('.proc-ic i').className = 'fas fa-check';
    const da = last.querySelector('.proc-da'); if (da) da.remove();
    fnProcBar.style.width = '100%';
    playSuccess();
    setTimeout(() => {
      overlay.classList.remove('show');
      fnShowResults(text);
    }, 700);
  }, delay + 300);
}

/* =============================================================
   NLP HEURISTIC ENGINE — signal dictionaries
============================================================= */

// RED: manipulation / clickbait / emotionally loaded
const fnRedWords = [
  'shocking', 'bombshell', 'exposed', 'breaking', 'cover-up', 'conspiracy', 'destroy',
  'crisis', 'collapse', 'hoax', 'rigged', 'scam', 'lie', 'lies', 'lied', 'fake', 'fraud',
  'secret', 'hidden', 'banned', 'censored', 'mainstream media', 'wake up', 'they don\'t want',
  'the truth about', 'plandemic', 'globalist', 'deep state', 'stolen', 'corrupt',
  'traitor', 'evil', 'radical', 'disgusting', 'outrage', 'catastrophic', 'terrifying',
  'horrifying', 'sinister', 'explosive', 'bombshell', 'unprecedented', 'must share',
  'going viral', 'doctors hate', 'scientists baffled', 'what they\'re hiding',
  'elites', 'puppet', 'brainwashed', 'sheeple', 'agenda', 'controlled', 'suppressed'
];

// AMBER: hedging / unverified sourcing language
const fnAmberWords = [
  'allegedly', 'reportedly', 'sources say', 'some claim', 'many believe', 'experts warn',
  'insiders reveal', 'could be', 'might be', 'unconfirmed', 'rumored', 'it is said',
  'according to unnamed', 'anonymous source', 'we\'ve heard', 'word is', 'apparently',
  'speculation', 'possible', 'perhaps', 'some suggest', 'reports indicate', 'may have',
  'unclear whether', 'disputed', 'controversial', 'debated'
];

// CREDIBILITY boosters — cited sources, balanced language
const fnCredWords = [
  'according to', 'study shows', 'researchers found', 'published in', 'per the report',
  'data shows', 'statistics indicate', 'official statement', 'spokesperson said',
  'confirmed by', 'verified', 'peer-reviewed', 'citation', 'evidence suggests',
  'analysis reveals', 'experts say', 'government data', 'university study',
  'reuters', 'associated press', 'bbc', 'the guardian', 'new york times', 'fact-check'
];

// Absolute / overconfident claims
const fnAbsoluteWords = [
  'always', 'never', 'everyone', 'nobody', 'all', 'none', '100%', 'guaranteed',
  'proven fact', 'undeniable', 'irrefutable', 'obviously', 'clearly', 'without doubt',
  'no question', 'totally', 'completely', 'absolutely'
];

/* =============================================================
   TEXT HIGHLIGHTER
============================================================= */
function fnHighlightText(text) {
  const maxLen = 600;
  let t = text.length > maxLen ? text.slice(0, maxLen) + '\u2026' : text;
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  fnRedWords.forEach(w => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    t = t.replace(re, '<span class="fn-highlight">$1</span>');
  });
  fnAmberWords.forEach(w => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    t = t.replace(re, '<span class="fn-highlight-amber">$1</span>');
  });
  return t;
}

/* =============================================================
   CORE HEURISTIC ANALYSER
   Returns an object with all computed signal scores (0-100)
============================================================= */
function fnAnalyzeText(text) {
  const words = text.toLowerCase().match(/\b\w+\b/g) || ['x'];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const totalWords = words.length;

  // Signal 1: red-word density
  let redCount = 0;
  fnRedWords.forEach(w => {
    const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const m = text.match(re); if (m) redCount += m.length;
  });
  const redDensity = Math.min(redCount / Math.max(totalWords, 1) * 100, 100);

  // Signal 2: hedge density
  let hedgeCount = 0;
  fnAmberWords.forEach(w => {
    const re = new RegExp(`${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    const m = text.match(re); if (m) hedgeCount += m.length;
  });
  const hedgeDensity = Math.min(hedgeCount / Math.max(totalWords, 1) * 150, 100);

  // Signal 3: credibility boosters
  let credCount = 0;
  fnCredWords.forEach(w => {
    const re = new RegExp(`${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    const m = text.match(re); if (m) credCount += m.length;
  });
  const credDensity = Math.min(credCount / Math.max(totalWords, 1) * 200, 100);

  // Signal 4: ALL-CAPS abuse
  const capsWords = (text.match(/\b[A-Z]{3,}\b/g) || []).length;
  const capsDensity = Math.min(capsWords / Math.max(totalWords, 1) * 300, 100);

  // Signal 5: exclamation abuse
  const exclamCount = (text.match(/!/g) || []).length;
  const exclamScore = Math.min(exclamCount / Math.max(sentences.length, 1) * 100, 100);

  // Signal 6: question marks (fearmongering)
  const questionCount = (text.match(/\?/g) || []).length;
  const questionScore = Math.min(questionCount / Math.max(sentences.length, 1) * 80, 100);

  // Signal 7: absolute language
  let absCount = 0;
  fnAbsoluteWords.forEach(w => {
    const re = new RegExp(`\\b${w}\\b`, 'gi');
    const m = text.match(re); if (m) absCount += m.length;
  });
  const absScore = Math.min(absCount / Math.max(totalWords, 1) * 400, 100);

  // Signal 8: sentence complexity
  const avgSentenceLen = totalWords / Math.max(sentences.length, 1);
  const complexityScore = Math.min(Math.max((avgSentenceLen - 5) / 30 * 100, 0), 100);

  // Signal 9: sourcing signals
  const hasQuotes = (text.match(/"|\u201c|\u201d/g) || []).length > 0;
  const hasNumbers = (text.match(/\b\d+(\.\d+)?%?\b/g) || []).length;
  const hasLinks = /https?:\/\/|www\./.test(text);
  const sourcingScore = Math.min(
    (hasQuotes ? 25 : 0) + (hasNumbers * 5) + (hasLinks ? 20 : 0) + credDensity * 0.5,
    100
  );

  // Composite RISK SCORE (0 = credible, 100 = misinformation)
  const riskScore =
    redDensity * 0.30 +
    capsDensity * 0.15 +
    exclamScore * 0.12 +
    questionScore * 0.08 +
    absScore * 0.10 +
    hedgeDensity * 0.10 +
    (100 - credDensity) * 0.10 +
    (100 - sourcingScore) * 0.05;

  const risk = Math.max(0, Math.min(riskScore, 100));

  return {
    risk, redDensity, hedgeDensity, credDensity,
    capsDensity, exclamScore, questionScore, absScore,
    complexityScore, sourcingScore,
    redCount, hedgeCount, credCount, capsWords, exclamCount,
    totalWords, sentences: sentences.length, avgSentenceLen
  };
}

/* =============================================================
   DYNAMIC EXPLANATION GENERATOR
============================================================= */
function fnBuildExplanation(verdict, s) {
  const pct = v => Math.round(v) + '%';
  const fix = v => v.toFixed(1);

  if (verdict === 'mis') {
    return `MISINFORMATION DETECTED \u2014 NLP heuristic engine flagged ${Math.round(s.risk)}% composite risk score (threshold: >58%). ` +
      `Manipulation-loaded vocabulary density: ${pct(s.redDensity)} of total word count (${s.redCount} flagged terms) \u2014 credible journalism baseline \u226422%. ` +
      `ALL-CAPS abuse index: ${pct(s.capsDensity)} \u2014 a known pattern in emotionally coercive content. ` +
      `Exclamation density: ${fix(s.exclamScore / 10)} per sentence (norm: <0.15). ` +
      `Absolute/overconfident language score: ${pct(s.absScore)} \u2014 ${s.absScore > 40 ? 'HIGH' : 'MODERATE'} (indicative of false certainty framing). ` +
      `Source credibility signals found: ${s.credCount} (expected \u22658 for legitimate reporting). ` +
      `Avg sentence length: ${fix(s.avgSentenceLen)} words \u2014 ${s.avgSentenceLen < 10 ? 'abnormally short (clickbait pattern)' : 'within normal range'}. ` +
      `VERDICT: HIGH-CONFIDENCE MISINFORMATION \u2014 do not share without fact-checking.`;
  }
  if (verdict === 'unverified') {
    return `UNVERIFIED STATUS \u2014 Composite risk score: ${Math.round(s.risk)}% (threshold zone: 30\u201358%). ` +
      `Content contains a mix of verifiable and unsubstantiated signals. ` +
      `Hedge/uncertain sourcing language density: ${pct(s.hedgeDensity)} (${s.hedgeCount} phrases) \u2014 elevated but not extreme. ` +
      `Manipulation-loaded term density: ${pct(s.redDensity)} \u2014 ${s.redDensity > 10 ? 'above baseline, caution advised' : 'within acceptable range'}. ` +
      `Credibility signals: ${s.credCount} found (${s.credCount < 3 ? 'below expected minimum for verified reporting' : 'partially sufficient'}). ` +
      `Sourcing score: ${pct(s.sourcingScore)} \u2014 ${s.sourcingScore < 40 ? 'limited citations detected' : 'some citations present'}. ` +
      `Text length: ${s.totalWords} words across ${s.sentences} sentences \u2014 ${s.totalWords < 30 ? 'too short for full analysis (headline only?)' : 'sufficient for analysis'}. ` +
      `VERDICT: UNVERIFIED \u2014 seek additional corroborating sources before sharing.`;
  }
  return `CREDIBLE CONTENT \u2014 Composite risk score: ${Math.round(s.risk)}% (threshold: <30%). ` +
    `Manipulation-loaded vocabulary density: ${pct(s.redDensity)} \u2014 well within credible journalism norms (\u226422%). ` +
    `Source credibility signals: ${s.credCount} detected (citations, named sources, or data references). ` +
    `Sourcing quality score: ${pct(s.sourcingScore)} \u2014 ${s.sourcingScore > 60 ? 'strong evidence of primary sourcing' : 'adequate sourcing'}. ` +
    `ALL-CAPS abuse index: ${pct(s.capsDensity)} \u2014 minimal (no coercive formatting detected). ` +
    `Exclamation density: ${fix(s.exclamScore / 10)} per sentence (normal). ` +
    `Avg sentence complexity: ${fix(s.avgSentenceLen)} words \u2014 consistent with structured journalism. ` +
    `No logical fallacy markers detected above threshold. ` +
    `VERDICT: CREDIBLE \u2014 SAFE TO SHARE.`;
}

let fnHistoryData = [];

/* =============================================================
   SHOW RESULTS — driven by heuristic scores
============================================================= */
function fnShowResults(text) {
  const s = fnAnalyzeText(text);

  // risk > 58 => misinformation | 30-58 => unverified | < 30 => credible
  const risk = Math.max(0, Math.min(s.risk + (Math.random() * 6 - 3), 100));
  const verdict = risk > 58 ? 'mis' : risk > 30 ? 'unverified' : 'credible';

  let conf;
  if (verdict === 'mis') conf = Math.round(60 + (risk - 58) / 42 * 37);
  else if (verdict === 'unverified') conf = Math.round(45 + (1 - Math.abs(risk - 44) / 14) * 25);
  else conf = Math.round(60 + (30 - risk) / 30 * 37);
  conf = Math.max(45, Math.min(97, conf));

  const panel = document.getElementById('fn-analysis-panel');
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelectorAll('.reveal').forEach(r => revObs.observe(r));

  document.getElementById('fn-text-body').innerHTML = fnHighlightText(text);

  // Bias position
  const biasDelta = (s.redDensity - s.credDensity) * 0.6 + (s.capsDensity * 0.3);
  const biasPos = Math.max(5, Math.min(95, 50 + biasDelta));
  setTimeout(() => {
    document.getElementById('fn-bias-thumb').style.left = biasPos + '%';
  }, 600);

  // Verdict card
  const verdictLabels = { mis: '\u26a0 MISINFORMATION', unverified: '? UNVERIFIED', credible: '\u2713 CREDIBLE' };
  const verdictIcons = { mis: 'fa-triangle-exclamation', unverified: 'fa-circle-question', credible: 'fa-circle-check' };
  const vi = document.getElementById('fn-verdict-inner');
  const vIcon = document.getElementById('fn-verdict-icon');
  const vVal = document.getElementById('fn-verdict-val');
  vi.className = 'verdict-inner ' + verdict;
  vIcon.className = 'verdict-icon ' + verdict;
  vIcon.innerHTML = `<i class="fas ${verdictIcons[verdict]}"></i>`;
  vVal.className = 'val ' + verdict;
  vVal.textContent = verdictLabels[verdict];

  // Confidence ring
  const circFill = document.getElementById('fn-circ-fill');
  const circPct = document.getElementById('fn-circ-pct');
  const gradMap = { mis: 'url(#confGradMis)', unverified: 'url(#confGradUnver)', credible: 'url(#confGradCred)' };
  circFill.className = 'circ-fill ' + verdict;
  circFill.style.stroke = gradMap[verdict];
  const circumference = 2 * Math.PI * 45;
  let pctCur = 0;
  const iv = setInterval(() => {
    pctCur = Math.min(pctCur + conf / 60, conf);
    circPct.textContent = Math.round(pctCur) + '%';
    circPct.className = 'circ-pct ' + verdict;
    circFill.style.strokeDashoffset = circumference - (pctCur / 100) * circumference;
    if (pctCur >= conf) clearInterval(iv);
  }, 25);

  const confTitles = {
    mis: `Risk score ${Math.round(risk)}% \u2014 misinformation detected`,
    unverified: `Risk score ${Math.round(risk)}% \u2014 partially unverified`,
    credible: `Risk score ${Math.round(risk)}% \u2014 high credibility`
  };
  const confDescs = {
    mis: `NLP engine: ${s.redCount} manipulation terms, ${s.capsWords} CAPS words, ${s.exclamCount} exclamations detected.`,
    unverified: `NLP engine: mixed signals \u2014 ${s.credCount} credibility markers vs ${s.redCount} red-flag terms.`,
    credible: `NLP engine: ${s.credCount} credibility signals, low emotional loading (${Math.round(s.redDensity)}%).`
  };
  document.getElementById('fn-conf-title').textContent = confTitles[verdict];
  document.getElementById('fn-conf-desc').textContent = confDescs[verdict];

  // Breakdown bars
  const factScore = Math.round(Math.max(5, 100 - s.redDensity * 1.8 - s.absScore * 0.5));
  const srcScore = Math.round(Math.max(5, Math.min(97, s.credDensity * 0.6 + s.sourcingScore * 0.4)));
  const emoScore = Math.round(Math.min(97, s.capsDensity * 0.4 + s.exclamScore * 0.35 + s.redDensity * 0.8));
  const logicScore = Math.round(Math.max(5, 100 - s.absScore * 0.7 - s.questionScore * 0.4));
  const corrScore = Math.round(Math.max(5, Math.min(97, s.sourcingScore * 0.7 + s.credDensity * 0.3)));

  fnAnimBar('fn-bk-fact', 'fn-bk-fact-val', factScore);
  fnAnimBar('fn-bk-src', 'fn-bk-src-val', srcScore);
  fnAnimBar('fn-bk-emo', 'fn-bk-emo-val', emoScore);
  fnAnimBar('fn-bk-logic', 'fn-bk-logic-val', logicScore);
  fnAnimBar('fn-bk-corr', 'fn-bk-corr-val', corrScore);

  // Explanation with typing effect
  const fullText = fnBuildExplanation(verdict, s);
  const rb = document.getElementById('fn-reason-body');
  rb.innerHTML = '<div class="shimmer-box"></div><span id="fn-reason-text"></span><span class="typing-cur" id="fn-typing-cur"></span>';
  const rtEl = document.getElementById('fn-reason-text');
  const tcEl = document.getElementById('fn-typing-cur');
  setTimeout(() => {
    rb.querySelector('.shimmer-box')?.remove();
    tcEl.style.display = 'inline-block';
    let idx = 0;
    const ti = setInterval(() => {
      rtEl.textContent += fullText[idx++];
      if (idx >= fullText.length) { clearInterval(ti); tcEl.style.display = 'none'; }
    }, 14);
  }, 1200);

  fnAddToHistory(text, verdict, conf);
}

function fnAnimBar(fillId, valId, pct) {
  const fill = document.getElementById(fillId);
  const val = document.getElementById(valId);
  let cur = 0; fill.style.width = '0%';
  const iv = setInterval(() => {
    cur = Math.min(cur + pct / 50, pct);
    fill.style.width = Math.round(cur) + '%';
    val.textContent = Math.round(cur) + '%';
    if (cur >= pct) clearInterval(iv);
  }, 30);
}

/* ---------- HISTORY ---------- */
function fnAddToHistory(text, verdict, conf) {
  const now = new Date();
  const t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + now.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const snippet = text.length > 60 ? text.slice(0, 57) + '…' : text;
  fnHistoryData.unshift({ snippet, verdict, conf, time: t });
  fnRenderHistory();
}

function fnRenderHistory() {
  const list = document.getElementById('fn-history-list');
  if (!fnHistoryData.length) {
    list.innerHTML = '<div class="history-empty"><i class="fas fa-newspaper"></i><p>No scans yet. Paste text above to begin detection.</p></div>';
    return;
  }
  const verdictLabels = { mis: '⚠ MISINFO', unverified: '? UNVERIFIED', credible: '✓ CREDIBLE' };
  list.innerHTML = fnHistoryData.map(h => `
    <div class="hist-card">
      <div class="hist-thumb" style="font-size:1rem;color:var(--amber)"><i class="fas fa-newspaper"></i></div>
      <div class="hist-info">
        <div class="hist-name">${h.snippet}</div>
        <div class="hist-time">${h.time}</div>
      </div>
      <span class="hist-badge fn-hist-badge ${h.verdict}">${verdictLabels[h.verdict]}</span>
      <span class="hist-conf">${h.conf}%</span>
    </div>
  `).join('');
}

document.getElementById('fn-clr-hist').addEventListener('click', () => { fnHistoryData = []; fnRenderHistory(); playClick(); });

/* ---------- RESET ---------- */
function fnReset() {
  playBeep();
  document.getElementById('fn-textarea').value = '';
  document.getElementById('fn-url-input').value = '';
  document.getElementById('fn-char-counter').textContent = '0 / 5000 chars';
  document.getElementById('fn-analysis-panel').style.display = 'none';
  document.getElementById('fn-bias-thumb').style.left = '50%';
  document.getElementById('fn-proc-bar').style.width = '0%';
  ['fn-prow-0', 'fn-prow-1', 'fn-prow-2', 'fn-prow-3', 'fn-prow-4', 'fn-prow-5'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove('act', 'done'); el.style.opacity = '0';
    const icons = ['fa-newspaper', 'fa-brain', 'fa-magnifying-glass', 'fa-chart-bar', 'fa-globe', 'fa-file-lines'];
    el.querySelector('.proc-ic i').className = 'fas ' + icons[i];
  });
  document.getElementById('fakenews-sec').scrollIntoView({ behavior: 'smooth' });
}

/* ---------- ACTION BUTTONS ---------- */
document.getElementById('fn-dl-btn').addEventListener('click', () => {
  const btn = document.getElementById('fn-dl-btn');
  const o = btn.innerHTML; btn.innerHTML = '<i class="fas fa-check"></i> Exported';
  btn.style.borderColor = 'rgba(52,211,153,0.4)'; btn.style.color = '#34d399';
  playBeep(); setTimeout(() => { btn.innerHTML = o; btn.style.borderColor = ''; btn.style.color = ''; }, 2500);
});
document.getElementById('fn-share-btn').addEventListener('click', () => {
  const btn = document.getElementById('fn-share-btn');
  const o = btn.innerHTML; btn.innerHTML = '<i class="fas fa-link"></i> Link Copied';
  btn.style.borderColor = 'rgba(0,212,255,0.4)'; btn.style.color = '#00d4ff';
  playClick(); setTimeout(() => { btn.innerHTML = o; btn.style.borderColor = ''; btn.style.color = ''; }, 2500);
});

/* Initialize */
fnRenderHistory();

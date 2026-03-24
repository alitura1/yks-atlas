import { IMGS, QUESTIONS, TOPICS, YEAR_COLORS, MEB_DATA } from './data/tyt_geo.js';
import { IMGS as AYT_IMGS, QUESTIONS as AYT_QUESTIONS } from './data/ayt_mat.js';

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  tyt:    { activeYear: 'all', activeTopic: 'all', visibleQs: [], lbIdx: 0 },
  aytmat: { activeYear: 'all', activeTopic: 'all', visibleQs: [], lbIdx: 0 },
};
let currentPage = 'tyt';
let currentAnswer = null; // correct answer for open LB question
let answered = false;

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  buildTopicList('tyt', TOPICS);
  buildTopicList('aytmat', getAytMatTopics());
  renderGrid('tyt');
  renderGrid('aytmat');
}

// ─── AYT Mat Topics ────────────────────────────────────────────────────────────
function getAytMatTopics() {
  return [{ id:'all', label:'Tümü', color:'#4f9cf9', dot:'#4f9cf9' }];
}

// ─── Topic list ───────────────────────────────────────────────────────────────
function buildTopicList(page, topics) {
  const qs = page === 'tyt' ? QUESTIONS : [];
  const el = document.getElementById(`${page}-topicList`);
  if (!el) return;
  el.innerHTML = topics.map(t => {
    const count = t.id === 'all' ? qs.length : qs.filter(q => q.topic === t.id).length;
    return `<div class="topic-item ${t.id==='all' ? 'active' : ''}" id="${page}-ti-${t.id}" onclick="filterTopic('${t.id}','${page}')">
      <div class="topic-dot" style="background:${t.dot}"></div>
      <span class="topic-name">${t.label}</span>
      <span class="topic-count">${count}</span>
    </div>`;
  }).join('');
}

// ─── Filter helpers ───────────────────────────────────────────────────────────
window.filterYear = function(yr, page) {
  page = page || currentPage;
  state[page].activeYear = yr;
  document.querySelectorAll(`#${page}-year-btns .year-btn`).forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderGrid(page);
};

window.filterTopic = function(t, page) {
  page = page || currentPage;
  state[page].activeTopic = t;
  document.querySelectorAll(`#${page}-topicList .topic-item`).forEach(el => el.classList.remove('active'));
  const el = document.getElementById(`${page}-ti-${t}`);
  if (el) el.classList.add('active');
  renderGrid(page);
};

// ─── Grid render ──────────────────────────────────────────────────────────────
function getQs(page) {
  return page === 'tyt' ? QUESTIONS : AYT_QUESTIONS;
}

function renderGrid(page) {
  const s = state[page];
  const allQs = getQs(page);
  s.visibleQs = allQs.filter(q => {
    const yearOk = s.activeYear === 'all' || String(q.yr) === s.activeYear;
    const topicOk = s.activeTopic === 'all' || q.topic === s.activeTopic;
    return yearOk && topicOk;
  });

  const topicLabel = s.activeTopic === 'all' ? 'Tüm konular' : (TOPICS.find(t=>t.id===s.activeTopic)?.label || s.activeTopic);
  const countEl = document.getElementById(`${page}-countChip`);
  const filterEl = document.getElementById(`${page}-filterChip`);
  if (countEl) countEl.textContent = s.visibleQs.length + ' soru';
  if (filterEl) filterEl.textContent = s.activeYear === 'all' ? 'Tüm yıllar · ' + topicLabel : s.activeYear + ' · ' + topicLabel;

  const grid = document.getElementById(`${page}-qGrid`);
  if (!grid) return;

  if (s.visibleQs.length === 0) {
    grid.innerHTML = '<div style="color:var(--text3);padding:40px;text-align:center;font-size:14px;">Bu filtrede soru bulunamadı.</div>';
    return;
  }

  grid.innerHTML = s.visibleQs.map((q, i) => {
    const [clr, bg] = YEAR_COLORS[q.yr] || ['#999','#111'];
    const tagsHtml = (q.tags||[]).slice(0,3).map(t=>`<span class="q-tag">${t}</span>`).join('');
    const imgData = page === 'tyt' ? (IMGS[q.pg] || '') : (AYT_IMGS[q.pg] || '');
    return `<div class="q-card" style="animation-delay:${i*0.03}s" onclick="openLB(${i},'${page}')">
      <div class="q-preview" style="background-image:url(${imgData})"></div>
      <div class="q-card-header">
        <span class="q-year" style="background:${bg};color:${clr}">${q.yr}</span>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="q-snum">Soru</span>
          <span class="q-num">${q.num}</span>
        </div>
      </div>
      <div class="q-title">${q.title}</div>
      <div class="q-desc">${q.desc}</div>
      <div class="q-tags">${tagsHtml}</div>
      <div class="q-view-hint">Soruyu Gör →</div>
    </div>`;
  }).join('');
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
window.openLB = function(i, page) {
  page = page || currentPage;
  state[page].lbIdx = i;
  showLB(page);
};

function showLB(page) {
  page = page || currentPage;
  const s = state[page];
  const q = s.visibleQs[s.lbIdx];
  if (!q) return;

  const [clr, bg] = YEAR_COLORS[q.yr] || ['#999','#111'];
  const badge = document.getElementById('lb-year-badge');
  badge.textContent = q.yr + ' · Soru ' + q.num;
  badge.style.background = bg; badge.style.color = clr;
  document.getElementById('lb-title').textContent = q.title;
  document.getElementById('lb-sub').textContent = q.sub;
  document.getElementById('lb-img').src = page === 'tyt' ? (IMGS[q.pg] || '') : (AYT_IMGS[q.pg] || '');
  document.getElementById('lb-tags').innerHTML = (q.tags||[]).map(t=>`<span class="lb-tag">${t}</span>`).join('');

  // Reset answer state
  currentAnswer = q.ans;
  answered = false;
  document.querySelectorAll('.choice-btn').forEach(b => {
    b.classList.remove('correct','wrong','reveal');
    b.disabled = false;
  });
  document.getElementById('lb-answer-msg').textContent = '';
  document.getElementById('lb-answer-msg').className = 'lb-answer-msg';

  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

window.checkAnswer = function(choice) {
  if (answered) return;
  answered = true;
  const btn = document.querySelector(`.choice-btn[data-choice="${choice}"]`);
  const msgEl = document.getElementById('lb-answer-msg');

  if (choice === currentAnswer) {
    btn.classList.add('correct');
    msgEl.textContent = '✓ Doğru! Cevap: ' + currentAnswer;
    msgEl.className = 'lb-answer-msg success';
  } else {
    btn.classList.add('wrong');
    // Reveal correct answer
    const correctBtn = document.querySelector(`.choice-btn[data-choice="${currentAnswer}"]`);
    if (correctBtn) correctBtn.classList.add('reveal');
    msgEl.textContent = '✗ Yanlış — Doğru cevap: ' + currentAnswer;
    msgEl.className = 'lb-answer-msg error';
  }

  // Disable all buttons
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
};

window.closeLightbox = function() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
};

window.closeLB = function(e) {
  if (e.target.id === 'lightbox') closeLightbox();
};

window.lbNav = function(dir) {
  const s = state[currentPage];
  s.lbIdx = (s.lbIdx + dir + s.visibleQs.length) % s.visibleQs.length;
  showLB(currentPage);
};

document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') lbNav(1);
  if (e.key === 'ArrowLeft') lbNav(-1);
});

// ─── Page navigation ──────────────────────────────────────────────────────────
window.showPage = function(p) {
  currentPage = p;
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + p)?.classList.add('active');
  document.getElementById('tab-' + p)?.classList.add('active');
  if (p === 'meb') buildMEB();
};

// ─── MEB ──────────────────────────────────────────────────────────────────────
function buildMEB() {
  const g = document.getElementById('mebGrid');
  g.innerHTML = MEB_DATA.map(section => {
    const subsHtml = section.subs.map(s => {
      const refs = s.refs.map(r=>`<span class="meb-q-ref" style="background:rgba(255,255,255,.06);color:${r.c};border:1px solid rgba(255,255,255,.1)" onclick="jumpToQ(${r.yr},${r.n})" title="${r.yr} Soru ${r.n}">${r.yr}·S${r.n}</span>`).join('');
      return `<div class="meb-sub">
        <div class="meb-sub-name">${s.name}</div>
        <div class="meb-sub-code">${s.code}</div>
        <div class="meb-sub-desc">${s.desc}</div>
        <div class="meb-q-refs">${refs}</div>
      </div>`;
    }).join('');
    return `<div class="meb-card">
      <div class="meb-card-header">
        <div class="meb-card-icon" style="background:${section.bg};color:${section.color}">${section.icon}</div>
        <div>
          <div class="meb-card-title">${section.title}</div>
          <div class="meb-card-code">${section.code}</div>
        </div>
      </div>
      <div class="meb-subs">${subsHtml}</div>
    </div>`;
  }).join('');
}

window.jumpToQ = function(yr, num) {
  showPage('tyt');
  state.tyt.activeYear = String(yr);
  state.tyt.activeTopic = 'all';
  document.querySelectorAll('#tyt-year-btns .year-btn').forEach(b => {
    b.classList.remove('active');
    if (b.textContent == yr) b.classList.add('active');
  });
  document.querySelectorAll('#tyt-topicList .topic-item').forEach(el => el.classList.remove('active'));
  document.getElementById('tyt-ti-all')?.classList.add('active');
  renderGrid('tyt');
  setTimeout(() => {
    const idx = state.tyt.visibleQs.findIndex(q => q.num === num && q.yr === yr);
    if (idx >= 0) openLB(idx, 'tyt');
  }, 100);
};

// ─── Start ────────────────────────────────────────────────────────────────────
init();

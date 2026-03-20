// ══════════════════════════════════════
// CONFIG
// ══════════════════════════════════════
const API_BASE = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://piecebypeas.onrender.com/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function checkAuth() {
  const { ok } = await apiFetch('/auth/me');
  if (!ok && !window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
    window.location.href = 'login.html';
  }
}

async function logout() {
  if (!confirm('Are you sure you want to log out?')) return;
  await apiFetch('/auth/logout', { method: 'POST' });
  localStorage.removeItem('username');
  localStorage.removeItem('userEmail');
  window.location.href = 'login.html';
}

function updateGreeting() {
  const username = localStorage.getItem('username') || 'Hello';
  document.querySelectorAll('#userGreeting').forEach(el => el.textContent = `Hello, ${username}`);
  const emailEl = document.getElementById('dropdownEmail');
  if (emailEl) emailEl.textContent = localStorage.getItem('userEmail') || '—';
}

function toggleDropdown() {
  document.getElementById('userDropdown')?.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  const navUser = document.getElementById('navUser');
  const dd = document.getElementById('userDropdown');
  if (dd && navUser && !navUser.contains(e.target)) dd.classList.remove('open');
});

function openProfile() {
  document.getElementById('userDropdown')?.classList.remove('open');
  const nameEl = document.getElementById('profileName');
  const emailEl = document.getElementById('profileEmail');
  if (nameEl) nameEl.value = localStorage.getItem('username') || '';
  if (emailEl) emailEl.value = localStorage.getItem('userEmail') || '';
  const pwEl = document.getElementById('profilePassword');
  if (pwEl) pwEl.value = '';
  document.getElementById('profileModal')?.classList.add('open');
}

function closeProfile() {
  document.getElementById('profileModal')?.classList.remove('open');
}

async function saveProfile() {
  const name = document.getElementById('profileName')?.value.trim();
  const email = document.getElementById('profileEmail')?.value.trim();
  if (name) localStorage.setItem('username', name);
  if (email) localStorage.setItem('userEmail', email);
  updateGreeting();
  closeProfile();
  showNotification('Profile updated', 'success');
}

function toggleLanguage() {
  showNotification('Language switching coming soon', 'info');
}

// ── TAG SELECT ──
function initTagSelect() {
  document.querySelectorAll('.tag-option').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('selected'));
  });
}

function getSelectedTags() {
  return [...document.querySelectorAll('.tag-option.selected')].map(b => b.dataset.tag);
}

// ── DATE HELPERS ──
// Safely parse both "2026-03-20T14:52:49" and "2026-03-20 14:52:49"
function parseDate(str) {
  if (!str) return null;
  return new Date(str.replace(' ', 'T'));
}

function getDateStr(str) {
  if (!str) return null;
  return str.substring(0, 10); // always "YYYY-MM-DD"
}

// ══════════════════════════════════════
// ROUTER
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  const path = window.location.pathname;
  if (path.includes('login.html') || (path.endsWith('login') )) { initLoginPage(); return; }
  if (path.includes('register')) { initRegisterPage(); return; }
  checkAuth().then(() => {
    updateGreeting();
    if (path.includes('add'))    initAddPage();
    if (path.includes('log'))    initLogPage();
    if (path.includes('report')) initReportPage();
    if (path.includes('index') || path.endsWith('/') || path.endsWith('5000/')) initHomePage();
  });
});

// ══════════════════════════════════════
// LOGIN
// ══════════════════════════════════════
function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const { ok, data } = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (ok) {
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('userEmail', data.user.email);
      const btn = document.querySelector('.login-btn');
      if (btn) { btn.textContent = `Welcome, ${data.user.username}!`; btn.style.background = '#628A6B'; }
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } else {
      alert(data.error || 'Login failed.');
    }
  });
}

// ══════════════════════════════════════
// REGISTER
// ══════════════════════════════════════
function initRegisterPage() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const { ok, data } = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
    if (ok) {
      showNotification('Account created! Please log in.', 'success');
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    } else {
      alert(data.error || 'Registration failed.');
    }
  });
}

// ══════════════════════════════════════
// HOME
// ══════════════════════════════════════
function initHomePage() {
  const el = document.getElementById('homeGreeting');
  if (!el) return;
  const h = new Date().getHours();
  if (h < 12) el.textContent = 'Good morning! Ready for breakfast?';
  else if (h < 17) el.textContent = 'Good afternoon! Time for lunch?';
  else el.textContent = "Good evening! What's for dinner?";
}

// ══════════════════════════════════════
// ADD MEAL
// ══════════════════════════════════════
function initAddPage() {
  initTagSelect();
  const timeInput = document.getElementById('mealTime');
  if (timeInput && !timeInput.value) {
    const now = new Date();
    timeInput.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }

  // Check edit mode
  const editingMeal = sessionStorage.getItem('editingMeal');
  if (editingMeal) {
    const meal = JSON.parse(editingMeal);
    const nameEl = document.getElementById('mealName');
    const typeEl = document.getElementById('mealType');
    const timeEl = document.getElementById('mealTime');
    if (nameEl) nameEl.value = meal.title || '';
    if (typeEl) typeEl.value = meal.type || '';
    if (timeEl) timeEl.value = meal.time || '';
    (meal.includes || []).forEach(g => {
      const cb = document.getElementById(g);
      if (cb) cb.checked = true;
    });
    // restore tags
    setTimeout(() => {
      (meal.tags || []).forEach(t => {
        document.querySelectorAll('.tag-option').forEach(btn => {
          if (btn.dataset.tag === t) btn.classList.add('selected');
        });
      });
    }, 50);
    const submitBtn = document.querySelector('#mealForm .btn-primary');
    if (submitBtn) submitBtn.textContent = 'Update';
  }

  const form = document.getElementById('mealForm');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const title = document.getElementById('mealName').value.trim();
    const type = document.getElementById('mealType').value;
    const time = document.getElementById('mealTime').value;
    const includes = [...document.querySelectorAll('.food-item input[type="checkbox"]:checked')].map(cb => cb.value);
    const tags = getSelectedTags();

    if (!title || !type || !time) { alert('Please fill in all required fields'); return; }
    if (includes.length === 0) { alert('Please select at least one food group'); return; }

    const editingMeal = sessionStorage.getItem('editingMeal');
    if (editingMeal) {
      const old = JSON.parse(editingMeal);
      const { ok, data } = await apiFetch(`/meals/${old.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, type, time, includes, tags })
      });
      if (ok) {
        sessionStorage.removeItem('editingMeal');
        showNotification('Meal updated!', 'success');
        setTimeout(() => { window.location.href = 'log.html'; }, 900);
      } else {
        alert(data.error || 'Failed to update.');
      }
    } else {
      const { ok, data } = await apiFetch('/meals/', { method: 'POST', body: JSON.stringify({ title, type, time, includes, tags }) });
      if (ok) {
        showNotification('Meal added!', 'success');
        setTimeout(() => { window.location.href = 'log.html'; }, 900);
      } else {
        alert(data.error || 'Failed to save.');
      }
    }
  });

  const cancelBtn = document.querySelector('#mealForm .btn-secondary');
  if (cancelBtn) cancelBtn.onclick = () => {
    sessionStorage.removeItem('editingMeal');
    window.location.href = 'log.html';
  };
}

// ══════════════════════════════════════
// LOG PAGE
// ══════════════════════════════════════
let logOffset = 0;
let allMeals = [];
let activeTab = 'today';

function initLogPage() {
  const prevBtn = document.getElementById('prevDayBtn');
  const nextBtn = document.getElementById('nextDayBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => { logOffset--; renderLog(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { if (logOffset < 0) { logOffset++; renderLog(); } });
  loadMeals();
}

async function loadMeals() {
  const { ok, data } = await apiFetch('/meals/');
  if (!ok) return;
  allMeals = data;
  renderLog();
}

function renderLog() {
  updateDateDisplay();
  if (activeTab === 'today') renderToday();
  else renderHistory();
}

function updateDateDisplay() {
  const d = new Date();
  d.setDate(d.getDate() + logOffset);
  const isToday = logOffset === 0;
  const isYesterday = logOffset === -1;
  const mainEl = document.getElementById('dateMain');
  const subEl = document.getElementById('dateSub');
  const nextBtn = document.getElementById('nextDayBtn');
  if (mainEl) mainEl.textContent = isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'long' });
  if (subEl) subEl.textContent = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  if (nextBtn) nextBtn.disabled = logOffset >= 0;
}

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tabToday')?.classList.toggle('active', tab === 'today');
  document.getElementById('tabHistory')?.classList.toggle('active', tab === 'history');
  const todayView = document.getElementById('todayView');
  const historyView = document.getElementById('historyView');
  if (todayView) todayView.style.display = tab === 'today' ? 'block' : 'none';
  if (historyView) historyView.style.display = tab === 'history' ? 'block' : 'none';
  renderLog();
}

function getMealsForDate(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const dateStr = d.toISOString().split('T')[0]; // "YYYY-MM-DD"
  return allMeals.filter(m => getDateStr(m.created_at) === dateStr);
}

function renderToday() {
  const meals = getMealsForDate(logOffset);
  const countEl = document.getElementById('todayCount');
  const listEl = document.getElementById('mealList');
  const sugEl = document.getElementById('suggestionsBox');

  if (countEl) countEl.textContent = meals.length ? `${meals.length} meal${meals.length > 1 ? 's' : ''} recorded` : '';
  if (!listEl) return;

  if (meals.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><p>No meals recorded yet</p><button class="btn-primary" onclick="location.href='add.html'">Add your first meal</button></div>`;
    if (sugEl) sugEl.innerHTML = '';
    return;
  }

  meals.sort((a, b) => (a.time || '') > (b.time || '') ? 1 : -1);

  listEl.innerHTML = meals.map(meal => {
    const tags = Array.isArray(meal.tags) ? meal.tags : (typeof meal.tags === 'string' ? JSON.parse(meal.tags || '[]') : []);
    const dots = (meal.includes || []).map(g => `<span class="food-dot ${g}" title="${g}"></span>`).join('');
    const tagPills = tags.map(t => {
      const cls = t === 'diet' ? 'pill-diet' : t === 'cheat' ? 'pill-cheat' : 'pill-type';
      return `<span class="pill ${cls}">${capitalize(t)} meal</span>`;
    }).join('');

    return `<div class="meal-card">
      <div class="meal-card-top">
        <span class="meal-card-name">${meal.title}</span>
        <span class="meal-card-time">${formatTime(meal.time)}</span>
      </div>
      <div class="meal-card-meta">
        <span class="pill pill-type">${capitalize(meal.type)}</span>
        ${tagPills}
        <div class="food-dots">${dots}</div>
      </div>
      <div class="meal-card-actions">
        <button class="btn-edit-sm" onclick="editMeal(${meal.id})" title="Edit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-delete" onclick="deleteMeal(${meal.id})" title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>`;
  }).join('');

  if (sugEl) sugEl.innerHTML = buildSuggestions(meals);
}

function renderHistory() {
  const listEl = document.getElementById('historyList');
  if (!listEl) return;

  const grouped = {};
  allMeals.forEach(m => {
    const d = getDateStr(m.created_at); // always "YYYY-MM-DD"
    if (!d) return;
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(m);
  });

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  if (dates.length === 0) { listEl.innerHTML = '<div class="empty-state"><p>No history yet</p></div>'; return; }

  listEl.innerHTML = dates.map(date => {
    const meals = grouped[date];
    const groups = [...new Set(meals.flatMap(m => m.includes || []))];
    const dots = groups.map(g => `<span class="food-dot ${g}"></span>`).join('');
    // Parse date safely: add T12:00:00 to avoid timezone shift
    const d = new Date(date + 'T12:00:00');
    const label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return `<div class="history-card" onclick="jumpToDate('${date}')">
      <div class="history-card-top">
        <span class="history-date">${label}</span>
        <span class="history-count">${meals.length} meal${meals.length > 1 ? 's' : ''}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px">
        <div class="food-dots">${dots}</div>
        <span class="history-groups">${groups.length} / 6 groups${groups.length === 6 ? ' ✓' : ''}</span>
      </div>
    </div>`;
  }).join('');
}

function jumpToDate(dateStr) {
  const target = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(12,0,0,0);
  const diffDays = Math.round((target - today) / 86400000);
  logOffset = diffDays;
  switchTab('today');
}

function buildSuggestions(meals) {
  const all = ['grains','protein','vegetables','fruits','dairy','snacks'];
  const consumed = new Set(meals.flatMap(m => m.includes || []));
  const missing = all.filter(g => !consumed.has(g));
  if (missing.length === 0) return `<div class="suggestions-box"><div class="suggestions-title">Today's suggestions</div><p style="font-size:.85rem;color:var(--text-mid)">You've covered all food groups today! 🎉</p></div>`;
  const tips = {
    grains: 'Try adding rice, bread, or oatmeal to your next meal.',
    protein: 'Consider eggs, chicken, beans, or tofu.',
    vegetables: 'Sneak in some leafy greens, carrots, or bell peppers.',
    fruits: 'Grab an apple, banana, or a handful of berries.',
    dairy: 'A glass of milk or some yogurt would round things out.',
    snacks: 'A small healthy snack like nuts could help.'
  };
  const items = missing.map(g => `<div class="suggestion-item"><span class="suggestion-dot"></span><span>${tips[g]}</span></div>`).join('');
  return `<div class="suggestions-box"><div class="suggestions-title">Today's suggestions</div>${items}</div>`;
}

function editMeal(id) {
  const meal = allMeals.find(m => m.id === id);
  if (!meal) return;
  sessionStorage.setItem('editingMeal', JSON.stringify(meal));
  window.location.href = 'add.html';
}

async function deleteMeal(id) {
  if (!confirm('Delete this meal?')) return;
  const { ok } = await apiFetch(`/meals/${id}`, { method: 'DELETE' });
  if (ok) { showNotification('Deleted', 'info'); await loadMeals(); }
  else alert('Failed to delete.');
}

// ══════════════════════════════════════
// REPORT PAGE
// ══════════════════════════════════════
let reportPeriod = 'week';
let barChartInst, radarChartInst, donutChartInst;
const COLORS = { grains:'#f0945d', protein:'#EF82A0', vegetables:'#6bb392', fruits:'#ffd970', dairy:'#88abda', snacks:'#dcc7e1' };
const GROUPS = ['grains','protein','vegetables','fruits','dairy','snacks'];
const LABELS = ['Grains','Protein','Vegetables','Fruits','Dairy','Snacks'];

function initReportPage() { setPeriod('week'); }

function setPeriod(p) {
  reportPeriod = p;
  ['month','week','custom'].forEach(x => {
    document.getElementById('tab' + capitalize(x))?.classList.toggle('active', x === p);
  });
  loadReportData();
}

async function loadReportData() {
  const { ok, data } = await apiFetch('/meals/');
  if (!ok) return;
  const { start, end, meals } = filterByPeriod(data, reportPeriod);
  updatePeriodRange(start, end);
  updateStats(meals, start, end);
  drawCharts(meals, start, end);
}

function filterByPeriod(meals, period) {
  const now = new Date();
  let start, end;
  if (period === 'week') {
    const day = now.getDay();
    start = new Date(now); start.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); start.setHours(0,0,0,0);
    end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else {
    start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0,0,0,0);
    end = new Date(now); end.setHours(23,59,59,999);
  }
  const filtered = meals.filter(m => {
    const d = parseDate(m.created_at);
    return d && d >= start && d <= end;
  });
  return { start, end, meals: filtered };
}

function updatePeriodRange(start, end) {
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const el = document.getElementById('periodRange');
  if (el) el.textContent = `[${fmt(start)} ~ ${fmt(end)}]`;
}

function updateStats(meals, start, end) {
  const days = Math.round((end - start) / 86400000) + 1;
  const daysWithMeals = new Set(meals.map(m => getDateStr(m.created_at))).size;
  const avg = daysWithMeals > 0 ? meals.length / daysWithMeals : 0;
  const counts = Object.fromEntries(GROUPS.map(g => [g, 0]));
  meals.forEach(m => (m.includes || []).forEach(g => counts[g]++));
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  const statDays = document.getElementById('statDays');
  const statAvg = document.getElementById('statAvg');
  const statTop = document.getElementById('statTop');
  const statMissing = document.getElementById('statMissing');
  if (statDays) statDays.textContent = `${daysWithMeals} / ${days}`;
  if (statAvg) statAvg.textContent = avg.toFixed(1);
  if (statTop) statTop.textContent = sorted[0][1] > 0 ? capitalize(sorted[0][0]) : '—';
  if (statMissing) statMissing.textContent = sorted[sorted.length-1][1] === 0 ? capitalize(sorted[sorted.length-1][0]) : '—';
}

function drawCharts(meals, start, end) {
  const days = [];
  const d = new Date(start);
  while (d <= end) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  const labels = days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' }));
  const datasets = GROUPS.map((g, i) => ({
    label: LABELS[i],
    data: days.map(day => {
      const s = day.toISOString().split('T')[0];
      return meals.some(m => getDateStr(m.created_at) === s && (m.includes||[]).includes(g)) ? 1 : 0;
    }),
    backgroundColor: COLORS[g], stack: 's'
  }));

  const barCtx = document.getElementById('barChart');
  if (barCtx && typeof Chart !== 'undefined') {
    if (barChartInst) barChartInst.destroy();
    barChartInst = new Chart(barCtx, { type:'bar', data:{labels,datasets}, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{stacked:true,grid:{display:false},ticks:{autoSkip:false}},y:{stacked:true,max:6,ticks:{stepSize:2}}} } });
  }

  const radarCtx = document.getElementById('radarChart');
  if (radarCtx && typeof Chart !== 'undefined') {
    if (radarChartInst) radarChartInst.destroy();
    const rc = GROUPS.map(g => meals.filter(m=>(m.includes||[]).includes(g)).length);
    radarChartInst = new Chart(radarCtx, { type:'radar', data:{labels:LABELS,datasets:[{data:rc,backgroundColor:'rgba(98,138,107,0.2)',borderColor:'#628A6B',pointBackgroundColor:'#628A6B'}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{r:{min:0,ticks:{stepSize:1,font:{size:10}}}}} });
  }

  const donutCtx = document.getElementById('donutChart');
  if (donutCtx && typeof Chart !== 'undefined') {
    if (donutChartInst) donutChartInst.destroy();
    const types=['breakfast','lunch','dinner','brunch','snack'];
    const dc = types.map(t=>meals.filter(m=>m.type===t).length);
    donutChartInst = new Chart(donutCtx, { type:'doughnut', data:{labels:types.map(capitalize),datasets:[{data:dc,backgroundColor:['#ffd970','#88abda','#6bb392','#f0945d','#dcc7e1']}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11},boxWidth:12}}}} });
  }
}

// ══════════════════════════════════════
// NOTIFICATION + UTILS
// ══════════════════════════════════════
function showNotification(message, type='info') {
  const colors = { success:'#628A6B', warning:'#F58E68', info:'#9FC5A3' };
  const n = document.createElement('div');
  n.style.cssText = `position:fixed;top:20px;right:20px;background:${colors[type]||colors.info};color:#fff;padding:.75rem 1.25rem;border-radius:12px;z-index:9999;font-family:Nunito,sans-serif;font-size:.9rem;font-weight:600;`;
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => { n.style.opacity='0'; n.style.transition='opacity .3s'; setTimeout(()=>n.remove(),300); }, 2500);
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function formatTime(t) {
  if (!t) return '--:--';
  const [h, m] = t.split(':').map(Number);
  return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
}
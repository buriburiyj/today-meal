const WORKER_URL = "https://gitupsik-mail.buriburiyejun.workers.dev";

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

let currentSchool = null, academies = [], selectedDays = [], ddays = [];
let myLat = null, myLon = null;
let grade = null, classNm = null;
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const EXCLUDED_SUBJECTS = ['체육', '창체'];

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function applyTimeTheme() {
  const h = new Date().getHours(), body = document.body;
  body.className = '';
  let greet, theme;
  if (h >= 5 && h < 9) { theme = 'dawn'; greet = '좋은 아침이에요! 🌅'; }
  else if (h >= 9 && h < 17) { theme = 'day'; greet = '활기찬 하루예요! ☀️'; }
  else if (h >= 17 && h < 20) { theme = 'eve'; greet = '좋은 저녁이에요 🌆'; }
  else { theme = 'night'; greet = '편안한 밤 되세요 🌙'; }
  body.classList.add(theme);
  document.getElementById('greet').textContent = greet;
}
function todayKorean() { const d = new Date(); const days = ['일', '월', '화', '수', '목', '금', '토']; return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`; }
function weatherDesc(c) { if (c === 0) return "맑음"; if (c <= 2) return "구름 조금"; if (c === 3) return "흐림"; if (c <= 48) return "안개"; if (c <= 67) return "비"; if (c <= 77) return "눈"; if (c <= 82) return "소나기"; return "궂은 날씨"; }
function weatherEmoji(c) { if (c === 0) return "☀️"; if (c <= 2) return "🌤️"; if (c === 3) return "☁️"; if (c <= 48) return "🌫️"; if (c <= 67) return "🌧️"; if (c <= 77) return "❄️"; if (c <= 82) return "🌦️"; return "🌩️"; }
function getOutfit(t) { if (t >= 28) return "👕 반팔·반바지"; if (t >= 23) return "👕 반팔"; if (t >= 20) return "👔 얇은 긴팔"; if (t >= 17) return "🧥 니트·맨투맨"; if (t >= 12) return "🧥 자켓·가디건"; if (t >= 9) return "🧥 트렌치·야상"; if (t >= 5) return "🧥 코트·히트텍"; return "🧥 패딩·목도리"; }
function airLevel(v, [g, n, b]) { if (v <= g) return { label: "좋음", color: "#3b82f6", emoji: "😊" }; if (v <= n) return { label: "보통", color: "#22c55e", emoji: "🙂" }; if (v <= b) return { label: "나쁨", color: "#f59e0b", emoji: "😷" }; return { label: "매우나쁨", color: "#ef4444", emoji: "🤢" }; }

function loadMyLocationWeather() {
  const hero = document.getElementById('heroWeather');
  hero.innerHTML = `<div class="glass"><div class="skeleton"></div></div>`;
  if (!navigator.geolocation) { hero.innerHTML = `<div class="glass"><div class="info">이 브라우저는 위치를 지원하지 않아요.</div></div>`; return; }
  navigator.geolocation.getCurrentPosition(
    pos => renderWeather(pos.coords.latitude, pos.coords.longitude, '내 위치'),
    err => { hero.innerHTML = `<div class="glass"><div class="info">📍 위치를 허용하면 지금 날씨를 볼 수 있어요.<br><button style="margin-top:10px;width:auto;padding:8px 16px" onclick="loadMyLocationWeather()">위치 다시 시도</button></div></div>`; }
  );
}

async function renderWeather(lat, lon, locName) {
  myLat = lat; myLon = lon;
  const hero = document.getElementById('heroWeather');
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FSeoul&past_days=1&forecast_days=2`;
    const d = await fetchJson(url);
    const cur = d.current, day = d.daily;
    const tMax = Math.round(day.temperature_2m_max[1]), tMin = Math.round(day.temperature_2m_min[1]), yMax = Math.round(day.temperature_2m_max[0]);
    const rainProb = day.precipitation_probability_max[1];
    const diff = tMax - yMax;
    let compare = diff >= 3 ? `어제보다 ${diff}° 따뜻 🌡️` : diff <= -3 ? `어제보다 ${Math.abs(diff)}° 추움 🧊` : '어제랑 비슷해요';
    const nowH = new Date();
    const nowKey = `${nowH.getFullYear()}-${String(nowH.getMonth() + 1).padStart(2, '0')}-${String(nowH.getDate()).padStart(2, '0')}T${String(nowH.getHours()).padStart(2, '0')}:00`;
    let si = d.hourly.time.findIndex(t => t >= nowKey); if (si < 0) si = 0;
    let cells = '';
    for (let i = si; i < si + 15 && i < d.hourly.time.length; i++) {
      const h = parseInt(d.hourly.time[i].slice(11, 13));
      cells += `<div class="hour-cell"><div class="h">${h}시</div><div class="e">${weatherEmoji(d.hourly.weather_code[i])}</div><div class="t">${Math.round(d.hourly.temperature_2m[i])}°</div></div>`;
    }
    hero.innerHTML = `
  <div class="hero">
    <div class="loc">📍 ${locName}</div>
    <div class="big">${Math.round(cur.temperature_2m)}°</div>
    <div class="desc">${weatherEmoji(cur.weather_code)} ${weatherDesc(cur.weather_code)}</div>
    <div class="mm">최고 ${tMax}° / 최저 ${tMin}°</div>
    <div class="compare">${compare}</div>
    <div class="hero-extra"><span class="chip">☔ 강수 ${rainProb}%</span><span class="chip">${getOutfit(tMax)}</span></div>
  </div>
  <div class="glass" style="margin-top:14px">
    <div class="card-title">🕐 시간별 날씨</div>
    <div class="hourly-scroll">${cells}</div>
  </div>`;
    loadAir(lat, lon);
  } catch (e) { hero.innerHTML = `<div class="glass"><div class="info">날씨를 못 불러왔어. 잠시 후 다시 시도해줘.</div></div>`; }
}

async function loadAir(lat, lon) {
  const card = document.getElementById('airCard'), el = document.getElementById('airContent');
  card.style.display = 'block';
  el.innerHTML = '<div class="skeleton" style="height:60px"></div>';
  try {
    const d = await fetchJson(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5&timezone=Asia%2FSeoul`);
    const pm10 = Math.round(d.current.pm10), pm25 = Math.round(d.current.pm2_5);
    const i10 = airLevel(pm10, [30, 80, 150]), i25 = airLevel(pm25, [15, 35, 75]);
    const badge = (n, v, i) => `<div class="air-badge" style="background:${i.color}"><div class="name">${n}</div><div class="lv">${i.emoji} ${i.label}</div><div class="val">${v} ㎍/㎥</div></div>`;
    el.innerHTML = `<div class="air-scroll">${badge('미세먼지 PM10', pm10, i10)}${badge('초미세먼지 PM2.5', pm25, i25)}</div>`;
  } catch (e) { el.innerHTML = '<div class="info">미세먼지를 못 불러왔어. 잠시 후 다시 시도해줘.<br><button style="margin-top:10px;width:auto;padding:8px 16px" onclick="loadAir(myLat, myLon)">다시 시도</button></div>'; }
}

async function searchSchool() {
  const name = document.getElementById('q').value.trim();
  const listEl = document.getElementById('schoolList');
  if (!name) { listEl.innerHTML = '<div class="info">학교 이름을 입력해줘!</div>'; return; }
  listEl.innerHTML = '<div class="info">검색 중...</div>';
  try {
    const data = await fetchJson(`${WORKER_URL}/api/school?name=${encodeURIComponent(name)}`);
    if (!data.ok || !data.schools || !data.schools.length) { listEl.innerHTML = '<div class="info">검색 결과가 없어.</div>'; return; }
    window._rows = data.schools;
    listEl.innerHTML = data.schools.map((s, i) => `<div class="school-item" onclick="selectSchool(${i})">${escapeHtml(s.schoolName)}<small>${escapeHtml(s.address || '')}</small></div>`).join('');
  } catch (e) { listEl.innerHTML = '<div class="info">학교를 검색하지 못했어. 잠시 후 다시 시도해줘.</div>'; }
}

function selectSchool(i) {
  const s = window._rows[i];
  currentSchool = { officeCode: s.officeCode, schoolCode: s.schoolCode, schoolName: s.schoolName };
  localStorage.setItem('mySchool', JSON.stringify(currentSchool));
  grade = null; classNm = null;
  showSchool();
}

function buildGradeClassSelectors() {
  const gs = document.getElementById('gradeSel'), cs = document.getElementById('classSel');
  let go = '<option value="">학년</option>';
  for (let g = 1; g <= 6; g++) go += `<option value="${g}" ${grade == g ? 'selected' : ''}>${g}학년</option>`;
  gs.innerHTML = go;
  let co = '<option value="">반</option>';
  for (let c = 1; c <= 10; c++) co += `<option value="${c}" ${classNm == c ? 'selected' : ''}>${c}반</option>`;
  cs.innerHTML = co;
}

function onGradeClassChange() {
  grade = document.getElementById('gradeSel').value || null;
  classNm = document.getElementById('classSel').value || null;
  if (currentSchool) {
    localStorage.setItem('myGrade', grade || '');
    localStorage.setItem('myClass', classNm || '');
    syncProfile();
  }
  loadTimetable();
}

// 앱에서 학교나 학년/반을 바꿔도 서버는 구독 시점 값에 묶여 있다.
// 그대로 두면 랭킹이 예전 학교로 나가므로 바뀔 때마다 맞춰준다.
function syncProfile() {
  const session = getSession();
  if (!session || !currentSchool) return;
  fetch(`${WORKER_URL}/profile`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...currentSchool, grade, classNm })
  })
    .then(res => res.ok ? res.json() : null)
    .then(data => { if (data?.ok) loadRanking(); })
    .catch(() => {});
}

function showSchool() {
  document.getElementById('searchCard').style.display = 'none';
  document.getElementById('schoolView').style.display = 'block';
  document.getElementById('curSchoolName').textContent = currentSchool.schoolName;
  document.getElementById('subMsg').textContent = '';
  selectedDays = [];
  const acDraft = loadAcademyDraft(), ddDraft = loadDdayDraft();
  academies = acDraft || []; ddays = ddDraft || [];
  const acMsg = document.getElementById('acMsg'), ddMsg = document.getElementById('ddMsg');
  if (acDraft && acDraft.length) { acMsg.style.color = '#ea580c'; acMsg.textContent = "⚠️ 저장하지 않은 변경사항을 불러왔어. '학원 일정 저장'을 눌러 저장해줘."; }
  else acMsg.textContent = '';
  if (ddDraft && ddDraft.length) { ddMsg.style.color = '#ea580c'; ddMsg.textContent = "⚠️ 저장하지 않은 변경사항을 불러왔어. '디데이 저장'을 눌러 저장해줘."; }
  else ddMsg.textContent = '';
  buildGradeClassSelectors();
  renderDayButtons(); renderAcademyList(); renderDdayList(); renderStudyChecklist();
  switchTab(localStorage.getItem('activeTab') || 'today');
  loadMeal(); loadTimetable();
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('on', p.dataset.panel === name));
  localStorage.setItem('activeTab', name);
}

function changeSchool() {
  localStorage.removeItem('mySchool');
  localStorage.removeItem('myGrade');
  localStorage.removeItem('myClass');
  currentSchool = null; grade = null; classNm = null;
  document.getElementById('schoolView').style.display = 'none';
  document.getElementById('searchCard').style.display = 'block';
  document.getElementById('q').value = '';
  document.getElementById('schoolList').innerHTML = '';
}

async function loadMeal() {
  const el = document.getElementById('mealContent');
  el.innerHTML = '<div class="info">불러오는 중...</div>';
  try {
    const data = await fetchJson(`${WORKER_URL}/api/meal?office=${currentSchool.officeCode}&school=${currentSchool.schoolCode}`);
    if (!data.ok || !data.meal) { el.innerHTML = '<span class="info">오늘은 급식 정보가 없어.</span>'; return; }
    el.innerHTML = data.meal.replace(/<br><br>/g, '\n\n').replace(/<br>/g, '\n').replace(/<b>(.*?)<\/b>/g, '<span class="mmeal">$1</span>');
  } catch (e) { el.innerHTML = '<span class="info">급식을 못 불러왔어. 잠시 후 다시 시도해줘.<br><button style="margin-top:10px;width:auto;padding:8px 16px" onclick="loadMeal()">다시 시도</button></span>'; }
}

async function loadTimetable() {
  const el = document.getElementById('timetableContent');
  if (!grade || !classNm) { el.innerHTML = '<span class="info">학년·반을 선택하면 시간표가 나와요.</span>'; return; }
  el.innerHTML = '<div class="info">불러오는 중...</div>';
  try {
    const data = await fetchJson(`${WORKER_URL}/api/timetable?office=${currentSchool.officeCode}&school=${currentSchool.schoolCode}&grade=${grade}&class=${classNm}`);
    if (data.ok && data.timetable) { el.innerHTML = data.timetable.replace(/<br>/g, '\n'); generateAutoStudyItems(data.timetable); return; }
    el.innerHTML = '<span class="info">오늘 시간표 정보가 없어.</span>';
  } catch (e) { el.innerHTML = '<span class="info">시간표를 불러오지 못했어. 잠시 후 다시 시도해줘.<br><button style="margin-top:10px;width:auto;padding:8px 16px" onclick="loadTimetable()">다시 시도</button></span>'; }
}

async function subscribe() {
  const email = document.getElementById('emailInput').value.trim();
  const msg = document.getElementById('subMsg');
  if (!email || !email.includes('@')) { msg.style.color = '#ef4444'; msg.textContent = '이메일을 제대로 입력해줘!'; return; }
  if (!myLat || !myLon) { msg.style.color = '#ef4444'; msg.textContent = '📍 위치를 먼저 허용해줘! (날씨를 넣으려면 필요해)'; return; }
  if (!grade || !classNm) { msg.style.color = '#ef4444'; msg.textContent = '🎓 학년·반을 먼저 골라줘!'; return; }
  msg.style.color = '#64748b'; msg.textContent = '구독 처리 중...';
  try {
    const data = await fetchJson(`${WORKER_URL}/subscribe`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...currentSchool, lat: myLat, lon: myLon, grade, classNm })
    });
    if (data.ok) { msg.style.color = '#16a34a'; msg.textContent = '✅ ' + data.msg; localStorage.setItem('myEmail', email); loadAcademies(email); loadDdays(email); }
    else { msg.style.color = '#ef4444'; msg.textContent = '❌ ' + data.msg; }
  } catch (e) { msg.style.color = '#ef4444'; msg.textContent = '❌ 오류가 났어. 잠시 후 다시 시도해줘.'; }
}

async function requestLoginLink() {
  const email = document.getElementById('loginEmailInput').value.trim();
  const msg = document.getElementById('loginMsg');
  if (!email || !email.includes('@')) { msg.style.color = '#ef4444'; msg.textContent = '이메일을 제대로 입력해줘!'; return; }
  msg.style.color = '#64748b'; msg.textContent = '로그인 링크 보내는 중...';
  try {
    const data = await fetchJson(`${WORKER_URL}/login/request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (data.ok) { msg.style.color = '#16a34a'; msg.textContent = '✅ ' + data.msg; }
    else { msg.style.color = '#ef4444'; msg.textContent = '❌ ' + data.msg; }
  } catch (e) { msg.style.color = '#ef4444'; msg.textContent = '❌ 오류가 났어. 잠시 후 다시 시도해줘.'; }
}

function handleLoginCallback() {
  const hash = location.hash;
  if (!hash.startsWith('#session=')) return;
  const sessionToken = hash.slice('#session='.length);
  const email = document.getElementById('loginEmailInput').value.trim() || localStorage.getItem('myEmail') || '';
  localStorage.setItem('mySession', JSON.stringify({ token: sessionToken, email }));
  history.replaceState(null, '', location.pathname + location.search);
}

async function logout() {
  const session = getSession();
  if (session) {
    try {
      await fetch(`${WORKER_URL}/login/logout`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${session.token}` }
      });
    } catch (e) {}
  }
  localStorage.removeItem('mySession');
  updateLoginUI();
}

function getSession() {
  try { return JSON.parse(localStorage.getItem('mySession')); } catch (e) { return null; }
}

// 로그인 세션이 있으면 Authorization 헤더를, 없으면 빈 객체를 돌려준다.
// 지금은 email 파라미터도 계속 같이 보내는 과도기라, 세션이 없어도 기존처럼 동작한다.
function authHeaders() {
  const session = getSession();
  return session ? { 'Authorization': `Bearer ${session.token}` } : {};
}

function updateLoginUI() {
  const session = getSession();
  const loggedOut = document.getElementById('loginLoggedOut');
  const loggedIn = document.getElementById('loginLoggedIn');
  if (session) {
    loggedOut.style.display = 'none';
    loggedIn.style.display = 'block';
    document.getElementById('loginEmailLabel').textContent = session.email;
  } else {
    loggedOut.style.display = 'block';
    loggedIn.style.display = 'none';
  }
}

function renderDayButtons() {
  document.getElementById('dayRow').innerHTML = DAY_NAMES.map((d, i) => `<div class="day-btn ${selectedDays.includes(i) ? 'on' : ''}" onclick="toggleDay(${i})">${d}</div>`).join('');
}
function toggleDay(i) {
  if (selectedDays.includes(i)) selectedDays = selectedDays.filter(x => x !== i);
  else selectedDays.push(i);
  renderDayButtons();
}
function loadAcademyDraft() {
  try { return JSON.parse(localStorage.getItem('academyDraft')); } catch (e) { return null; }
}
function saveAcademyDraft() {
  if (academies.length) localStorage.setItem('academyDraft', JSON.stringify(academies));
  else localStorage.removeItem('academyDraft');
}
function addAcademy() {
  const name = document.getElementById('acName').value.trim();
  const time = document.getElementById('acTime').value;
  const msg = document.getElementById('acMsg');
  if (!name) { msg.style.color = '#ef4444'; msg.textContent = '학원 이름을 입력해줘!'; return; }
  if (!selectedDays.length) { msg.style.color = '#ef4444'; msg.textContent = '요일을 하나 이상 골라줘!'; return; }
  academies.push({ name, days: [...selectedDays].sort(), time });
  document.getElementById('acName').value = ''; document.getElementById('acTime').value = '';
  selectedDays = []; renderDayButtons(); renderAcademyList(); msg.textContent = '';
  saveAcademyDraft();
}
function removeAcademy(i) {
  if (!confirm('이 학원을 삭제할까?')) return;
  academies.splice(i, 1); renderAcademyList(); saveAcademyDraft();
}
function renderAcademyList() {
  const el = document.getElementById('acList');
  if (!academies.length) { el.innerHTML = '<div class="info" style="padding:8px">아직 추가한 학원이 없어.</div>'; return; }
  el.innerHTML = academies.map((a, i) => {
    const dayStr = a.days.map(d => DAY_NAMES[d]).join('·');
    return `<div class="academy-item"><div><div class="aname">${escapeHtml(a.name)}</div><div class="ainfo">${dayStr}요일 ${a.time || ''}</div></div><button class="adel" onclick="removeAcademy(${i})">삭제</button></div>`;
  }).join('');
}
async function loadAcademies(email) {
  try {
    const data = await fetchJson(`${WORKER_URL}/getacademy?email=${encodeURIComponent(email)}`, { headers: authHeaders() });
    if (data.ok && data.academies && !localStorage.getItem('academyDraft')) { academies = data.academies; renderAcademyList(); }
  } catch (e) {
    const msg = document.getElementById('acMsg');
    if (msg && !msg.textContent) { msg.style.color = '#ef4444'; msg.textContent = '학원 정보를 불러오지 못했어. 잠시 후 다시 시도해줘.'; }
  }
}
async function saveAcademy() {
  const email = document.getElementById('emailInput').value.trim();
  const msg = document.getElementById('acMsg');
  if (!email || !email.includes('@')) { msg.style.color = '#ef4444'; msg.textContent = '먼저 위에서 이메일 넣고 구독해줘!'; return; }
  msg.style.color = '#64748b'; msg.textContent = '저장 중...';
  try {
    const data = await fetchJson(`${WORKER_URL}/setacademy`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ email, academies })
    });
    if (data.ok) { msg.style.color = '#16a34a'; msg.textContent = '✅ ' + data.msg; localStorage.removeItem('academyDraft'); }
    else { msg.style.color = '#ef4444'; msg.textContent = '❌ ' + data.msg; }
  } catch (e) { msg.style.color = '#ef4444'; msg.textContent = '❌ 오류가 났어. 잠시 후 다시 시도해줘.'; }
}

function ddayDiff(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today0) / 86400000);
}
function loadDdayDraft() {
  try { return JSON.parse(localStorage.getItem('ddayDraft')); } catch (e) { return null; }
}
function saveDdayDraft() {
  if (ddays.length) localStorage.setItem('ddayDraft', JSON.stringify(ddays));
  else localStorage.removeItem('ddayDraft');
}
function addDday() {
  const name = document.getElementById('ddName').value.trim();
  const date = document.getElementById('ddDate').value;
  const msg = document.getElementById('ddMsg');
  if (!name) { msg.style.color = '#ef4444'; msg.textContent = '이름을 입력해줘! (예: 여름방학)'; return; }
  if (!date) { msg.style.color = '#ef4444'; msg.textContent = '날짜를 골라줘!'; return; }
  ddays.push({ name, date });
  document.getElementById('ddName').value = ''; document.getElementById('ddDate').value = '';
  renderDdayList(); msg.textContent = '';
  saveDdayDraft();
}
function removeDday(i) {
  if (!confirm('이 디데이를 삭제할까?')) return;
  ddays.splice(i, 1); renderDdayList(); saveDdayDraft();
}
function renderDdayList() {
  const el = document.getElementById('ddList');
  if (!ddays.length) { el.innerHTML = '<div class="info" style="padding:8px">아직 추가한 디데이가 없어.</div>'; return; }
  const sorted = [...ddays].map((d, i) => ({ ...d, i, diff: ddayDiff(d.date) })).sort((a, b) => a.diff - b.diff);
  el.innerHTML = sorted.map(d => {
    const label = d.diff === 0 ? 'D-DAY 🎉' : d.diff > 0 ? `D-${d.diff}` : `D+${Math.abs(d.diff)}`;
    return `<div class="dd-item"><div><div class="ddname">${escapeHtml(d.name)}</div><div class="ddinfo">${d.date}</div></div><div style="display:flex;align-items:center"><span class="ddlabel">${label}</span><button class="adel" onclick="removeDday(${d.i})">삭제</button></div></div>`;
  }).join('');
}
async function loadDdays(email) {
  try {
    const data = await fetchJson(`${WORKER_URL}/getdday?email=${encodeURIComponent(email)}`, { headers: authHeaders() });
    if (data.ok && data.ddays && !localStorage.getItem('ddayDraft')) { ddays = data.ddays; renderDdayList(); }
  } catch (e) {
    const msg = document.getElementById('ddMsg');
    if (msg && !msg.textContent) { msg.style.color = '#ef4444'; msg.textContent = '디데이 정보를 불러오지 못했어. 잠시 후 다시 시도해줘.'; }
  }
}
async function saveDday() {
  const email = document.getElementById('emailInput').value.trim();
  const msg = document.getElementById('ddMsg');
  if (!email || !email.includes('@')) { msg.style.color = '#ef4444'; msg.textContent = '먼저 위에서 이메일 넣고 구독해줘!'; return; }
  msg.style.color = '#64748b'; msg.textContent = '저장 중...';
  try {
    const data = await fetchJson(`${WORKER_URL}/setdday`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ email, ddays })
    });
    if (data.ok) { msg.style.color = '#16a34a'; msg.textContent = '✅ ' + data.msg; localStorage.removeItem('ddayDraft'); }
    else { msg.style.color = '#ef4444'; msg.textContent = '❌ ' + data.msg; }
  } catch (e) { msg.style.color = '#ef4444'; msg.textContent = '❌ 오류가 났어. 잠시 후 다시 시도해줘.'; }
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function loadStudyLog() {
  try { return JSON.parse(localStorage.getItem('studyLog')) || {}; } catch (e) { return {}; }
}
function saveStudyLog(log) { localStorage.setItem('studyLog', JSON.stringify(log)); }
function addStudyItem() {
  const input = document.getElementById('studyInput');
  const text = input.value.trim();
  if (!text) return;
  const log = loadStudyLog();
  const key = todayKey();
  if (!log[key]) log[key] = { items: [] };
  log[key].items.push({ id: Date.now(), text, source: 'manual', done: false });
  log[key].touched = true;
  saveStudyLog(log);
  input.value = '';
  renderStudyChecklist();
}
function toggleStudyItem(id) {
  const log = loadStudyLog();
  const item = log[todayKey()]?.items.find(i => i.id === id);
  if (item) {
    item.done = !item.done;
    log[todayKey()].touched = true;
    saveStudyLog(log);
    renderStudyChecklist();
    if (item.done) sendCheckin();
  }
}
function removeStudyItem(id) {
  if (!confirm('이 학습 항목을 삭제할까?')) return;
  const log = loadStudyLog();
  const key = todayKey();
  if (log[key]) {
    log[key].items = log[key].items.filter(i => i.id !== id);
    log[key].touched = true;
    saveStudyLog(log);
    renderStudyChecklist();
  }
}
function extractSubjectsFromTimetable(html) {
  return html.split(/<br\s*\/?>/i)
    .map(seg => seg.split('·')[1])
    .filter(Boolean)
    .map(s => s.trim())
    .filter(Boolean);
}
function pickAutoSubjects(html) {
  const seen = new Set(), result = [];
  for (const subj of extractSubjectsFromTimetable(html)) {
    if (EXCLUDED_SUBJECTS.includes(subj) || seen.has(subj)) continue;
    seen.add(subj); result.push(subj);
    if (result.length >= 5) break;
  }
  return result;
}
function generateAutoStudyItems(html) {
  const log = loadStudyLog();
  const key = todayKey();
  if (log[key]?.touched || log[key]?.autoGenerated) return;
  const subjects = pickAutoSubjects(html);
  if (!log[key]) log[key] = { items: [] };
  subjects.forEach((s, i) => log[key].items.push({ id: Date.now() + i, text: `${s} 복습`, source: 'timetable', done: false }));
  log[key].autoGenerated = true;
  saveStudyLog(log);
  renderStudyChecklist();
}
function calcStreak(log) {
  let streak = 0;
  const d = new Date();
  const todaySuccess = log[todayKey()]?.items?.some(i => i.done);
  if (!todaySuccess) d.setDate(d.getDate() - 1);
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const success = log[key]?.items?.some(i => i.done);
    if (!success) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
// 로그인 상태에서만 오늘 체크인을 서버(D1)에 기록. 실패해도 조용히 무시 —
// 로컬 체크리스트/스트릭은 이미 반영된 상태라 사용자 경험에 지장 없음.
function sendCheckin() {
  const session = getSession();
  if (!session) return;
  fetch(`${WORKER_URL}/checkin`, { method: 'POST', headers: authHeaders() })
    .then(res => res.ok ? res.json() : null)
    .then(data => { if (data?.ok) { updateStreakDisplay(data.streak); loadRanking(); } })
    .catch(() => {});
}
// 로그인 상태면 서버 스트릭으로 화면을 덮어씀. 로그인 안 했거나 실패하면
// 방금 그려진 로컬 계산값(calcStreak)이 그대로 남는다.
function renderStreak() {
  const session = getSession();
  if (!session) return;
  fetchJson(`${WORKER_URL}/streak`, { headers: authHeaders() })
    .then(data => { if (data.ok) updateStreakDisplay(data.streak); })
    .catch(() => {});
}
function updateStreakDisplay(streak) {
  const streakEl = document.getElementById('studyStreak');
  streakEl.textContent = streak > 0 ? `🔥 ${streak}일 연속!` : '오늘도 시작해볼까?';
  streakEl.style.color = streak > 0 ? '#ea580c' : '#64748b';
}
function renderStudyChecklist() {
  const log = loadStudyLog();
  const items = log[todayKey()]?.items || [];
  const done = items.filter(i => i.done).length;
  document.getElementById('studyProgress').textContent = `${done}/${items.length}`;
  updateStreakDisplay(calcStreak(log));
  renderStreak();
  const listEl = document.getElementById('studyList');
  if (!items.length) { listEl.innerHTML = '<div class="info" style="padding:8px">아직 추가한 학습 항목이 없어.</div>'; return; }
  listEl.innerHTML = items.map(i => `
    <div class="study-item ${i.done ? 'done' : ''}">
      <label class="study-check">
        <input type="checkbox" ${i.done ? 'checked' : ''} onchange="toggleStudyItem(${i.id})">
        <span class="study-text">${escapeHtml(i.text)}</span>
        ${i.source === 'timetable' ? '<span class="badge-auto">시간표 연동</span>' : ''}
      </label>
      <button class="adel" onclick="removeStudyItem(${i.id})">삭제</button>
    </div>`).join('');
}

// 로그인 상태에서만 학교 랭킹을 불러온다. 게스트거나 실패해도 이 카드만
// 안내 문구로 대체될 뿐, 다른 기능(급식·시간표·체크리스트 등)엔 영향 없음.
function loadRanking() {
  const msgEl = document.getElementById('rankMsg');
  const listEl = document.getElementById('rankList');
  const session = getSession();
  if (!session) {
    msgEl.textContent = '로그인하면 학교 랭킹을 볼 수 있어!';
    listEl.innerHTML = '';
    return;
  }
  msgEl.textContent = '불러오는 중...';
  fetchJson(`${WORKER_URL}/ranking`, { headers: authHeaders() })
    .then(data => {
      if (data.ok) { renderRanking(data); return; }
      msgEl.textContent = data.msg || '랭킹을 불러오지 못했어.';
      listEl.innerHTML = '';
    })
    .catch(() => {
      msgEl.textContent = '랭킹을 불러오지 못했어. 잠시 후 다시 시도해줘.';
      listEl.innerHTML = '';
    });
}
function renderRanking(data) {
  const msgEl = document.getElementById('rankMsg');
  const listEl = document.getElementById('rankList');
  msgEl.textContent = data.myRank
    ? `${data.schoolName} 안에서 내 순위: ${data.myRank}등 (🔥${data.myStreak}일)`
    : `${data.schoolName} · 오늘 학습을 체크하면 랭킹에 올라가!`;
  if (!data.list.length) { listEl.innerHTML = '<div class="info" style="padding:8px">아직 랭킹에 아무도 없어.</div>'; return; }
  listEl.innerHTML = data.list.map(r => `
    <div class="rank-item ${r.isMe ? 'me' : ''}">
      <div class="rname">${r.rank}등 ${r.avatar} ${escapeHtml(r.display)}${r.isMe ? ' (나)' : ''}</div>
      <div class="rstreak">🔥${r.streak}일</div>
    </div>`).join('');
}

window.addEventListener('load', () => {
  applyTimeTheme();
  document.getElementById('topDate').textContent = todayKorean();
  loadMyLocationWeather();
  const saved = localStorage.getItem('mySchool');
  if (saved) {
    try {
      currentSchool = JSON.parse(saved);
      grade = localStorage.getItem('myGrade') || null;
      classNm = localStorage.getItem('myClass') || null;
      showSchool();
    } catch (e) { }
  }
  const savedEmail = localStorage.getItem('myEmail');
  if (savedEmail) {
    document.getElementById('emailInput').value = savedEmail;
    loadAcademies(savedEmail);
    loadDdays(savedEmail);
  }
  handleLoginCallback();
  updateLoginUI();
  loadRanking();
});

window.addEventListener('beforeunload', e => {
  if (localStorage.getItem('academyDraft') || localStorage.getItem('ddayDraft')) {
    e.preventDefault();
    e.returnValue = '';
  }
});

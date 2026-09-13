// 월간 달력. script.js의 currentSchool/grade/WORKER_URL을 재사용한다.
let calMonth = new Date();
let calData = { schedules: [], mealDays: [] };
let selDate = null;

function ymOf(d) { return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }
function shiftMonth(n) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth()+n, 1); loadCalendar(); }
function goThisMonth() { calMonth = new Date(); selDate = null; loadCalendar(); }

// script.js 초기화는 이 페이지 요소가 없어 중단될 수 있으니 직접 복원한다.
function restoreSchool() {
  try {
    const saved = localStorage.getItem('mySchool');
    if (saved && !currentSchool) currentSchool = JSON.parse(saved);
  } catch (e) {}
  if (!grade) grade = localStorage.getItem('myGrade') || null;
  if (!classNm) classNm = localStorage.getItem('myClass') || null;
}

async function loadCalendar() {
  restoreSchool();
  const msg = document.getElementById('calMsg');
  document.getElementById('monthLabel').textContent =
    `${calMonth.getFullYear()}년 ${calMonth.getMonth()+1}월`;
  if (!currentSchool) {
    msg.textContent = '학교를 먼저 골라줘! (오늘 화면에서 검색)';
    renderGrid();
    return;
  }
  msg.textContent = '불러오는 중...';
  try {
    const q = `office=${currentSchool.officeCode}&school=${currentSchool.schoolCode}` +
              (grade ? `&grade=${grade}` : '') + `&month=${ymOf(calMonth)}`;
    const data = await fetchJson(`${WORKER_URL}/api/calendar?${q}`);
    calData = data.ok ? { schedules: data.schedules || [], mealDays: data.mealDays || [] }
                      : { schedules: [], mealDays: [] };
    msg.textContent = data.ok ? '' : (data.msg || '달력 정보를 못 불러왔어.');
  } catch (e) {
    calData = { schedules: [], mealDays: [] };
    msg.textContent = '달력 정보를 못 불러왔어. 잠시 후 다시 시도해줘.';
  }
  await loadMyPlans();
  renderGrid();
  if (selDate) renderDetail(selDate);
}

// 학원/디데이는 서버에 있다. 로그인 세션이 있으면 불러온다.
async function loadMyPlans() {
  let email = null;
  try { email = (JSON.parse(localStorage.getItem('mySession') || '{}') || {}).email; } catch (e) {}
  if (!email) email = localStorage.getItem('myEmail');
  if (!email) return;
  const q = encodeURIComponent(email);
  try {
    const [a, d] = await Promise.all([
      fetchJson(`${WORKER_URL}/getacademy?email=${q}`, { headers: authHeaders() }).catch(() => null),
      fetchJson(`${WORKER_URL}/getdday?email=${q}`, { headers: authHeaders() }).catch(() => null)
    ]);
    if (a && a.ok && a.academies) academies = a.academies;
    if (d && d.ok && d.ddays) ddays = d.ddays;
  } catch (e) {}
}

// 저장된 학원/디데이 읽기 (script.js와 같은 키를 쓴다)
function savedAcademies() { return Array.isArray(academies) ? academies : []; }
function savedDdays() { return Array.isArray(ddays) ? ddays : []; }
// 학원 요일은 days 배열(0=일)로 저장된다. 단일 day 값도 함께 지원.
function acOnDay(a, dow) {
  if (Array.isArray(a.days)) return a.days.map(Number).includes(dow);
  if (a.day !== undefined) return Number(a.day) === dow;
  return false;
}
function ddKey(x) { return String(x.date || x.target || x.ymd || '').replace(/-/g, ''); }

const DOW = ['일','월','화','수','목','금','토'];

function renderGrid() {
  const dowRow = document.getElementById('dowRow');
  dowRow.innerHTML = DOW.map(d => `<div class="cal-dow">${d}</div>`).join('');

  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const first = new Date(y, m, 1).getDay();
  const last = new Date(y, m+1, 0).getDate();
  const todayY = ymd(new Date());
  const evSet = new Set(calData.schedules.map(s => s.date));
  const holiSet = new Set(calData.schedules.filter(s => s.kind).map(s => s.date));
  const mealSet = new Set(calData.mealDays);
  const acs = savedAcademies(), dds = savedDdays();

  let html = '';
  for (let i = 0; i < first; i++) html += '<div class="cal-cell empty"></div>';
  for (let d = 1; d <= last; d++) {
    const dt = new Date(y, m, d);
    const key = ymd(dt);
    const cls = ['cal-cell'];
    if (key === todayY) cls.push('today');
    if (key === selDate) cls.push('sel');
    if (dt.getDay() === 0 || holiSet.has(key)) cls.push('holiday');
    const hasAc = acs.some(a => acOnDay(a, dt.getDay()));
    const hasDd = dds.some(x => ddKey(x) === key);
    let dots = '';
    if (evSet.has(key)) dots += '<i class="dot ev"></i>';
    if (mealSet.has(key)) dots += '<i class="dot meal"></i>';
    if (hasAc) dots += '<i class="dot ac"></i>';
    if (hasDd) dots += '<i class="dot dd"></i>';
    html += `<div class="${cls.join(' ')}" onclick="pickDate('${key}')">` +
            `<div>${d}</div><div class="dots">${dots}</div></div>`;
  }
  document.getElementById('calGrid').innerHTML = html;
}

function pickDate(key) { selDate = key; renderGrid(); renderDetail(key); }

function fmtKey(key) {
  const y = +key.slice(0,4), m = +key.slice(4,6), d = +key.slice(6,8);
  return `${m}월 ${d}일 (${DOW[new Date(y, m-1, d).getDay()]})`;
}

async function renderDetail(key) {
  const el = document.getElementById('calDetail');
  const evs = calData.schedules.filter(s => s.date === key);
  const y = +key.slice(0,4), m = +key.slice(4,6), d = +key.slice(6,8);
  const dt = new Date(y, m-1, d);
  const acs = savedAcademies().filter(a => acOnDay(a, dt.getDay()));
  const dds = savedDdays();

  let html = `<div style="font-weight:800;font-size:16px;margin-bottom:8px">${fmtKey(key)}</div>`;
  html += sec('🏫 학교 일정', evs.length ? evs.map(e => `· ${e.name}${e.kind ? ` (${e.kind})` : ''}`).join('\n') : '등록된 학교 일정이 없어.');
  html += sec('🎒 학원', acs.length ? acs.map(a => `· ${a.name}${a.time ? ` ${a.time}` : ''}`).join('\n') : '이 날은 학원 일정이 없어.');

  const ddText = dds.map(x => {
    const t = ddKey(x);
    if (!t) return null;
    const diff = Math.round((new Date(+t.slice(0,4), +t.slice(4,6)-1, +t.slice(6,8)) - dt) / 86400000);
    if (diff === 0) return `· ${x.name} — 오늘!`;
    if (diff > 0) return `· ${x.name} — ${diff}일 남음`;
    return null;
  }).filter(Boolean);
  html += sec('🎯 디데이', ddText.length ? ddText.join('\n') : '표시할 디데이가 없어.');

  const mealHas = calData.mealDays.includes(key);
  html += `<details class="det-sec"><summary>🍚 급식 ${mealHas ? '' : '(없음)'}</summary>` +
          `<div class="b" id="detMeal">${mealHas ? '펼치면 불러와요' : '이 날은 급식 정보가 없어.'}</div></details>`;
  html += `<details class="det-sec"><summary>📅 시간표</summary>` +
          `<div class="b" id="detTT">펼치면 불러와요</div></details>`;
  el.innerHTML = html;

  // 급식/시간표는 펼칠 때만 불러온다 (호출 절약)
  const dm = el.querySelector('details:nth-of-type(1)');
  if (mealHas && dm) dm.addEventListener('toggle', () => {
    if (dm.open) loadDetailMeal(key);
  }, { once: true });
  const dt2 = el.querySelectorAll('details')[1];
  if (dt2) dt2.addEventListener('toggle', () => {
    if (dt2.open) loadDetailTT(key);
  }, { once: true });
}

function sec(title, body) {
  return `<div class="det-sec"><div class="t">${title}</div><div class="b">${body}</div></div>`;
}

async function loadDetailMeal(key) {
  const box = document.getElementById('detMeal');
  if (!box || !currentSchool) return;
  box.textContent = '불러오는 중...';
  try {
    const data = await fetchJson(`${WORKER_URL}/api/meal?office=${currentSchool.officeCode}&school=${currentSchool.schoolCode}&date=${key}`);
    box.innerHTML = (data.ok && data.meal) ? data.meal.replace(/<br>/g, '\n') : '급식 정보가 없어.';
  } catch (e) { box.textContent = '급식을 못 불러왔어.'; }
}

async function loadDetailTT(key) {
  const box = document.getElementById('detTT');
  if (!box || !currentSchool) return;
  if (!grade || !classNm) { box.textContent = '학년·반을 먼저 골라줘.'; return; }
  box.textContent = '불러오는 중...';
  try {
    const data = await fetchJson(`${WORKER_URL}/api/timetable?office=${currentSchool.officeCode}&school=${currentSchool.schoolCode}&grade=${grade}&class=${classNm}&date=${key}`);
    box.innerHTML = (data.ok && data.timetable)
      ? data.timetable.replace(/<br>/g, '\n') + '\n\nℹ️ NEIS 등록 기준이라 실제와 다를 수 있어요.'
      : '시간표 정보가 없어.';
  } catch (e) { box.textContent = '시간표를 못 불러왔어.'; }
}

// script.js의 초기화가 localStorage에서 학교를 복원한 뒤에 실행되도록 살짝 늦춘다.
window.addEventListener('load', () => setTimeout(loadCalendar, 60));

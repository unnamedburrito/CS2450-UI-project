const HIDE_TABBAR_ON = ['signin', 'signup', 'session', 'confirm'];

function show(name) {
  document.querySelectorAll('.screen').forEach(s =>
    s.classList.toggle('active', s.dataset.screen === name)
  );
  document.querySelectorAll('.tabbar button[data-tab]').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === name)
  );
  document.getElementById('tabbar').style.display =
    HIDE_TABBAR_ON.includes(name) ? 'none' : 'grid';
  window.scrollTo(0, 0);
}

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

function setGym(name, count) {
  document.getElementById('gymName').textContent = name;
  document.getElementById('routeCount').textContent = count;
  show('home');
  toast('Switched to ' + name);
}

// Climb session
let sessionStart = null;
let sessionTimer = null;
let attempts = 0;
let sends = 0;

function startSession() {
  attempts = 0;
  sends = 0;
  document.getElementById('attempts').textContent = '0';
  document.getElementById('sends').textContent = '0';
  document.getElementById('best').textContent = '—';
  sessionStart = Date.now();
  if (sessionTimer) clearInterval(sessionTimer);
  sessionTimer = setInterval(tick, 1000);
  tick();
  show('session');
  toast('Session started');
}

function tick() {
  const s = Math.floor((Date.now() - sessionStart) / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  document.getElementById('timer').textContent = hh + ':' + mm + ':' + ss;
}

function logAttempt() {
  attempts++;
  document.getElementById('attempts').textContent = attempts;
  toast('Attempt logged');
}

function markSend() {
  attempts++;
  sends++;
  document.getElementById('attempts').textContent = attempts;
  document.getElementById('sends').textContent = sends;
  document.getElementById('best').textContent =
    document.getElementById('timer').textContent.slice(3);
  toast('Send!');
}

function endSessionPrompt() {
  if (!confirm('End this session?')) return;
  clearInterval(sessionTimer);
  sessionTimer = null;
  sessionStart = null;
  show('route');
  toast('Session saved');
}

// Create post
let photoCount = 0;
let selectedGrade = null;

function buildGradeGrid() {
  const grid = document.getElementById('gradeGrid');
  for (let i = 0; i <= 16; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-cell';
    b.textContent = 'V' + i;
    b.onclick = () => {
      selectedGrade = i;
      grid.querySelectorAll('.grade-cell').forEach(c =>
        c.classList.toggle('active', c === b)
      );
      validateCreate();
    };
    grid.appendChild(b);
  }
}

function addPhoto() {
  if (photoCount >= 6) {
    toast('Up to 6 photos');
    return;
  }
  photoCount++;
  const grid = document.getElementById('photoGrid');
  const tile = document.createElement('div');
  tile.className = 'photo-tile';
  tile.innerHTML = '<button style="position:absolute;top:2px;right:2px;padding:2px 6px;min-height:0;font-size:12px" onclick="removePhoto(this)">x</button>';
  grid.insertBefore(tile, grid.lastElementChild);
  validateCreate();
}

function removePhoto(btn) {
  btn.closest('.photo-tile').remove();
  photoCount--;
  validateCreate();
}

function validateCreate() {
  const name = document.getElementById('rname').value.trim();
  const ok = photoCount >= 1 && name.length >= 1 && selectedGrade !== null;
  document.getElementById('postBtn').disabled = !ok;
}

function cancelCreate() {
  const dirty = photoCount > 0 ||
    selectedGrade !== null ||
    document.getElementById('rname').value.trim();
  if (dirty && !confirm('Discard this draft?')) return;
  document.querySelectorAll('.photo-tile').forEach(p => p.remove());
  photoCount = 0;
  selectedGrade = null;
  document.getElementById('rname').value = '';
  document.querySelectorAll('#gradeGrid .grade-cell').forEach(c =>
    c.classList.remove('active')
  );
  validateCreate();
  show('home');
}

// Init
buildGradeGrid();
show('signin');

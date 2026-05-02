/* ─────────────────────────────────────────────────────────────
   SENDY  —  app.js
   In-memory route database with dynamic rendering + full
   filter / sort / create / search / profile support.
───────────────────────────────────────────────────────────── */

// ─── Helpers ─────────────────────────────────────────────────

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 7)  return d + 'd ago';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function stars(rating) {
  if (!rating) return '—/5';
  return '★'.repeat(rating) + '☆'.repeat(5 - rating) + '  ' + rating + '/5';
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Database ─────────────────────────────────────────────────
// Each route: { id, name, gym, grade, wall, tags[], rating,
//               user, postedAt, notes, tips[] }
// tip: { user, postedAt, text }

let _nextId = 100;
function nextId() { return _nextId++; }

const DB = [
  {
    id: 1,
    name: 'Monkey Bars',
    gym: 'BRIC',
    grade: 'V4',
    wall: 'overhang',
    tags: ['dyno', 'technical'],
    rating: 4,
    user: '@alex_sends',
    postedAt: Date.now() - 86400000 * 2,
    notes: 'Start on the two pinches at shoulder height. Rock your hips over the left foot, then throw big to the sloper rail. Heel hook the lip and mantle to top.',
    tips: [
      { user: '@beta_queen',  postedAt: Date.now() - 3600000 * 5, text: 'The left-hand undercling before the dyno is the key position — don\'t skip it.' },
      { user: '@pinch_king',  postedAt: Date.now() - 3600000 * 2, text: 'Keep hips glued to the wall through the crux or you\'ll swing off.' },
    ],
  },
  {
    id: 2,
    name: 'Glass Slipper',
    gym: 'BRIC',
    grade: 'V3',
    wall: 'vertical',
    tags: ['crimpy', 'technical'],
    rating: 3,
    user: '@v_grades',
    postedAt: Date.now() - 86400000 * 4,
    notes: 'Thin feet on the tiny footholds matter more than fingers here. Precise footwork = easy send.',
    tips: [
      { user: '@footwork_nerd', postedAt: Date.now() - 86400000, text: 'Trust the feet. The top-out looks scary but the holds are better than they look.' },
    ],
  },
  {
    id: 3,
    name: 'Friction Fiction',
    gym: 'Hangar 18',
    grade: 'V5',
    wall: 'slab',
    tags: [],
    rating: 0,
    user: '@slab_life',
    postedAt: Date.now() - 86400000 * 7,
    notes: 'Pure friction — no holds to speak of. Balance everything on the balls of your feet.',
    tips: [],
  },
  {
    id: 4,
    name: 'Bat Cave',
    gym: 'BRIC',
    grade: 'V6',
    wall: 'cave',
    tags: ['sloper', 'technical'],
    rating: 5,
    user: '@cave_dweller',
    postedAt: Date.now() - 86400000 * 1,
    notes: 'Deep cave route — compression is your friend. Get your chest into the wall on the crux move.',
    tips: [
      { user: '@compress_or_die', postedAt: Date.now() - 1800000, text: 'Heel hook the big volume on the right to unlock the crux sequence.' },
    ],
  },
  {
    id: 5,
    name: 'Jug Heaven',
    gym: 'BRIC',
    grade: 'V2',
    wall: 'slab',
    tags: ['jugs'],
    rating: 4,
    user: '@new_shoes',
    postedAt: Date.now() - 86400000 * 10,
    notes: 'Great warm-up. All jugs to a nice open slab top-out.',
    tips: [],
  },
  {
    id: 6,
    name: 'Crimp Street',
    gym: 'BRIC',
    grade: 'V1',
    wall: 'vertical',
    tags: ['crimpy'],
    rating: 3,
    user: '@beginner_sends',
    postedAt: Date.now() - 86400000 * 14,
    notes: 'Intro to crimping. Perfect for building finger strength.',
    tips: [
      { user: '@tape_budget', postedAt: Date.now() - 86400000 * 2, text: 'Half crimp beats open hand on the smaller holds here.' },
    ],
  },
  {
    id: 7,
    name: 'Launch Codes',
    gym: 'BRIC',
    grade: 'V8',
    wall: 'overhang',
    tags: ['dyno', 'jugs'],
    rating: 4,
    user: '@launch_pad',
    postedAt: Date.now() - 86400000 * 3,
    notes: 'Two big dynos back-to-back. Campus or use feet — both work.',
    tips: [
      { user: '@static_is_for_wimps', postedAt: Date.now() - 86400000 * 1, text: 'Matching on the jug between dynos is key. Don\'t rush it.' },
    ],
  },
  {
    id: 8,
    name: 'Air Guitar',
    gym: 'Hangar 18',
    grade: 'V7',
    wall: 'overhang',
    tags: ['dyno', 'sloper'],
    rating: 5,
    user: '@sends_4_days',
    postedAt: Date.now() - 86400000 * 5,
    notes: 'Huge dyno to a sloper. Throw with intention and squeeze hard at the catch.',
    tips: [
      { user: '@air_time', postedAt: Date.now() - 86400000 * 2, text: 'Aim slightly left of center on the sloper — better friction.' },
      { user: '@send_machine', postedAt: Date.now() - 3600000 * 8, text: 'Generate more power from the foot chip — most people underuse it.' },
    ],
  },
  {
    id: 9,
    name: 'Razor\'s Edge',
    gym: 'Hangar 18',
    grade: 'V3',
    wall: 'vertical',
    tags: ['crimpy', 'technical'],
    rating: 4,
    user: '@sharpfingers',
    postedAt: Date.now() - 86400000 * 6,
    notes: 'Thin crimps on a slightly overhung vertical wall. All about precision.',
    tips: [],
  },
  {
    id: 10,
    name: 'Spelunking',
    gym: 'Hangar 18',
    grade: 'V2',
    wall: 'cave',
    tags: ['jugs'],
    rating: 3,
    user: '@cave_curious',
    postedAt: Date.now() - 86400000 * 8,
    notes: 'Fun intro to cave climbing. Big jugs all the way.',
    tips: [],
  },
  {
    id: 11,
    name: 'Moon Slab',
    gym: 'Hangar 18',
    grade: 'V9',
    wall: 'slab',
    tags: ['technical'],
    rating: 5,
    user: '@feathers',
    postedAt: Date.now() - 86400000 * 9,
    notes: 'Smear-dependent masterpiece. Your shoe rubber determines your grade here.',
    tips: [
      { user: '@slab_ghost', postedAt: Date.now() - 86400000 * 3, text: 'Stand up slowly on the crux foot — any bounce and you\'ll pop off.' },
    ],
  },
  {
    id: 12,
    name: 'Frog Legs',
    gym: 'Hangar 18',
    grade: 'V4',
    wall: 'overhang',
    tags: ['dyno'],
    rating: 4,
    user: '@hops_a_lot',
    postedAt: Date.now() - 86400000 * 11,
    notes: 'Jump from a low sit-start to a big jug. Legs drive everything.',
    tips: [],
  },
];

// Track the route being viewed
let currentRouteId = null;
// Track ID of the most recently posted route
let lastPostedId = null;

// ─── Navigation ───────────────────────────────────────────────

const HIDE_TABBAR_ON = ['signin', 'signup', 'confirm'];

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

  // Side-effects on navigation
  if (name === 'profile') renderProfile();
  if (name === 'search')  renderTrending();
  if (name === 'home')    renderCards();
}

// ─── Toast ────────────────────────────────────────────────────

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ─── Gym / Location ───────────────────────────────────────────

function setGym(name) {
  document.getElementById('gymName').textContent = name;
  applyHomeFilters();
  show('home');
  toast('Switched to ' + name);
}

// ─── Card Renderer ────────────────────────────────────────────

/**
 * Build the HTML string for a single route card.
 * @param {Object} r  - route object from DB
 */
function buildCardHTML(r) {
  const tagStr = [r.wall, ...r.tags].filter(Boolean).join(' · ');
  const ratingStr = r.rating ? r.rating + '/5' : '?/5';
  const tipCount = r.tips.length;
  return `
    <div class="card" onclick="showRoute(${r.id})" role="article" tabindex="0"
         aria-label="${esc(r.name)}, ${esc(r.grade)}"
         onkeydown="if(event.key==='Enter')showRoute(${r.id})">
      <div class="img">[ photo ]</div>
      <div class="body">
        <div class="row-tight">
          <strong class="grow">${esc(r.name)}</strong>
          <span class="grade-badge">${esc(r.grade)}</span>
        </div>
        <p class="small muted">${esc(r.gym)} · ${ratingStr} · ${tipCount} tip${tipCount !== 1 ? 's' : ''} · ${esc(r.user)}</p>
        ${tagStr ? `<p class="small tag-row">${esc(tagStr)}</p>` : ''}
      </div>
    </div>`;
}

/**
 * Re-renders #card-container based on the current gym + filterState.
 */
function renderCards() {
  const gym     = document.getElementById('gymName').textContent;
  const container = document.getElementById('card-container');

  // 1. Filter
  let visible = DB.filter(r => {
    if (r.gym !== gym) return false;
    if (filterState.grade.size && !filterState.grade.has(r.grade)) return false;
    if (filterState.wall.size  && !filterState.wall.has(r.wall))   return false;
    if (filterState.tags.size) {
      if (!r.tags.some(t => filterState.tags.has(t))) return false;
    }
    return true;
  });

  // 2. Sort
  switch (filterState.sort) {
    case 'oldest':  visible = [...visible].sort((a,b) => a.postedAt - b.postedAt); break;
    case 'rating':  visible = [...visible].sort((a,b) => b.rating - a.rating);     break;
    case 'sends':   visible = [...visible].sort((a,b) => b.tips.length - a.tips.length); break;
    default:        visible = [...visible].sort((a,b) => b.postedAt - a.postedAt); // recent
  }

  // 3. Render
  if (visible.length === 0) {
    container.innerHTML = `
      <p class="small muted" style="text-align:center;padding:32px 0">
        No routes match these filters.
      </p>`;
  } else {
    container.innerHTML = visible.map(buildCardHTML).join('');
  }

  document.getElementById('routeCount').textContent = visible.length;
}

// alias used by filter system
function applyHomeFilters() {
  renderCards();
}

// ─── Route Detail ─────────────────────────────────────────────

function showRoute(id) {
  const r = DB.find(r => r.id === id);
  if (!r) return;
  currentRouteId = id;

  document.getElementById('route-name').textContent = r.name;
  document.getElementById('route-header-title').textContent = r.name;
  document.getElementById('route-meta').textContent =
    `${r.grade} · ${r.gym} · posted ${timeAgo(r.postedAt)}`;
  document.getElementById('route-rating').textContent =
    `${stars(r.rating)} · ${r.tips.length} tip${r.tips.length !== 1 ? 's' : ''}`;
  document.getElementById('route-user').textContent = r.user;
  document.getElementById('route-notes').textContent =
    r.notes || 'No notes provided.';

  renderTipsList(r);
  document.getElementById('route-tip-input').value = '';
  show('route');
}

function renderTipsList(r) {
  const heading = document.getElementById('route-tips-heading');
  const list    = document.getElementById('route-tips-list');
  heading.textContent = `Tips (${r.tips.length})`;

  if (r.tips.length === 0) {
    list.innerHTML = `
      <div class="item">
        <p class="small muted" style="width:100%;text-align:center;padding:8px 0">
          No tips yet — be the first!
        </p>
      </div>`;
    return;
  }

  list.innerHTML = r.tips.map(tip => `
    <div class="item">
      <div class="grow">
        <strong>${esc(tip.user)}</strong>
        <span class="muted small"> ${timeAgo(tip.postedAt)}</span>
        <p class="small">${esc(tip.text)}</p>
      </div>
    </div>`).join('');
}

function postTip() {
  const input = document.getElementById('route-tip-input');
  const text  = input.value.trim();
  if (!text) { toast('Write something first'); return; }
  const r = DB.find(r => r.id === currentRouteId);
  if (!r) return;

  r.tips.push({ user: '@you', postedAt: Date.now(), text });
  input.value = '';
  renderTipsList(r);

  // update rating line
  document.getElementById('route-rating').textContent =
    `${stars(r.rating)} · ${r.tips.length} tip${r.tips.length !== 1 ? 's' : ''}`;

  toast('Tip posted!');
}

// ─── Create Post ──────────────────────────────────────────────

let photoCount    = 0;
let selectedGrade = null;

function buildGradeGrid() {
  const grid = document.getElementById('gradeGrid');
  for (let i = 0; i <= 10; i++) {
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
  if (photoCount >= 6) { toast('Up to 6 photos'); return; }
  photoCount++;
  const grid = document.getElementById('photoGrid');
  const tile = document.createElement('div');
  tile.className = 'photo-tile';
  tile.innerHTML = `
    <button style="position:absolute;top:4px;right:4px;padding:2px 7px;min-height:0;font-size:11px;border-radius:4px"
            onclick="removePhoto(this)">✕</button>`;
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
  const ok = name.length >= 1 && selectedGrade !== null;
  document.getElementById('postBtn').disabled = !ok;
}

/**
 * Read the create form, push a new route to DB, show confirm.
 */
function submitPost() {
  const name  = document.getElementById('rname').value.trim();
  const wall  = document.getElementById('rwall').value;
  const grade = 'V' + selectedGrade;
  const tags  = document.getElementById('rtags').value
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
  const notes = document.getElementById('rnotes').value.trim();
  const gym   = document.getElementById('gymName').textContent;

  const newRoute = {
    id:       nextId(),
    name,
    gym,
    grade,
    wall:     wall || '',
    tags,
    rating:   0,
    user:     '@you',
    postedAt: Date.now(),
    notes:    notes || '',
    tips:     [],
  };

  DB.push(newRoute);
  lastPostedId = newRoute.id;

  // Populate confirm screen preview card
  document.getElementById('confirm-card').innerHTML = buildCardHTML(newRoute);

  // Reset form so next create session is a clean slate
  _resetCreateForm();
  show('confirm');
}

function viewNewRoute() {
  if (lastPostedId !== null) showRoute(lastPostedId);
}

function cancelCreate() {
  const dirty = photoCount > 0 ||
    selectedGrade !== null ||
    document.getElementById('rname').value.trim();
  if (dirty && !confirm('Discard this draft?')) return;
  _resetCreateForm();
  show('home');
}

function _resetCreateForm() {
  document.querySelectorAll('.photo-tile').forEach(p => p.remove());
  photoCount    = 0;
  selectedGrade = null;
  document.getElementById('rname').value  = '';
  document.getElementById('rwall').value  = '';
  document.getElementById('rtags').value  = '';
  document.getElementById('rnotes').value = '';
  document.querySelectorAll('#gradeGrid .grade-cell').forEach(c =>
    c.classList.remove('active')
  );
  validateCreate();
}

// ─── Filter State & Logic ─────────────────────────────────────

const filterState = {
  sort:       'recent',
  grade:      new Set(),
  wall:       new Set(),
  tags:       new Set(),
  searchTags: new Set(),
};

const chipLabels = {
  sort:  { recent: 'Most Recent', oldest: 'Oldest', rating: 'Highest Rated', sends: 'Most Sent' },
  grade: 'Grade',
  wall:  'Wall',
  tags:  'Tags',
};

function buildGradeFilterGrid() {
  const grid = document.getElementById('gradeFilterGrid');
  if (!grid) return;
  for (let i = 0; i <= 10; i++) {
    const b = document.createElement('button');
    b.className = 'opt';
    b.dataset.value = 'V' + i;
    b.textContent   = 'V' + i;
    grid.appendChild(b);
  }
}

function closeFilterPanel() {
  document.querySelectorAll('.filter-panel').forEach(p => p.hidden = true);
  document.querySelectorAll('.filters .chip').forEach(c => {
    if (!c.classList.contains('has-value') && c.dataset.filter !== 'all') {
      c.classList.remove('active');
    }
  });
}

function clearFilter(key) {
  if (key === 'sort') { filterState.sort = 'recent'; }
  else { filterState[key].clear(); }
  refreshFilterUI();
}

function clearAllHomeFilters() {
  filterState.sort = 'recent';
  filterState.grade.clear();
  filterState.wall.clear();
  filterState.tags.clear();
  refreshFilterUI();
}

function refreshFilterUI() {
  document.querySelectorAll('#homeFilters .chip').forEach(chip => {
    const f = chip.dataset.filter;
    if (!f || f === 'all') return;
    let active = false, label;
    if (f === 'sort') {
      active = filterState.sort !== 'recent';
      label  = chipLabels.sort[filterState.sort] + ' ▾';
    } else {
      const set = filterState[f];
      active = set && set.size > 0;
      label  = chipLabels[f] + (active ? ` (${set.size})` : '') + ' ▾';
    }
    chip.textContent = label;
    chip.classList.toggle('has-value', active);
  });

  const homeAll = document.querySelector('#homeFilters .chip[data-filter="all"]');
  if (homeAll) {
    const anySet = filterState.sort !== 'recent' ||
      filterState.grade.size || filterState.wall.size || filterState.tags.size;
    homeAll.classList.toggle('active', !anySet);
  }

  const searchTagsChip = document.querySelector('#searchFilters .chip[data-scope="tags"]');
  if (searchTagsChip) {
    const n = filterState.searchTags.size;
    searchTagsChip.textContent = 'Tags' + (n ? ` (${n})` : '') + ' ▾';
    searchTagsChip.classList.toggle('has-value', n > 0);
  }

  document.querySelectorAll('.filter-options').forEach(group => {
    const key  = group.dataset.key;
    const mode = group.dataset.mode;
    group.querySelectorAll('.opt').forEach(o => {
      const v  = o.dataset.value;
      const on = mode === 'single'
        ? filterState[key] === v
        : filterState[key].has(v);
      o.classList.toggle('active', on);
    });
  });

  applyHomeFilters();
}

// ─── Search ───────────────────────────────────────────────────

function runSearch() {
  const query   = document.getElementById('search-input').value.trim().toLowerCase();
  const results = document.getElementById('search-results');
  const trending = document.getElementById('search-trending');

  if (!query) {
    results.querySelector('h3').textContent = 'Trending';
    renderTrending();
    return;
  }

  results.querySelector('h3').textContent = 'Results';

  const matched = DB.filter(r =>
    r.name.toLowerCase().includes(query) ||
    r.gym.toLowerCase().includes(query)  ||
    r.grade.toLowerCase().includes(query)||
    r.tags.some(t => t.includes(query))  ||
    r.wall.includes(query)
  );

  if (matched.length === 0) {
    trending.innerHTML = `<div class="item"><p class="small muted" style="padding:8px 0">No routes found for "${esc(query)}"</p></div>`;
    return;
  }

  trending.innerHTML = matched.map(r => `
    <div class="item" onclick="showRoute(${r.id})" tabindex="0"
         onkeydown="if(event.key==='Enter')showRoute(${r.id})">
      <div class="grow">
        <strong>${esc(r.name)}</strong>
        <div class="small muted">${esc(r.grade)} · ${esc(r.gym)} · ${r.tips.length} tips</div>
      </div>
    </div>`).join('');
}

function renderTrending() {
  const list = document.getElementById('search-trending');
  if (!list) return;
  const top = [...DB]
    .sort((a, b) => (b.rating + b.tips.length) - (a.rating + a.tips.length))
    .slice(0, 5);
  list.innerHTML = top.map(r => `
    <div class="item" onclick="showRoute(${r.id})" tabindex="0"
         onkeydown="if(event.key==='Enter')showRoute(${r.id})">
      <div class="grow">
        <strong>${esc(r.name)}</strong>
        <div class="small muted">${esc(r.grade)} · ${esc(r.gym)}</div>
      </div>
      <span style="color:var(--blue-hover);font-size:13px">${r.rating ? '★ ' + r.rating : ''}</span>
    </div>`).join('');
}

// ─── Profile ──────────────────────────────────────────────────

function renderProfile() {
  const gym   = document.getElementById('gymName').textContent;
  const mine  = DB.filter(r => r.user === '@you');
  const list  = document.getElementById('profile-list');

  document.getElementById('profile-gym').textContent = `@you · ${gym}`;
  document.getElementById('profile-post-count').textContent =
    mine.length === 1 ? '1 post' : `${mine.length} posts`;

  if (mine.length === 0) {
    list.innerHTML = `<div class="item"><p class="small muted" style="padding:8px 0">No posts yet — create your first route!</p></div>`;
    return;
  }

  list.innerHTML = mine
    .sort((a, b) => b.postedAt - a.postedAt)
    .map(r => `
      <div class="item" onclick="showRoute(${r.id})" tabindex="0"
           onkeydown="if(event.key==='Enter')showRoute(${r.id})">
        <div class="grow">
          <strong>${esc(r.name)} · ${esc(r.grade)}</strong>
          <div class="small muted">${timeAgo(r.postedAt)} · ${esc(r.gym)}</div>
        </div>
      </div>`).join('');
}

// ─── Event Delegation ─────────────────────────────────────────

document.addEventListener('click', e => {
  // Home filter chips
  const filterChip = e.target.closest('#homeFilters .chip');
  if (filterChip) {
    const key = filterChip.dataset.filter;
    if (key === 'all') { clearAllHomeFilters(); closeFilterPanel(); return; }
    const panel   = document.querySelector(`#homeFilters .filter-panel[data-panel="${key}"]`);
    const wasOpen = panel && !panel.hidden;
    closeFilterPanel();
    if (panel && !wasOpen) { panel.hidden = false; filterChip.classList.add('active'); }
    return;
  }

  // Search scope chips
  const scopeChip = e.target.closest('#searchFilters .chip');
  if (scopeChip) {
    const scope = scopeChip.dataset.scope;
    document.querySelectorAll('#searchFilters .chip').forEach(c =>
      c.classList.toggle('active', c === scopeChip)
    );
    const tagsPanel = document.querySelector('#searchFilters .filter-panel[data-panel="tags"]');
    if (tagsPanel) tagsPanel.hidden = scope !== 'tags';
    return;
  }

  // Filter option buttons
  const opt = e.target.closest('.filter-options .opt');
  if (opt) {
    const group = opt.closest('.filter-options');
    const key   = group.dataset.key;
    const mode  = group.dataset.mode;
    const v     = opt.dataset.value;
    if (mode === 'single') {
      filterState[key] = v;
    } else {
      filterState[key].has(v) ? filterState[key].delete(v) : filterState[key].add(v);
    }
    refreshFilterUI();
    return;
  }

  // Click outside filters closes panel
  if (!e.target.closest('.filters')) closeFilterPanel();
});

// Profile section tabs
document.addEventListener('click', e => {
  const profileChip = e.target.closest('[data-screen="profile"] .chip');
  if (!profileChip) return;
  profileChip.parentElement.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('active', c === profileChip)
  );
});

// ─── Boot ─────────────────────────────────────────────────────

buildGradeGrid();
buildGradeFilterGrid();
document.getElementById('gymName').textContent = 'BRIC';
refreshFilterUI();
show('signin');
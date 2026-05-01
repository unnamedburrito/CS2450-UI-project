

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
}


let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

function setGym(name) {
  document.getElementById('gymName').textContent = name;
  filterHomeRoutes();
  show('home');
  toast('Switched to ' + name);
}

function filterHomeRoutes() { applyHomeFilters(); }

function applyHomeFilters() {
  const gym = document.getElementById('gymName').textContent;
  const cards = Array.from(document.querySelectorAll('[data-screen="home"] .card'));
  if (!cards.length) return;
  const parent = cards[0].parentElement;

  const matches = card => {
    if (card.dataset.gym !== gym) return false;
    if (filterState.grade.size && !filterState.grade.has(card.dataset.grade)) return false;
    if (filterState.wall.size && !filterState.wall.has(card.dataset.wall)) return false;
    if (filterState.tags.size) {
      const cardTags = (card.dataset.tags || '').split(',').filter(Boolean);
      if (!cardTags.some(t => filterState.tags.has(t))) return false;
    }
    return true;
  };

  let visible = cards.filter(matches);

  const sortKey = filterState.sort;
  if (sortKey === 'oldest') visible = visible.slice().reverse();
  else if (sortKey === 'rating') {
    visible = visible.slice().sort((a, b) => Number(b.dataset.rating || 0) - Number(a.dataset.rating || 0));
  }

  cards.forEach(c => { c.style.display = 'none'; });
  visible.forEach(c => {
    c.style.display = '';
    parent.appendChild(c);
  });

  let empty = document.getElementById('homeEmpty');
  if (!visible.length) {
    if (!empty) {
      empty = document.createElement('p');
      empty.id = 'homeEmpty';
      empty.className = 'small muted';
      empty.style.textAlign = 'center';
      empty.style.padding = '24px 0';
      empty.textContent = 'No routes match these filters.';
      parent.appendChild(empty);
    }
    empty.style.display = '';
  } else if (empty) {
    empty.style.display = 'none';
  }

  document.getElementById('routeCount').textContent = visible.length;
}

// Create post
let photoCount = 0;
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

// Filter dropdowns
const filterState = {
  sort: 'recent',
  grade: new Set(),
  wall: new Set(),
  tags: new Set(),
  searchTags: new Set(),
};

const chipLabels = {
  sort: { recent: 'Most Recent', oldest: 'Oldest', rating: 'Highest Rated', sends: 'Most Sent' },
  grade: 'Grade',
  wall: 'Wall',
  tags: 'Tags',
};

function buildGradeFilterGrid() {
  const grid = document.getElementById('gradeFilterGrid');
  if (!grid) return;
  for (let i = 0; i <= 10; i++) {
    const b = document.createElement('button');
    b.className = 'opt';
    b.dataset.value = 'V' + i;
    b.textContent = 'V' + i;
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
  if (key === 'sort') {
    filterState.sort = 'recent';
  } else {
    filterState[key].clear();
  }
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
    let active = false;
    let label;
    if (f === 'sort') {
      active = filterState.sort !== 'recent';
      label = chipLabels.sort[filterState.sort] + ' ▾';
    } else {
      const set = filterState[f];
      active = set && set.size > 0;
      label = chipLabels[f] + (active ? ' (' + set.size + ')' : '') + ' ▾';
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
    searchTagsChip.textContent = 'Tags' + (n ? ' (' + n + ')' : '') + ' ▾';
    searchTagsChip.classList.toggle('has-value', n > 0);
  }

  document.querySelectorAll('.filter-options').forEach(group => {
    const key = group.dataset.key;
    const mode = group.dataset.mode;
    group.querySelectorAll('.opt').forEach(o => {
      const v = o.dataset.value;
      const on = mode === 'single'
        ? filterState[key] === v
        : filterState[key].has(v);
      o.classList.toggle('active', on);
    });
  });

  applyHomeFilters();
}

document.addEventListener('click', e => {
  const filterChip = e.target.closest('#homeFilters .chip');
  if (filterChip) {
    const key = filterChip.dataset.filter;
    if (key === 'all') {
      clearAllHomeFilters();
      closeFilterPanel();
      return;
    }
    const panel = document.querySelector('#homeFilters .filter-panel[data-panel="' + key + '"]');
    const wasOpen = panel && !panel.hidden;
    closeFilterPanel();
    if (panel && !wasOpen) {
      panel.hidden = false;
      filterChip.classList.add('active');
    }
    return;
  }

  const scopeChip = e.target.closest('#searchFilters .chip');
  if (scopeChip) {
    const scope = scopeChip.dataset.scope;
    document.querySelectorAll('#searchFilters .chip').forEach(c =>
      c.classList.toggle('active', c === scopeChip)
    );
    const tagsPanel = document.querySelector('#searchFilters .filter-panel[data-panel="tags"]');
    if (tagsPanel) {
      tagsPanel.hidden = scope !== 'tags';
    }
    return;
  }

  const opt = e.target.closest('.filter-options .opt');
  if (opt) {
    const group = opt.closest('.filter-options');
    const key = group.dataset.key;
    const mode = group.dataset.mode;
    const v = opt.dataset.value;
    if (mode === 'single') {
      filterState[key] = v;
    } else {
      const set = filterState[key];
      if (set.has(v)) set.delete(v); else set.add(v);
    }
    refreshFilterUI();
    return;
  }

  if (!e.target.closest('.filters')) {
    closeFilterPanel();
  }
});

// Profile section tabs
document.addEventListener('click', e => {
  const profileChip = e.target.closest('[data-screen="profile"] .chip');
  if (!profileChip) return;
  profileChip.parentElement.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('active', c === profileChip)
  );
});


buildGradeGrid();
buildGradeFilterGrid();
document.getElementById('gymName').textContent = 'BRIC';
refreshFilterUI();
show('signin');

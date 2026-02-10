// ==================== STATE ====================
let currentUser = null;
let categories = [];
let cities = [];

// ==================== ICONS (SVG Outline) ====================
const categoryIcons = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>',
  car: '<svg viewBox="0 0 24 24"><path d="M5 17h14M5 17a2 2 0 0 1-2-2v-3l2-5h14l2 5v3a2 2 0 0 1-2 2M5 17a2 2 0 1 0 4 0m6 0a2 2 0 1 0 4 0M3 12h18"/></svg>',
  smartphone: '<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  sofa: '<svg viewBox="0 0 24 24"><path d="M4 11V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3"/><path d="M2 11v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M4 17v2m16-2v2"/></svg>',
  shirt: '<svg viewBox="0 0 24 24"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10h12V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="2" y1="13" x2="22" y2="13"/></svg>',
  tools: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  paw: '<svg viewBox="0 0 24 24"><circle cx="11" cy="4" r="2"/><circle cx="4.5" cy="9" r="2"/><circle cx="17.5" cy="9" r="2"/><circle cx="8" cy="15" r="2"/><circle cx="16" cy="15" r="2"/><path d="M12 22c-2-2-6-4-6-8 0-2 2-4 6-4s6 2 6 4c0 4-4 6-6 8z"/></svg>',
  baby: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/><path d="M10 7h.01M14 7h.01M10 10c.5.5 1.5 1 2 1s1.5-.5 2-1"/></svg>',
  football: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/></svg>'
};

const HEART_SVG = '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadInitialData();
  handleRoute();
  window.addEventListener('hashchange', handleRoute);
});

async function loadInitialData() {
  try {
    [categories, cities] = await Promise.all([
      API.get('/api/categories'),
      API.get('/api/cities')
    ]);
    try {
      currentUser = await API.get('/api/auth/me');
    } catch (e) {
      currentUser = null;
    }
  } catch (e) {
    console.error('Init error:', e);
  }
}

// ==================== ROUTING ====================
function handleRoute() {
  const hash = window.location.hash || '#/';
  const [path, query] = hash.split('?');

  const params = new URLSearchParams(query || '');

  if (path === '#/' || path === '#') renderHome();
  else if (path === '#/login') renderLogin();
  else if (path === '#/register') renderRegister();
  else if (path === '#/post-ad') renderPostAd();
  else if (path.startsWith('#/edit-ad/')) renderPostAd(path.split('/')[2]);
  else if (path.startsWith('#/ad/')) renderAdDetail(path.split('/')[2]);
  else if (path === '#/category' || path.startsWith('#/category')) renderCategoryPage(params);
  else if (path === '#/search') renderSearchPage(params);
  else if (path === '#/my-ads') renderMyAds();
  else if (path === '#/profile') renderProfile();
  else renderHome();

  window.scrollTo(0, 0);
}

function navigate(hash) {
  window.location.hash = hash;
}

// ==================== HEADER ====================
function renderHeader() {
  const lang = getLang();
  const otherLang = lang === 'az' ? 'RU' : 'AZ';

  return `
    <header class="header">
      <div class="header-top">
        <a href="#/" class="logo">Vitrin<span>.az</span></a>
        <div class="search-bar">
          <input type="text" id="headerSearch" placeholder="${t('search_placeholder')}"
                 onkeydown="if(event.key==='Enter') doSearch()">
          <button onclick="doSearch()">${t('search_btn')}</button>
        </div>
        <div class="header-actions">
          <button class="lang-switch" onclick="setLang('${lang === 'az' ? 'ru' : 'az'}')">${otherLang}</button>
          ${currentUser ? `
            <a href="#/post-ad" class="btn btn-primary">➕ <span>${t('post_ad')}</span></a>
            <div class="user-menu">
              <button class="user-btn" onclick="toggleDropdown()">
                <div class="user-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
                <span>${currentUser.name.split(' ')[0]}</span>
              </button>
              <div class="dropdown" id="userDropdown">
                <a href="#/my-ads">${t('my_ads')}</a>
                <a href="#/profile">${t('profile')}</a>
                <div class="divider"></div>
                <button onclick="doLogout()">${t('logout')}</button>
              </div>
            </div>
          ` : `
            <a href="#/login" class="btn btn-outline">${t('login')}</a>
            <a href="#/post-ad" class="btn btn-primary">➕ <span>${t('post_ad')}</span></a>
          `}
        </div>
      </div>
      <nav class="categories-bar">
        <div class="categories-scroll">
          ${categories.map(c => `
            <a href="#/category?cat=${c.slug}" class="cat-item">
              <span class="cat-icon">${categoryIcons[c.icon] || '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2"/></svg>'}</span>
              ${lang === 'az' ? c.name_az : c.name_ru}
            </a>
          `).join('')}
        </div>
      </nav>
    </header>
  `;
}

// ==================== FOOTER ====================
function renderFooter() {
  return `
    <footer class="footer">
      <div class="footer-content">
        <div>
          <h4>Vitrin.az</h4>
          <p style="font-size:14px;color:#aaa">${t('about_text')}</p>
        </div>
        <div>
          <h4>${t('useful_links')}</h4>
          <a href="#/">${t('home')}</a>
          <a href="#/category">${t('all_ads')}</a>
          <a href="#/post-ad">${t('post_ad')}</a>
        </div>
        <div>
          <h4>${t('contact')}</h4>
          <a href="#">${t('help')}</a>
          <a href="#">${t('rules')}</a>
          <a href="#">info@vitrin.az</a>
        </div>
      </div>
      <div class="footer-bottom">
        © 2026 Vitrin.az — ${t('all_rights')}
      </div>
    </footer>
    <nav class="mobile-nav">
      <div class="mobile-nav-inner">
        <a href="#/" class="active"><span class="nav-icon">🏠</span>${t('home')}</a>
        <a href="#/search"><span class="nav-icon">🔍</span>${t('search')}</a>
        <a href="#/post-ad"><span class="nav-icon">➕</span>${t('add')}</a>
        <a href="${currentUser ? '#/my-ads' : '#/login'}"><span class="nav-icon">📋</span>${t('my_ads')}</a>
        <a href="${currentUser ? '#/profile' : '#/login'}"><span class="nav-icon">👤</span>${t('profile')}</a>
      </div>
    </nav>
  `;
}

// ==================== HOME PAGE ====================
function renderHome() {
  const lang = getLang();
  const app = document.getElementById('app');
  app.innerHTML = renderHeader() + `
    <main class="container">
      <section>
        <div class="section-header">
          <h2 class="section-title">${t('latest_ads')}</h2>
          <a href="#/category" class="section-link">${t('all_ads')} →</a>
        </div>
        <div class="ads-grid" id="latestAds">
          <div class="loading"><div class="spinner"></div>${t('loading')}</div>
        </div>
      </section>
    </main>
  ` + renderFooter();

  loadLatestAds();
}

async function loadLatestAds() {
  try {
    const data = await API.get('/api/ads?limit=12');
    const container = document.getElementById('latestAds');
    if (data.ads.length === 0) {
      container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">📭</div><p>${t('no_results')}</p></div>`;
      return;
    }
    container.innerHTML = data.ads.map(ad => renderAdCard(ad)).join('');
  } catch (e) {
    console.error(e);
  }
}

// ==================== AD CARD ====================
function renderAdCard(ad) {
  const lang = getLang();
  const title = lang === 'az' ? ad.title_az : (ad.title_ru || ad.title_az);
  const city = lang === 'az' ? ad.city_name_az : (ad.city_name_ru || ad.city_name_az);
  const img = ad.images && ad.images.length > 0 ? ad.images[0] : null;
  const date = formatDate(ad.created_at);

  // Badge logic - "Yeni" for ads less than 24h old
  const adAge = Date.now() - new Date(ad.created_at).getTime();
  const isNew = adAge < 86400000; // 24 hours
  const badgeHtml = isNew ? `<span class="ad-card-badge badge-new">${lang === 'az' ? 'Yeni' : 'Новое'}</span>` : '';

  return `
    <a href="#/ad/${ad.id}" class="ad-card">
      <div class="ad-card-img">
        ${img ? `<img src="${img}" alt="${title}" loading="lazy">` : `<div class="no-img">📷</div>`}
        ${badgeHtml}
        <button class="ad-card-favorite" onclick="toggleFavorite(event, ${ad.id})" title="${lang === 'az' ? 'Bəyən' : 'Нравится'}">
          ${HEART_SVG}
        </button>
      </div>
      <div class="ad-card-body">
        <div class="ad-card-price">${ad.price > 0 ? formatPrice(ad.price) + ' ' + ad.currency : 'Razılaşma'}</div>
        <div class="ad-card-title">${escapeHtml(title)}</div>
        <div class="ad-card-meta">
          <span>📍 ${city || ''}</span>
          <span>${date}</span>
        </div>
      </div>
    </a>
  `;
}

function toggleFavorite(event, adId) {
  event.preventDefault();
  event.stopPropagation();
  const btn = event.currentTarget;
  btn.classList.toggle('liked');
}

// ==================== CATEGORY / SEARCH PAGE ====================
function renderCategoryPage(params) {
  const lang = getLang();
  const catSlug = params.get('cat') || '';
  const catObj = categories.find(c => c.slug === catSlug);
  const pageTitle = catObj ? (lang === 'az' ? catObj.name_az : catObj.name_ru) : t('all_ads');

  const app = document.getElementById('app');
  app.innerHTML = renderHeader() + `
    <main class="container">
      <h1 class="page-title">${pageTitle}</h1>
      <div class="page-with-sidebar">
        ${renderFilters(catSlug)}
        <div>
          <div class="ads-grid" id="adsContainer">
            <div class="loading" style="grid-column:1/-1"><div class="spinner"></div>${t('loading')}</div>
          </div>
          <div id="pagination"></div>
        </div>
      </div>
    </main>
  ` + renderFooter();

  loadAds(catSlug);
}

function renderSearchPage(params) {
  const query = params.get('q') || '';
  const app = document.getElementById('app');
  app.innerHTML = renderHeader() + `
    <main class="container">
      <h1 class="page-title">"${escapeHtml(query)}" — ${t('search')}</h1>
      <div class="page-with-sidebar">
        ${renderFilters('', query)}
        <div>
          <div class="ads-grid" id="adsContainer">
            <div class="loading" style="grid-column:1/-1"><div class="spinner"></div>${t('loading')}</div>
          </div>
          <div id="pagination"></div>
        </div>
      </div>
    </main>
  ` + renderFooter();

  loadAds('', 1, query);
}

function renderFilters(selectedCat = '', searchQuery = '') {
  const lang = getLang();
  return `
    <aside class="filters-sidebar">
      <div class="filter-group">
        <label class="filter-label">${t('category')}</label>
        <select id="filterCategory">
          <option value="">${t('all_categories')}</option>
          ${categories.map(c => `
            <option value="${c.slug}" ${c.slug === selectedCat ? 'selected' : ''}>
              ${lang === 'az' ? c.name_az : c.name_ru}
            </option>
          `).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">${t('city')}</label>
        <select id="filterCity">
          <option value="">${t('all_cities')}</option>
          ${cities.map(c => `
            <option value="${c.id}">${lang === 'az' ? c.name_az : c.name_ru}</option>
          `).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">${t('price')}</label>
        <div class="price-range">
          <input type="number" id="filterMinPrice" placeholder="${t('price_from')}" min="0">
          <input type="number" id="filterMaxPrice" placeholder="${t('price_to')}" min="0">
        </div>
      </div>
      <div class="filter-group">
        <label class="filter-label">${t('sort')}</label>
        <select id="filterSort">
          <option value="newest">${t('sort_newest')}</option>
          <option value="oldest">${t('sort_oldest')}</option>
          <option value="price_asc">${t('sort_cheap')}</option>
          <option value="price_desc">${t('sort_expensive')}</option>
        </select>
      </div>
      <button class="filter-btn" onclick="applyFilters()">${t('apply_filter')}</button>
    </aside>
  `;
}

async function loadAds(category = '', page = 1, search = '') {
  try {
    const city = document.getElementById('filterCity')?.value || '';
    const minPrice = document.getElementById('filterMinPrice')?.value || '';
    const maxPrice = document.getElementById('filterMaxPrice')?.value || '';
    const sort = document.getElementById('filterSort')?.value || 'newest';

    let url = `/api/ads?page=${page}&limit=16`;
    if (category) url += `&category=${category}`;
    if (city) url += `&city=${city}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (minPrice) url += `&min_price=${minPrice}`;
    if (maxPrice) url += `&max_price=${maxPrice}`;
    if (sort) url += `&sort=${sort}`;

    const data = await API.get(url);
    const container = document.getElementById('adsContainer');

    if (data.ads.length === 0) {
      container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">📭</div><p>${t('no_results')}</p></div>`;
    } else {
      container.innerHTML = data.ads.map(ad => renderAdCard(ad)).join('');
    }

    renderPagination(data.page, data.totalPages, category, search);
  } catch (e) {
    console.error(e);
  }
}

function applyFilters() {
  const cat = document.getElementById('filterCategory')?.value || '';
  const search = document.getElementById('headerSearch')?.value || '';
  loadAds(cat, 1, search);
}

function renderPagination(current, total, category, search) {
  if (total <= 1) return;
  const container = document.getElementById('pagination');
  let html = '<div class="pagination">';
  for (let i = 1; i <= total; i++) {
    html += `<button class="${i === current ? 'active' : ''}" onclick="loadAds('${category}', ${i}, '${search}')">${i}</button>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

// ==================== AD DETAIL ====================
async function renderAdDetail(id) {
  const app = document.getElementById('app');
  app.innerHTML = renderHeader() + `
    <main class="container">
      <div class="loading"><div class="spinner"></div>${t('loading')}</div>
    </main>
  ` + renderFooter();

  try {
    const ad = await API.get(`/api/ads/${id}`);
    const lang = getLang();
    const title = lang === 'az' ? ad.title_az : (ad.title_ru || ad.title_az);
    const desc = lang === 'az' ? ad.description_az : (ad.description_ru || ad.description_az);
    const catName = lang === 'az' ? ad.cat_name_az : (ad.cat_name_ru || ad.cat_name_az);
    const cityName = lang === 'az' ? ad.city_name_az : (ad.city_name_ru || ad.city_name_az);
    const date = formatDate(ad.created_at);
    const images = ad.images || [];
    const userJoined = ad.user_joined ? formatDate(ad.user_joined) : '';

    app.innerHTML = renderHeader() + `
      <main class="container">
        <div class="ad-detail">
          <div>
            <div class="ad-gallery">
              <div class="ad-gallery-main" id="mainImage">
                ${images.length > 0
                  ? `<img src="${images[0]}" alt="${escapeHtml(title)}">`
                  : `<div class="no-img" style="font-size:80px">📷</div>`}
              </div>
              ${images.length > 1 ? `
                <div class="ad-gallery-thumbs">
                  ${images.map((img, i) => `
                    <img src="${img}" class="${i === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)" alt="">
                  `).join('')}
                </div>
              ` : ''}
            </div>
            <div class="ad-info">
              <h1>${escapeHtml(title)}</h1>
              <div class="ad-price-big">${ad.price > 0 ? formatPrice(ad.price) + ' ' + ad.currency : 'Razılaşma ilə'}</div>
              <div class="ad-meta-list">
                <div class="ad-meta-item"><span>📁</span> ${catName}</div>
                <div class="ad-meta-item"><span>📍</span> ${cityName || ''}</div>
                <div class="ad-meta-item"><span>👁️</span> ${ad.views} ${t('views')}</div>
                <div class="ad-meta-item"><span>📅</span> ${t('posted')}: ${date}</div>
              </div>
              <h3 style="margin-bottom:8px">${t('description')}</h3>
              <div class="ad-description">${escapeHtml(desc)}</div>
            </div>
          </div>
          <div>
            <div class="seller-card">
              <div class="seller-info">
                <div class="seller-avatar">${(ad.user_name || 'U').charAt(0).toUpperCase()}</div>
                <div>
                  <div class="seller-name">${escapeHtml(ad.user_name || '')}</div>
                  <div class="seller-date">${t('member_since')} ${userJoined}</div>
                </div>
              </div>
              <button class="btn phone-btn" onclick="showPhone(this, '${ad.phone || ad.user_phone || ''}')">
                📞 ${t('show_phone')}
              </button>
            </div>
          </div>
        </div>
      </main>
    ` + renderFooter();
  } catch (e) {
    app.innerHTML = renderHeader() + `
      <main class="container">
        <div class="empty-state"><div class="icon">❌</div><p>${t('error_occurred')}</p></div>
      </main>
    ` + renderFooter();
  }
}

function changeMainImage(src, thumb) {
  document.querySelector('.ad-gallery-main').innerHTML = `<img src="${src}" alt="">`;
  document.querySelectorAll('.ad-gallery-thumbs img').forEach(i => i.classList.remove('active'));
  thumb.classList.add('active');
}

function showPhone(btn, phone) {
  btn.innerHTML = `📞 ${phone || 'N/A'}`;
  btn.onclick = null;
}

// ==================== LOGIN ====================
function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = renderHeader() + `
    <main class="container auth-page">
      <div class="form-card">
        <h2>${t('login_title')}</h2>
        <div class="form-error" id="loginError"></div>
        <form onsubmit="doLogin(event)">
          <div class="form-group">
            <label>${t('email')}</label>
            <input type="email" id="loginEmail" required placeholder="email@example.com">
          </div>
          <div class="form-group">
            <label>${t('password')}</label>
            <input type="password" id="loginPassword" required placeholder="••••••••">
          </div>
          <button type="submit" class="form-submit">${t('login_btn')}</button>
        </form>
        <div class="form-link">
          ${t('no_account')} <a href="#/register">${t('register')}</a>
        </div>
      </div>
    </main>
  ` + renderFooter();
}

async function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    currentUser = await API.post('/api/auth/login', { email, password });
    showToast(t('login_title') + ' ✓', 'success');
    navigate('#/');
  } catch (err) {
    const el = document.getElementById('loginError');
    el.textContent = err.message;
    el.classList.add('show');
  }
}

// ==================== REGISTER ====================
function renderRegister() {
  const app = document.getElementById('app');
  app.innerHTML = renderHeader() + `
    <main class="container auth-page">
      <div class="form-card">
        <h2>${t('register_title')}</h2>
        <div class="form-error" id="regError"></div>
        <form onsubmit="doRegister(event)">
          <div class="form-group">
            <label>${t('name')}</label>
            <input type="text" id="regName" required placeholder="Ad Soyad">
          </div>
          <div class="form-group">
            <label>${t('email')}</label>
            <input type="email" id="regEmail" required placeholder="email@example.com">
          </div>
          <div class="form-group">
            <label>${t('phone')}</label>
            <input type="tel" id="regPhone" placeholder="+994501234567">
          </div>
          <div class="form-group">
            <label>${t('password')}</label>
            <input type="password" id="regPassword" required placeholder="Minimum 6 simvol" minlength="6">
          </div>
          <button type="submit" class="form-submit">${t('register_btn')}</button>
        </form>
        <div class="form-link">
          ${t('has_account')} <a href="#/login">${t('login')}</a>
        </div>
      </div>
    </main>
  ` + renderFooter();
}

async function doRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const phone = document.getElementById('regPhone').value;
  const password = document.getElementById('regPassword').value;

  try {
    currentUser = await API.post('/api/auth/register', { name, email, phone, password });
    showToast(t('register_title') + ' ✓', 'success');
    navigate('#/');
  } catch (err) {
    const el = document.getElementById('regError');
    el.textContent = err.message;
    el.classList.add('show');
  }
}

// ==================== LOGOUT ====================
async function doLogout() {
  await API.post('/api/auth/logout', {});
  currentUser = null;
  navigate('#/');
}

// ==================== POST AD ====================
let selectedFiles = [];

function renderPostAd(editId) {
  if (!currentUser) {
    navigate('#/login');
    return;
  }

  selectedFiles = [];
  const isEdit = !!editId;
  const lang = getLang();

  const app = document.getElementById('app');
  app.innerHTML = renderHeader() + `
    <main class="container post-ad-page">
      <div class="form-card">
        <h2>${isEdit ? t('edit_ad_title') : t('post_ad_title')}</h2>
        <div class="form-error" id="adError"></div>
        <form id="adForm" onsubmit="${isEdit ? `doUpdateAd(event, ${editId})` : 'doPostAd(event)'}">
          <div class="form-group">
            <label>${t('ad_title')} *</label>
            <input type="text" id="adTitleAz" required placeholder="Elanın başlığı">
          </div>
          <div class="form-group">
            <label>${t('ad_title_ru')}</label>
            <input type="text" id="adTitleRu" placeholder="Заголовок объявления">
          </div>
          <div class="form-group">
            <label>${t('category')} *</label>
            <select id="adCategory" required>
              <option value="">${t('all_categories')}</option>
              ${categories.map(c => `
                <option value="${c.id}">${lang === 'az' ? c.name_az : c.name_ru}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${t('city')} *</label>
            <select id="adCity" required>
              <option value="">${t('all_cities')}</option>
              ${cities.map(c => `
                <option value="${c.id}">${lang === 'az' ? c.name_az : c.name_ru}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${t('price')}</label>
            <input type="number" id="adPrice" placeholder="0" min="0" step="0.01">
          </div>
          <div class="form-group">
            <label>${t('phone')}</label>
            <input type="tel" id="adPhone" placeholder="+994501234567" value="${currentUser.phone || ''}">
          </div>
          <div class="form-group">
            <label>${t('ad_description')} *</label>
            <textarea id="adDescAz" required placeholder="Elanın təsviri"></textarea>
          </div>
          <div class="form-group">
            <label>${t('ad_description_ru')}</label>
            <textarea id="adDescRu" placeholder="Описание объявления"></textarea>
          </div>
          <div class="form-group">
            <label>${t('upload_images')}</label>
            <div class="image-upload" onclick="document.getElementById('imageInput').click()">
              <div class="upload-icon">📸</div>
              <p>${t('drag_or_click')}</p>
            </div>
            <input type="file" id="imageInput" multiple accept="image/*" style="display:none" onchange="handleImageSelect(event)">
            <div class="image-preview" id="imagePreview"></div>
          </div>
          <button type="submit" class="form-submit">${isEdit ? t('update_ad') : t('submit_ad')}</button>
        </form>
      </div>
    </main>
  ` + renderFooter();

  if (isEdit) loadAdForEdit(editId);
}

async function loadAdForEdit(id) {
  try {
    const ad = await API.get(`/api/ads/${id}`);
    if (ad.user_id !== currentUser.id) {
      navigate('#/');
      return;
    }
    document.getElementById('adTitleAz').value = ad.title_az;
    document.getElementById('adTitleRu').value = ad.title_ru || '';
    document.getElementById('adCategory').value = ad.category_id;
    document.getElementById('adCity').value = ad.city_id;
    document.getElementById('adPrice').value = ad.price || '';
    document.getElementById('adPhone').value = ad.phone || '';
    document.getElementById('adDescAz').value = ad.description_az;
    document.getElementById('adDescRu').value = ad.description_ru || '';

    if (ad.images && ad.images.length > 0) {
      const preview = document.getElementById('imagePreview');
      preview.innerHTML = ad.images.map((img, i) => `
        <div class="preview-item" data-src="${img}">
          <img src="${img}" alt="">
          <div class="remove-img" onclick="removeExistingImage(this, '${img}')">✕</div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
}

function handleImageSelect(e) {
  const files = Array.from(e.target.files);
  selectedFiles = selectedFiles.concat(files).slice(0, 8);
  updateImagePreview();
}

function updateImagePreview() {
  const preview = document.getElementById('imagePreview');
  const existingPreviews = preview.querySelectorAll('.preview-item[data-src]');
  let html = '';
  existingPreviews.forEach(el => { html += el.outerHTML; });

  selectedFiles.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    html += `
      <div class="preview-item">
        <img src="${url}" alt="">
        <div class="remove-img" onclick="removeNewImage(${i})">✕</div>
      </div>
    `;
  });
  preview.innerHTML = html;
}

function removeNewImage(index) {
  selectedFiles.splice(index, 1);
  updateImagePreview();
}

function removeExistingImage(btn, src) {
  btn.closest('.preview-item').remove();
}

async function doPostAd(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append('title_az', document.getElementById('adTitleAz').value);
  formData.append('title_ru', document.getElementById('adTitleRu').value);
  formData.append('category_id', document.getElementById('adCategory').value);
  formData.append('city_id', document.getElementById('adCity').value);
  formData.append('price', document.getElementById('adPrice').value || '0');
  formData.append('phone', document.getElementById('adPhone').value);
  formData.append('description_az', document.getElementById('adDescAz').value);
  formData.append('description_ru', document.getElementById('adDescRu').value);

  selectedFiles.forEach(f => formData.append('images', f));

  try {
    const result = await API.postForm('/api/ads', formData);
    showToast(t('success_post'), 'success');
    navigate('#/ad/' + result.id);
  } catch (err) {
    const el = document.getElementById('adError');
    el.textContent = err.message;
    el.classList.add('show');
  }
}

async function doUpdateAd(e, id) {
  e.preventDefault();
  const formData = new FormData();
  formData.append('title_az', document.getElementById('adTitleAz').value);
  formData.append('title_ru', document.getElementById('adTitleRu').value);
  formData.append('category_id', document.getElementById('adCategory').value);
  formData.append('city_id', document.getElementById('adCity').value);
  formData.append('price', document.getElementById('adPrice').value || '0');
  formData.append('phone', document.getElementById('adPhone').value);
  formData.append('description_az', document.getElementById('adDescAz').value);
  formData.append('description_ru', document.getElementById('adDescRu').value);

  const existingImages = Array.from(document.querySelectorAll('.preview-item[data-src]'))
    .map(el => el.dataset.src);
  formData.append('existing_images', JSON.stringify(existingImages));

  selectedFiles.forEach(f => formData.append('images', f));

  try {
    await API.putForm(`/api/ads/${id}`, formData);
    showToast(t('success_update'), 'success');
    navigate('#/ad/' + id);
  } catch (err) {
    const el = document.getElementById('adError');
    el.textContent = err.message;
    el.classList.add('show');
  }
}

// ==================== MY ADS ====================
async function renderMyAds() {
  if (!currentUser) {
    navigate('#/login');
    return;
  }

  const lang = getLang();
  const app = document.getElementById('app');
  app.innerHTML = renderHeader() + `
    <main class="container">
      <h1 class="page-title">${t('my_ads_title')}</h1>
      <div id="myAdsList">
        <div class="loading"><div class="spinner"></div>${t('loading')}</div>
      </div>
    </main>
  ` + renderFooter();

  try {
    const data = await API.get(`/api/ads?user_id=${currentUser.id}&limit=50`);
    const container = document.getElementById('myAdsList');

    if (data.ads.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>${t('no_ads')}</p></div>`;
      return;
    }

    container.innerHTML = data.ads.map(ad => {
      const title = lang === 'az' ? ad.title_az : (ad.title_ru || ad.title_az);
      const img = ad.images && ad.images.length > 0 ? ad.images[0] : null;
      return `
        <div class="my-ad-item">
          <div class="my-ad-img">
            ${img ? `<img src="${img}" alt="">` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:30px">📷</div>'}
          </div>
          <div class="my-ad-content">
            <div class="my-ad-title">${escapeHtml(title)}</div>
            <div class="my-ad-price">${ad.price > 0 ? formatPrice(ad.price) + ' ' + ad.currency : 'Razılaşma'}</div>
            <div class="my-ad-date">👁️ ${ad.views} ${t('views')} • ${formatDate(ad.created_at)}</div>
            <div class="my-ad-actions">
              <a href="#/ad/${ad.id}" class="btn btn-outline">${t('views')}</a>
              <a href="#/edit-ad/${ad.id}" class="btn btn-outline">${t('edit')}</a>
              <button class="btn btn-danger" onclick="deleteAd(${ad.id})">${t('delete')}</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error(e);
  }
}

async function deleteAd(id) {
  if (!confirm(t('confirm_delete'))) return;
  try {
    await API.delete(`/api/ads/${id}`);
    showToast(t('success_delete'), 'success');
    renderMyAds();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ==================== PROFILE ====================
function renderProfile() {
  if (!currentUser) {
    navigate('#/login');
    return;
  }

  const app = document.getElementById('app');
  app.innerHTML = renderHeader() + `
    <main class="container auth-page">
      <div class="form-card">
        <h2>${t('profile_title')}</h2>
        <div class="form-error" id="profileError"></div>
        <form onsubmit="doUpdateProfile(event)">
          <div class="form-group">
            <label>${t('name')}</label>
            <input type="text" id="profileName" value="${escapeHtml(currentUser.name)}" required>
          </div>
          <div class="form-group">
            <label>${t('email')}</label>
            <input type="email" value="${escapeHtml(currentUser.email)}" disabled>
          </div>
          <div class="form-group">
            <label>${t('phone')}</label>
            <input type="tel" id="profilePhone" value="${escapeHtml(currentUser.phone || '')}">
          </div>
          <button type="submit" class="form-submit">${t('save_profile')}</button>
        </form>
      </div>
    </main>
  ` + renderFooter();
}

async function doUpdateProfile(e) {
  e.preventDefault();
  try {
    currentUser = await API.put('/api/users/profile', {
      name: document.getElementById('profileName').value,
      phone: document.getElementById('profilePhone').value
    });
    showToast(t('success_update'), 'success');
    renderProfile();
  } catch (err) {
    const el = document.getElementById('profileError');
    el.textContent = err.message;
    el.classList.add('show');
  }
}

// ==================== SEARCH ====================
function doSearch() {
  const query = document.getElementById('headerSearch')?.value?.trim();
  if (query) {
    navigate(`#/search?q=${encodeURIComponent(query)}`);
  }
}

// ==================== DROPDOWN ====================
function toggleDropdown() {
  const dd = document.getElementById('userDropdown');
  dd.classList.toggle('active');
}

document.addEventListener('click', (e) => {
  const dd = document.getElementById('userDropdown');
  if (dd && !e.target.closest('.user-menu')) {
    dd.classList.remove('active');
  }
});

// ==================== TOAST ====================
function showToast(msg, type = 'success') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== HELPERS ====================
function formatPrice(price) {
  return parseFloat(price).toLocaleString('az-AZ', { minimumFractionDigits: 0 });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return getLang() === 'az' ? 'İndicə' : 'Только что';
  if (mins < 60) return `${mins} ${getLang() === 'az' ? 'dəq əvvəl' : 'мин назад'}`;
  if (hours < 24) return `${hours} ${getLang() === 'az' ? 'saat əvvəl' : 'ч назад'}`;
  if (days < 7) return `${days} ${getLang() === 'az' ? 'gün əvvəl' : 'дн назад'}`;

  return d.toLocaleDateString(getLang() === 'az' ? 'az-AZ' : 'ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

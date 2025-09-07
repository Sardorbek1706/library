const API_BASE = 'https://library.softly.uz/api/app/books';
let state = {
  page: 1,
  size: 24,
  order: 'DESC',
  query: ''
};

function formatSum(value){
  if (value == null) return '';
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' сум';
}

function findArrayInResponse(json){
  if (Array.isArray(json)) return json;
  for (const k in json){
    if (Array.isArray(json[k])) return json[k];
  }
  for (const k in json){
    if (typeof json[k] === 'object' && json[k] !== null){
      for (const j in json[k]){
        if (Array.isArray(json[k][j])) return json[k][j];
      }
    }
  }
  return null;
}

const gridEl = document.getElementById('grid');
const loaderEl = document.getElementById('loader');
const pageInfoEl = document.getElementById('pageInfo');
const sizeEl = document.getElementById('size');
const orderEl = document.getElementById('order');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const searchInput = document.getElementById('search');

sizeEl.value = state.size;
orderEl.value = state.order;

async function fetchAndRender(){
  loaderEl.style.display = 'flex';
  gridEl.innerHTML = '';
  pageInfoEl.textContent = 'Загрузка...';

  const params = new URLSearchParams({
    size: state.size,
    page: state.page,
    order: state.order
  });
  if (state.query) params.set('q', state.query);

  try {
    const res = await fetch(API_BASE + '?' + params.toString());
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();

    const arr = findArrayInResponse(json);
    if (!arr) {
      gridEl.innerHTML = '<div style="padding:20px;color:#666">Нет данных</div>';
      pageInfoEl.textContent = '0 товаров';
      return;
    }

    renderList(arr);
    pageInfoEl.textContent = `${arr.length} товаров (стр. ${state.page})`;
  } catch (err){
    console.error(err);
    gridEl.innerHTML = '<div style="padding:20px;color:#c44">Ошибка загрузки</div>';
    pageInfoEl.textContent = 'Ошибка';
  } finally {
    loaderEl.style.display = 'none';
  }
}

function renderList(items){
  gridEl.innerHTML = '';
  if (items.length === 0){
    gridEl.innerHTML = '<div style="padding:20px;color:#666">Товары не найдены</div>';
    return;
  }

  for (const it of items){
    const title = it.title || it.name || it.bookTitle || 'Без названия';
    const price = it.price || it.currentPrice || null;
    const oldPrice = it.oldPrice || null;
    const image = it.image || (it.images && it.images[0]) || '';
    const rating = it.rating || 5;
    const reviewsCount = it.reviews_count || 0;

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="thumb">
        ${image ? `<img src="${image}" alt="${escapeHtml(title)}">` : `<div style="padding:12px;color:#9aa6b2">Нет изображения</div>`}
      </div>
      <h3 class="title">${escapeHtml(truncate(title, 70))}</h3>
      <div class="rating">
        <div class="stars">${renderStars(rating)}</div>
        <div class="reviews">${reviewsCount} отзывов</div>
      </div>
      <div class="price-old">${oldPrice ? formatSum(oldPrice) : ''}</div>
      <div class="price">${price ? formatSum(price) : '—'}</div>
      <div class="actions">
        <button class="btn buy-btn">Купить</button>
        <button class="icon-btn fav-btn">♡</button>
      </div>
    `;

    card.querySelector('.buy-btn').addEventListener('click', () => {
      alert(`Добавлено в корзину: ${title}`);
    });
    card.querySelector('.fav-btn').addEventListener('click', (e) => {
      e.target.textContent = e.target.textContent === '♡' ? '♥' : '♡';
    });

    gridEl.appendChild(card);
  }
}

function renderStars(value){
  const v = Math.round(Number(value) || 0);
  return '★'.repeat(v) + '☆'.repeat(5-v);
}
function truncate(str, n){ return str.length>n ? str.slice(0,n-1)+'…' : str; }
function escapeHtml(text){
  return String(text).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}

sizeEl.addEventListener('change', e=>{
  state.size = Number(e.target.value); state.page=1; fetchAndRender();
});
orderEl.addEventListener('change', e=>{
  state.order = e.target.value; state.page=1; fetchAndRender();
});
prevBtn.addEventListener('click', ()=>{
  if (state.page>1){ state.page--; fetchAndRender(); }
});
nextBtn.addEventListener('click', ()=>{
  state.page++; fetchAndRender();
});

let searchTimer=null;
searchInput.addEventListener('input', e=>{
  state.query=e.target.value.trim();
  clearTimeout(searchTimer);
  searchTimer=setTimeout(()=>{ state.page=1; fetchAndRender(); },400);
});

fetchAndRender();

// ─── Constants ────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CAT_COLORS = {
  salary:        '#7b61ff',
  freelance:     '#00e5a0',
  food:          '#ff9f43',
  transport:     '#54a0ff',
  housing:       '#ff6b9d',
  entertainment: '#fd79a8',
  health:        '#55efc4',
  shopping:      '#fdcb6e',
  other:         '#a29bfe'
};

const CAT_EMOJI = {
  salary:        '💼',
  freelance:     '🎨',
  food:          '🍔',
  transport:     '🚗',
  housing:       '🏠',
  entertainment: '🎬',
  health:        '💊',
  shopping:      '🛍',
  other:         '📦'
};

const INCOME_CATEGORIES = `
  <option value="salary">💼 Salary</option>
  <option value="freelance">🎨 Freelance</option>
  <option value="other">📦 Other</option>
`;

const EXPENSE_CATEGORIES = `
  <option value="food">🍔 Food</option>
  <option value="transport">🚗 Transport</option>
  <option value="housing">🏠 Housing</option>
  <option value="entertainment">🎬 Entertainment</option>
  <option value="health">💊 Health</option>
  <option value="shopping">🛍 Shopping</option>
  <option value="other">📦 Other</option>
`;

// ─── State ────────────────────────────────────────────
let transactions = JSON.parse(localStorage.getItem('budget_txs') || '[]');
let currentType   = 'income';
let currentFilter = 'all';

// ─── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  document.getElementById('date-input').value = now.toISOString().split('T')[0];
  document.getElementById('month-label').textContent = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  render();
});

// ─── Type Toggle ──────────────────────────────────────
function setType(type) {
  currentType = type;

  document.getElementById('btn-income').className =
    'type-btn' + (type === 'income' ? ' active-income' : '');
  document.getElementById('btn-expense').className =
    'type-btn' + (type === 'expense' ? ' active-expense' : '');

  document.getElementById('cat-input').innerHTML =
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

// ─── Filter ───────────────────────────────────────────
function setFilter(filter, el) {
  currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
  el.classList.add('active');
  renderList();
}

// ─── Add Transaction ──────────────────────────────────
function addTransaction() {
  const desc   = document.getElementById('desc-input').value.trim();
  const amount = parseFloat(document.getElementById('amount-input').value);
  const cat    = document.getElementById('cat-input').value;
  const date   = document.getElementById('date-input').value;

  if (!desc)                { shake('desc-input');   return; }
  if (!amount || amount <= 0) { shake('amount-input'); return; }

  const tx = { id: Date.now(), type: currentType, desc, amount, cat, date };
  transactions.unshift(tx);
  save();
  render();

  // Clear inputs
  document.getElementById('desc-input').value   = '';
  document.getElementById('amount-input').value = '';
}

// ─── Delete Transaction ───────────────────────────────
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  save();
  render();
}

// ─── Persist ──────────────────────────────────────────
function save() {
  localStorage.setItem('budget_txs', JSON.stringify(transactions));
}

// ─── Render All ───────────────────────────────────────
function render() {
  renderStats();
  renderList();
  renderChart();

  const count = transactions.length;
  document.getElementById('tx-count').textContent =
    `${count} transaction${count !== 1 ? 's' : ''}`;
}

// ─── Format Currency ──────────────────────────────────
function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ─── Format Date ──────────────────────────────────────
function formatDate(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(day)}`;
}

// ─── Escape HTML ──────────────────────────────────────
function escHtml(s) {
  return s
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

// ─── Shake Animation (validation) ────────────────────
function shake(id) {
  const el = document.getElementById(id);
  el.style.borderColor = 'var(--expense)';
  setTimeout(() => { el.style.borderColor = ''; }, 800);
}

// ─── Render Stats ─────────────────────────────────────
function renderStats() {
  const income  = transactions.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const balEl = document.getElementById('balance-display');
  balEl.textContent  = (balance < 0 ? '-' : '') + fmt(balance);
  balEl.style.color  = balance < 0
    ? 'var(--expense)'
    : balance > 0
      ? 'var(--income)'
      : 'var(--text)';

  document.getElementById('total-income').textContent  = fmt(income);
  document.getElementById('total-expense').textContent = fmt(expense);
}

// ─── Render Transaction List ──────────────────────────
function renderList() {
  const list = document.getElementById('tx-list');

  const filtered = currentFilter === 'all'
    ? transactions
    : transactions.filter(t => t.type === currentFilter);

  if (filtered.length === 0) {
    const label = currentFilter === 'all' ? '' : currentFilter + ' ';
    list.innerHTML = `
      <p class="text-sm mono text-center py-6" style="color:var(--muted)">
        No ${label}transactions yet.
      </p>`;
    return;
  }

  list.innerHTML = filtered.map(tx => `
    <div class="tx-item">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
             style="background:${CAT_COLORS[tx.cat]}18; border:1px solid ${CAT_COLORS[tx.cat]}33">
          ${CAT_EMOJI[tx.cat] || '📦'}
        </div>
        <div class="min-w-0">
          <div class="font-semibold text-sm truncate">${escHtml(tx.desc)}</div>
          <div class="text-xs mono mt-0.5 flex items-center gap-2" style="color:var(--muted)">
            <span style="color:${CAT_COLORS[tx.cat]}">${tx.cat}</span>
            <span>·</span>
            <span>${formatDate(tx.date)}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3 flex-shrink-0">
        <span class="mono font-semibold text-base"
              style="color:${tx.type === 'income' ? 'var(--income)' : 'var(--expense)'}">
          ${tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}
        </span>
        <button class="delete-btn" onclick="deleteTransaction(${tx.id})">✕</button>
      </div>
    </div>
  `).join('');
}

// ─── Render Category Chart ────────────────────────────
function renderChart() {
  const container = document.getElementById('chart-container');
  const expenses  = transactions.filter(t => t.type === 'expense');

  if (expenses.length === 0) {
    container.innerHTML = `<p class="text-sm mono" style="color:var(--muted)">No expense data yet...</p>`;
    return;
  }

  // Aggregate totals per category
  const totals = {};
  expenses.forEach(t => {
    totals[t.cat] = (totals[t.cat] || 0) + t.amount;
  });

  const maxVal = Math.max(...Object.values(totals));
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  container.innerHTML = sorted.map(([cat, val]) => `
    <div>
      <div class="flex justify-between items-center mb-1">
        <span class="text-xs font-semibold flex items-center gap-1">
          <span>${CAT_EMOJI[cat] || '📦'}</span>
          <span style="color:var(--text)">${cat}</span>
        </span>
        <span class="text-xs mono" style="color:var(--muted)">${fmt(val)}</span>
      </div>
      <div class="w-full rounded-full h-2" style="background:var(--border)">
        <div class="bar-fill"
             style="width:${(val / maxVal * 100).toFixed(1)}%;
                    background:${CAT_COLORS[cat]};
                    box-shadow:0 0 8px ${CAT_COLORS[cat]}66">
        </div>
      </div>
    </div>
  `).join('');
}
const API_BASE = '/api';
const TOKEN_KEY = 'expense_tracker_token';

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchExpenses({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const url = `${API_BASE}/expenses${params.toString() ? '?' + params : ''}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function fetchTotals(date) {
  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_BASE}/expenses/totals${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function createExpense(body) {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchExpenses } from '../api/expenses';

const RANGES = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

function getRangeBounds(range) {
  const now = new Date();
  let from, to;
  if (range === 'day') {
    from = to = new Date(now);
  } else if (range === 'week') {
    const day = now.getDay();
    from = new Date(now);
    from.setDate(now.getDate() - day);
    from.setHours(0, 0, 0, 0);
    to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function ExpenseList() {
  const location = useLocation();
  const [range, setRange] = useState('week');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshKey = location.state?.refresh;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const { from, to } = getRangeBounds(range);
    fetchExpenses({ from, to })
      .then((data) => {
        if (!cancelled) setExpenses(data.expenses || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load expenses');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, [range, refreshKey]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <section className="expense-list" aria-label="Expense list">
      <div className="list-header">
        <h1>Expenses</h1>
        <Link to="/" className="btn btn-secondary">Back to dashboard</Link>
      </div>
      <div className="range-tabs" role="tablist" aria-label="Date range">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            role="tab"
            aria-selected={range === r.value}
            className={range === r.value ? 'tab active' : 'tab'}
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>
      {loading && (
        <div className="loading" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading…</span>
        </div>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && (
        <>
          <div className="list-total-bar" aria-live="polite">
            <span className="list-total-label">Total</span>
            <span className="list-total-value">₹{total.toLocaleString()}</span>
          </div>
          <ul className="expenses">
            {expenses.length === 0 ? (
              <li className="empty-state">
                <p className="empty-state-message">No expenses in this range.</p>
                <Link to="/add" className="btn btn-primary empty-state-cta">
                  Add your first expense
                </Link>
              </li>
            ) : (
              expenses.map((e) => (
                <li key={e.id ?? `${e.date}-${e.time}-${e.amount}`} className="expense-item">
                  <span className="exp-date">{e.date}</span>
                  <span className="exp-time">{e.time || '—'}</span>
                  <span className="exp-amount">₹{Number(e.amount).toLocaleString()}</span>
                  <span className="exp-category">{e.category}</span>
                  <span className="exp-mode">{e.paymentMode}</span>
                  {e.notes && <span className="exp-notes">{e.notes}</span>}
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </section>
  );
}

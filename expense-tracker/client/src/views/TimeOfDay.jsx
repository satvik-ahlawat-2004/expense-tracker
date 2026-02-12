import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchExpenses } from '../api/expenses';

function getHour(timeStr) {
  if (!timeStr) return null;
  const [h] = timeStr.split(':');
  return parseInt(h, 10);
}

export function TimeOfDay() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const [y, m] = month.split('-').map(Number);
    const from = `${month}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const to = `${month}-${String(lastDay).padStart(2, '0')}`;
    fetchExpenses({ from, to })
      .then((data) => {
        if (!cancelled) setExpenses(data.expenses || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, [month]);

  const byHour = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, '0')}:00`,
    expenses: expenses.filter((e) => getHour(e.time) === h),
    total: 0,
  }));
  byHour.forEach((row) => {
    row.total = row.expenses.reduce((s, e) => s + e.amount, 0);
  });

  return (
    <section className="time-of-day" aria-label="Spending by time of day">
      <div className="list-header">
        <h1>Spending by time of day</h1>
        <Link to="/" className="btn btn-secondary">Back to dashboard</Link>
      </div>
      <div className="time-of-day-picker form-group">
        <label htmlFor="time-of-day-month">Month</label>
        <input
          id="time-of-day-month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Select month"
        />
      </div>
      {loading && (
        <div className="loading" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading…</span>
        </div>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && (
        <div className="hour-table-wrap">
          <table className="hour-table" role="table">
            <thead>
              <tr>
                <th scope="col">Hour</th>
                <th scope="col">Count</th>
                <th scope="col">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {byHour.map((row) => (
                <tr
                  key={row.hour}
                  className={row.expenses.length > 0 ? 'hour-row-has-data' : ''}
                >
                  <td>{row.label}</td>
                  <td>{row.expenses.length}</td>
                  <td>{row.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchTotals } from '../api/expenses';

export function Dashboard() {
  const location = useLocation();
  const [totals, setTotals] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshKey = location.state?.refresh;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTotals()
      .then((data) => {
        if (!cancelled) setTotals(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load totals');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="loading" aria-live="polite">
        <span className="loading-spinner" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    );
  }
  if (error) {
    const isStorage = error.includes('Storage') || error.includes('unavailable');
    return (
      <div className="error" role="alert">
        <p>{error}</p>
        {isStorage && (
          <p className="error-hint">
            Add your Google Sheet ID in <code>expense-tracker/server/.env</code> as <code>SHEET_ID=...</code> (from the Sheet URL: …/d/<strong>SHEET_ID</strong>/edit). Ensure the Sheet is shared with your service account email (Editor).
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="dashboard" aria-label="Spending totals">
      <div className="totals">
        <div className="total-card">
          <span className="total-label">Today</span>
          <span className="total-value">₹{totals.daily.toLocaleString()}</span>
        </div>
        <div className="total-card">
          <span className="total-label">This week</span>
          <span className="total-value">₹{totals.weekly.toLocaleString()}</span>
        </div>
        <div className="total-card">
          <span className="total-label">This month</span>
          <span className="total-value">₹{totals.monthly.toLocaleString()}</span>
        </div>
      </div>
      <nav className="dashboard-nav">
        <Link to="/add" className="btn btn-primary">Add expense</Link>
        <Link to="/expenses" className="btn btn-secondary">View expenses</Link>
        <Link to="/time-of-day" className="btn btn-secondary">Time of day</Link>
      </nav>
    </section>
  );
}

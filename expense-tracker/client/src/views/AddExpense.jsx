import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExpense } from '../api/expenses';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Net Banking', 'Other'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

export function AddExpense() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    date: today(),
    time: nowTime(),
    amount: '',
    category: CATEGORIES[0],
    paymentMode: PAYMENT_MODES[0],
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const amount = parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await createExpense({
        date: form.date,
        time: form.time,
        amount,
        category: form.category,
        paymentMode: form.paymentMode,
        notes: form.notes.trim(),
      });
      const refresh = Date.now();
      navigate('/', { replace: true, state: { refresh } });
    } catch (err) {
      setError(err.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="add-expense" aria-label="Add expense">
      <h1>Add expense</h1>
      <form onSubmit={handleSubmit} noValidate>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="form-group form-group-amount">
          <label htmlFor="add-expense-amount">
            Amount (₹)
          </label>
          <input
            id="add-expense-amount"
            type="number"
            name="amount"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0"
            required
            aria-required="true"
            autoFocus
          />
        </div>
        <div className="form-row">
          <label htmlFor="add-expense-date" className="form-field">
            Date
            <input
              id="add-expense-date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              aria-required="true"
            />
          </label>
          <label className="form-field">
            Time
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              aria-description="Used for time-of-day analysis"
            />
          </label>
        </div>
        <div className="form-row">
          <label className="form-field">
            Category
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              aria-required="true"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Payment mode
            <select
              name="paymentMode"
              value={form.paymentMode}
              onChange={handleChange}
              required
              aria-required="true"
            >
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-group">
          <label htmlFor="add-expense-notes">
            Notes
          </label>
          <input
            id="add-expense-notes"
            type="text"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Optional"
            aria-label="Notes (optional)"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add expense'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

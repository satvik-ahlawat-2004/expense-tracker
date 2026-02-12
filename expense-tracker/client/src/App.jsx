import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Dashboard } from './views/Dashboard';
import { AddExpense } from './views/AddExpense';
import { ExpenseList } from './views/ExpenseList';
import { TimeOfDay } from './views/TimeOfDay';
import { Login } from './views/Login';
import { Signup } from './views/Signup';
import './App.css';

function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const isHome = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <header className="app-header" role="banner">
      {!isHome && !isAuthPage && (
        <Link to="/" className="app-header-back" aria-label="Back to dashboard">
          ← Back
        </Link>
      )}
      <h1 className="app-header-title">
        <Link to="/">Expense Tracker</Link>
      </h1>
      {token && user && (
        <div className="app-header-user">
          <span className="app-header-email" title={user.email}>
            {user.email}
          </span>
          <button
            type="button"
            className="btn btn-secondary app-header-logout"
            onClick={() => { logout(); navigate('/login'); }}
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <AppHeader />
        <main className="app" role="main">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add"
              element={
                <ProtectedRoute>
                  <AddExpense />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpenseList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-of-day"
              element={
                <ProtectedRoute>
                  <TimeOfDay />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

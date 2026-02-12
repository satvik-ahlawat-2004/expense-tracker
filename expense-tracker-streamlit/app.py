"""Expense Tracker - Streamlit app with Google Sheets backend.
Matches the React app: auth gate → dashboard with nav → pages + visualizations.
"""
import streamlit as st
from datetime import datetime, timedelta
import bcrypt
import plotly.express as px

from sheets_helper import (
    CATEGORIES,
    PAYMENT_MODES,
    find_user_by_email,
    create_user,
    generate_user_id,
    get_expenses,
    get_totals,
    add_expense,
)

# ── Session helpers ──────────────────────────────────────────────────────────

def init_session():
    defaults = {"user_id": None, "user_email": None, "page": "dashboard"}
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


def login_user(user_id: str, email: str):
    st.session_state.user_id = user_id
    st.session_state.user_email = email
    st.session_state.page = "dashboard"


def logout_user():
    st.session_state.user_id = None
    st.session_state.user_email = None
    st.session_state.page = "dashboard"


def go(page: str):
    st.session_state.page = page


def is_logged_in():
    return bool(st.session_state.get("user_id"))


# ── Custom CSS to match React app ───────────────────────────────────────────

def inject_css():
    st.markdown("""
    <style>
    /* Header bar */
    .app-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 1.5rem;
    }
    .app-header h2 { margin: 0; font-size: 1.25rem; color: #1f2937; }
    .app-header .email { color: #6b7280; font-size: 0.875rem; }

    /* Totals cards */
    .totals-row { display: flex; gap: 1rem; margin-bottom: 2rem; }
    .total-card {
        flex: 1; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 12px;
        padding: 1.25rem; text-align: left;
    }
    .total-label { font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem; }
    .total-value { font-size: 1.5rem; font-weight: 700; color: #1f2937; }

    /* Nav buttons on dashboard */
    .nav-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .nav-btn {
        display: inline-block; padding: 0.75rem 1.5rem; border-radius: 8px;
        font-weight: 600; font-size: 0.95rem; text-align: center; cursor: pointer;
        border: none; min-width: 140px;
    }
    .nav-btn-primary { background: #1f2937; color: #fff; }
    .nav-btn-secondary { background: #fff; color: #1f2937; border: 1px solid #d1d5db; }

    /* Auth page */
    .auth-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }

    /* Error banner */
    .error-banner {
        background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
        padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem;
    }

    /* Expense list item */
    .expense-item {
        display: flex; justify-content: space-between; align-items: center;
        padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6;
    }
    .expense-item .left { display: flex; gap: 1rem; align-items: center; }
    .expense-item .amount { font-weight: 600; color: #1f2937; }
    </style>
    """, unsafe_allow_html=True)


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    st.set_page_config(page_title="Expense Tracker", page_icon="💰", layout="centered")
    inject_css()
    init_session()

    if not is_logged_in():
        render_auth()
        return

    # Header
    col_title, col_user = st.columns([3, 2])
    with col_title:
        st.markdown("### Expense Tracker")
    with col_user:
        c1, c2 = st.columns([2, 1])
        with c1:
            st.caption(st.session_state.user_email)
        with c2:
            if st.button("Logout", type="secondary", use_container_width=True):
                logout_user()
                st.rerun()

    st.divider()

    # Page routing
    page = st.session_state.page
    try:
        if page == "add":
            render_add_expense()
        elif page == "expenses":
            render_view_expenses()
        else:
            render_dashboard()
    except Exception as e:
        st.error(str(e))


# ── Auth ─────────────────────────────────────────────────────────────────────

def render_auth():
    st.markdown("### Expense Tracker")
    st.divider()

    auth_mode = st.radio("", ["Log in", "Sign up"], horizontal=True, label_visibility="collapsed")

    if auth_mode == "Log in":
        st.markdown("## Log in")
        with st.form("login_form"):
            email = st.text_input("Email", placeholder="you@example.com")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Log in", use_container_width=True, type="primary")
        if submitted:
            if not email or not password:
                st.error("Enter email and password")
            else:
                user = find_user_by_email(email)
                if not user:
                    st.error("No account with that email")
                elif not bcrypt.checkpw(password.encode(), user["passwordHash"].encode()):
                    st.error("Wrong password")
                else:
                    login_user(user["userId"], user["email"])
                    st.rerun()
    else:
        st.markdown("## Sign up")
        with st.form("signup_form"):
            email = st.text_input("Email", placeholder="you@example.com")
            password = st.text_input("Password (min 6 characters)", type="password")
            submitted = st.form_submit_button("Sign up", use_container_width=True, type="primary")
        if submitted:
            if not email or not password:
                st.error("Enter email and password")
            elif len(password) < 6:
                st.error("Password must be at least 6 characters")
            elif find_user_by_email(email):
                st.error("An account with that email already exists")
            else:
                user_id = generate_user_id()
                pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
                create_user(user_id, email.strip().lower(), pw_hash)
                login_user(user_id, email.strip().lower())
                st.rerun()

        st.caption("Already have an account? Switch to **Log in** above.")


# ── Dashboard ────────────────────────────────────────────────────────────────

def render_dashboard():
    totals = get_totals(st.session_state.user_id)

    # Totals cards
    st.markdown(f"""
    <div class="totals-row">
        <div class="total-card">
            <div class="total-label">Today</div>
            <div class="total-value">₹{totals['daily']:,.0f}</div>
        </div>
        <div class="total-card">
            <div class="total-label">This week</div>
            <div class="total-value">₹{totals['weekly']:,.0f}</div>
        </div>
        <div class="total-card">
            <div class="total-label">This month</div>
            <div class="total-value">₹{totals['monthly']:,.0f}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Navigation buttons
    c1, c2 = st.columns(2)
    with c1:
        if st.button("Add expense", type="primary", use_container_width=True):
            go("add")
            st.rerun()
    with c2:
        if st.button("View expenses", use_container_width=True):
            go("expenses")
            st.rerun()

    # ── Charts ──
    now = datetime.now()
    from_d = now.replace(day=1).strftime("%Y-%m-%d")
    last = (now.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    to_d = last.strftime("%Y-%m-%d")
    month_expenses = get_expenses(st.session_state.user_id, from_d, to_d)

    if month_expenses:
        st.markdown("---")

        # Category pie chart
        cat_totals = {}
        for e in month_expenses:
            cat_totals[e["category"]] = cat_totals.get(e["category"], 0) + e["amount"]

        col_pie, col_bar = st.columns(2)
        with col_pie:
            fig_cat = px.pie(
                values=list(cat_totals.values()),
                names=list(cat_totals.keys()),
                title="Spending by Category",
                color_discrete_sequence=px.colors.qualitative.Set2,
                hole=0.4,
            )
            fig_cat.update_layout(margin=dict(t=40, b=0, l=0, r=0), height=300)
            st.plotly_chart(fig_cat, use_container_width=True)

        # Daily spending bar chart
        with col_bar:
            daily_totals = {}
            for e in month_expenses:
                daily_totals[e["date"]] = daily_totals.get(e["date"], 0) + e["amount"]
            dates = sorted(daily_totals.keys())
            amounts = [daily_totals[d] for d in dates]
            # Show only day number for cleaner labels
            labels = [d.split("-")[-1] for d in dates]

            fig_daily = px.bar(
                x=labels,
                y=amounts,
                title="Daily Spending (This Month)",
                labels={"x": "Day", "y": "₹"},
                color_discrete_sequence=["#2563eb"],
            )
            fig_daily.update_layout(margin=dict(t=40, b=0, l=0, r=0), height=300)
            st.plotly_chart(fig_daily, use_container_width=True)

        # Payment mode pie chart
        mode_totals = {}
        for e in month_expenses:
            mode_totals[e["paymentMode"]] = mode_totals.get(e["paymentMode"], 0) + e["amount"]

        if len(mode_totals) > 1:
            fig_mode = px.pie(
                values=list(mode_totals.values()),
                names=list(mode_totals.keys()),
                title="By Payment Mode",
                color_discrete_sequence=px.colors.qualitative.Pastel,
                hole=0.4,
            )
            fig_mode.update_layout(margin=dict(t=40, b=0, l=0, r=0), height=280)
            st.plotly_chart(fig_mode, use_container_width=True)


# ── Add Expense ──────────────────────────────────────────────────────────────

def render_add_expense():
    col_back, col_title = st.columns([1, 4])
    with col_back:
        if st.button("← Back"):
            go("dashboard")
            st.rerun()
    with col_title:
        st.markdown("## Add expense")

    with st.form("add_expense_form"):
        amount = st.number_input("Amount (₹)", min_value=0.0, step=1.0, value=0.0)

        col1, col2 = st.columns(2)
        with col1:
            date = st.date_input("Date", value=datetime.now())
        with col2:
            now_h = datetime.now().hour
            now_m = datetime.now().minute
            # Build 12-hour time options (every minute)
            time_options = []
            for h in range(24):
                for m in range(60):
                    h12 = h % 12
                    if h12 == 0:
                        h12 = 12
                    ap = "AM" if h < 12 else "PM"
                    time_options.append(f"{h12}:{m:02d} {ap}")
            default_idx = now_h * 60 + now_m
            selected_time = st.selectbox("Time", time_options, index=default_idx)
            # Parse back to HH:MM (24h) for storage
            parts = selected_time.replace("AM", "").replace("PM", "").strip().split(":")
            sel_h = int(parts[0])
            sel_m = int(parts[1])
            is_pm = "PM" in selected_time
            if sel_h == 12:
                sel_h = 0 if not is_pm else 12
            elif is_pm:
                sel_h += 12
            from datetime import time as dt_time
            time = dt_time(sel_h, sel_m)

        col3, col4 = st.columns(2)
        with col3:
            category = st.selectbox("Category", CATEGORIES)
        with col4:
            payment_mode = st.selectbox("Payment mode", PAYMENT_MODES)

        notes = st.text_input("Notes (optional)")

        col_submit, col_cancel = st.columns(2)
        with col_submit:
            submitted = st.form_submit_button("Add expense", type="primary", use_container_width=True)
        with col_cancel:
            cancelled = st.form_submit_button("Cancel", use_container_width=True)

    if submitted:
        if amount <= 0:
            st.error("Enter a valid amount")
        else:
            add_expense(
                st.session_state.user_id,
                date.strftime("%Y-%m-%d"),
                time.strftime("%H:%M"),
                amount,
                category,
                payment_mode,
                notes or "",
            )
            st.success("Expense added!")
            go("dashboard")
            st.rerun()

    if cancelled:
        go("dashboard")
        st.rerun()


# ── View Expenses ────────────────────────────────────────────────────────────

def render_view_expenses():
    col_back, col_title = st.columns([1, 4])
    with col_back:
        if st.button("← Back"):
            go("dashboard")
            st.rerun()
    with col_title:
        st.markdown("## Expenses")

    range_opt = st.radio("", ["Today", "This week", "This month"], horizontal=True, label_visibility="collapsed")

    now = datetime.now()
    if range_opt == "Today":
        from_d = to_d = now.strftime("%Y-%m-%d")
    elif range_opt == "This week":
        start = now - timedelta(days=now.weekday())
        from_d = start.strftime("%Y-%m-%d")
        to_d = (start + timedelta(days=6)).strftime("%Y-%m-%d")
    else:
        from_d = now.replace(day=1).strftime("%Y-%m-%d")
        last = (now.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        to_d = last.strftime("%Y-%m-%d")

    expenses = get_expenses(st.session_state.user_id, from_d, to_d)
    total = sum(e["amount"] for e in expenses)

    st.metric("Total", f"₹{total:,.0f}")

    if not expenses:
        st.info("No expenses in this range.")
        if st.button("Add your first expense", type="primary"):
            go("add")
            st.rerun()
    else:
        # Charts for this range
        cat_totals = {}
        mode_totals = {}
        for e in expenses:
            cat_totals[e["category"]] = cat_totals.get(e["category"], 0) + e["amount"]
            mode_totals[e["paymentMode"]] = mode_totals.get(e["paymentMode"], 0) + e["amount"]

        ch1, ch2 = st.columns(2)
        with ch1:
            fig = px.pie(
                values=list(cat_totals.values()),
                names=list(cat_totals.keys()),
                title="By Category",
                color_discrete_sequence=px.colors.qualitative.Set2,
                hole=0.4,
            )
            fig.update_layout(margin=dict(t=40, b=0, l=0, r=0), height=280)
            st.plotly_chart(fig, use_container_width=True)
        with ch2:
            fig2 = px.pie(
                values=list(mode_totals.values()),
                names=list(mode_totals.keys()),
                title="By Payment Mode",
                color_discrete_sequence=px.colors.qualitative.Pastel,
                hole=0.4,
            )
            fig2.update_layout(margin=dict(t=40, b=0, l=0, r=0), height=280)
            st.plotly_chart(fig2, use_container_width=True)

        st.markdown("---")

        # Expense list
        for e in expenses:
            col_info, col_amount = st.columns([3, 1])
            with col_info:
                st.markdown(f"**{e['category']}** · {e['paymentMode']}")
                st.caption(f"{e['date']} {e.get('time') or ''} {'· ' + e['notes'] if e.get('notes') else ''}")
            with col_amount:
                st.markdown(f"### ₹{e['amount']:,.0f}")
            st.divider()



# ── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    main()

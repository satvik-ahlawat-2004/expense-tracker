"""Expense Tracker - Streamlit app with Google Sheets backend."""
import streamlit as st
from datetime import datetime, timedelta
import bcrypt

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


def init_session():
    if "user_id" not in st.session_state:
        st.session_state.user_id = None
    if "user_email" not in st.session_state:
        st.session_state.user_email = None


def login_user(user_id: str, email: str):
    st.session_state.user_id = user_id
    st.session_state.user_email = email


def logout_user():
    st.session_state.user_id = None
    st.session_state.user_email = None


def is_logged_in():
    return bool(st.session_state.get("user_id"))


def main():
    st.set_page_config(page_title="Expense Tracker", page_icon="💰", layout="centered")
    init_session()

    if not is_logged_in():
        render_auth()
        return

    # Logged in: sidebar with logout, main area with pages
    with st.sidebar:
        st.write(f"**{st.session_state.user_email}**")
        if st.button("Logout"):
            logout_user()
            st.rerun()
        st.divider()
        page = st.radio(
            "Menu",
            ["Dashboard", "Add expense", "View expenses", "Time of day"],
            label_visibility="collapsed",
        )

    try:
        if page == "Dashboard":
            render_dashboard()
        elif page == "Add expense":
            render_add_expense()
        elif page == "View expenses":
            render_view_expenses()
        else:
            render_time_of_day()
    except Exception as e:
        st.error(str(e))


def render_auth():
    st.title("Expense Tracker")
    tab1, tab2 = st.tabs(["Log in", "Sign up"])
    with tab1:
        with st.form("login"):
            email = st.text_input("Email", placeholder="you@example.com")
            password = st.text_input("Password", type="password", placeholder="••••••••")
            if st.form_submit_button("Log in"):
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
                        st.success("Logged in!")
                        st.rerun()
    with tab2:
        with st.form("signup"):
            email = st.text_input("Email", placeholder="you@example.com", key="signup_email")
            password = st.text_input("Password (min 6 chars)", type="password", placeholder="••••••••", key="signup_pw")
            if st.form_submit_button("Sign up"):
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
                    st.success("Account created! Logged in.")
                    st.rerun()


def render_dashboard():
    st.title("Dashboard")
    totals = get_totals(st.session_state.user_id)
    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("Today", f"₹{totals['daily']:,.0f}")
    with c2:
        st.metric("This week", f"₹{totals['weekly']:,.0f}")
    with c3:
        st.metric("This month", f"₹{totals['monthly']:,.0f}")


def render_add_expense():
    st.title("Add expense")
    today = datetime.now().strftime("%Y-%m-%d")
    now_time = datetime.now().strftime("%H:%M")
    with st.form("add_expense"):
        amount = st.number_input("Amount (₹)", min_value=0.0, step=1.0, value=0.0)
        col1, col2 = st.columns(2)
        with col1:
            date = st.date_input("Date", value=datetime.now()).strftime("%Y-%m-%d")
        with col2:
            time = st.time_input("Time", value=datetime.now()).strftime("%H:%M")
        category = st.selectbox("Category", CATEGORIES)
        payment_mode = st.selectbox("Payment mode", PAYMENT_MODES)
        notes = st.text_input("Notes (optional)", placeholder="Optional")
        if st.form_submit_button("Add expense"):
            if amount <= 0:
                st.error("Enter a valid amount")
            else:
                add_expense(
                    st.session_state.user_id,
                    date,
                    time,
                    amount,
                    category,
                    payment_mode,
                    notes or "",
                )
                st.success("Expense added!")
                st.rerun()


def render_view_expenses():
    st.title("View expenses")
    range_opt = st.radio("Range", ["Today", "This week", "This month"], horizontal=True)
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
    else:
        rows = []
        for e in expenses:
            rows.append({
                "Date": e["date"],
                "Time": e.get("time") or "—",
                "Amount": e["amount"],
                "Category": e["category"],
                "Payment": e["paymentMode"],
                "Notes": e.get("notes") or "",
            })
        st.dataframe(rows, use_container_width=True, hide_index=True)


def render_time_of_day():
    st.title("Time of day")
    ref = st.date_input("Month", value=datetime.now())
    ref_dt = datetime(ref.year, ref.month, 1)
    from_d = ref_dt.strftime("%Y-%m-%d")
    last = (ref_dt + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    to_d = last.strftime("%Y-%m-%d")
    expenses = get_expenses(st.session_state.user_id, from_d, to_d)
    by_hour = {}
    for i in range(24):
        by_hour[i] = {"count": 0, "total": 0}
    for e in expenses:
        try:
            h = 0
            if e.get("time"):
                parts = e["time"].split(":")
                h = int(parts[0]) if parts else 0
            by_hour[h]["count"] += 1
            by_hour[h]["total"] += e["amount"]
        except (ValueError, IndexError):
            pass
    rows = []
    for h in range(24):
        label = f"{h:02d}:00"
        rows.append({"Hour": label, "Count": by_hour[h]["count"], "Total (₹)": by_hour[h]["total"]})
    st.dataframe(rows, use_container_width=True, hide_index=True)


if __name__ == "__main__":
    main()

"""Google Sheets helper - reads/writes Expenses and Users using same schema as Node app."""
import os
import json
import secrets
from datetime import datetime
from typing import Optional

import gspread
from google.oauth2.service_account import Credentials

def _get_sheet_id():
    try:
        import streamlit as st
        if hasattr(st, "secrets") and st.secrets.get("SHEET_ID"):
            return st.secrets["SHEET_ID"]
    except Exception:
        pass
    return os.environ.get("SHEET_ID") or None


SHEET_ID = None  # Set at runtime
EXPENSES_TAB = "Expenses"
USERS_TAB = "Users"

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"]
PAYMENT_MODES = ["Cash", "UPI", "Card", "Net Banking", "Other"]


def _get_credentials():
    """Get credentials from Streamlit secrets, env JSON, or file path."""
    json_str = None
    creds_dict = None
    try:
        import streamlit as st
        if hasattr(st, "secrets") and st.secrets.get("GOOGLE_APPLICATION_CREDENTIALS_JSON"):
            v = st.secrets["GOOGLE_APPLICATION_CREDENTIALS_JSON"]
            creds_dict = v if isinstance(v, dict) else json.loads(str(v))
    except Exception:
        pass
    if not creds_dict:
        json_str = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if json_str:
            try:
                creds_dict = json.loads(json_str)
            except json.JSONDecodeError:
                creds_dict = None
    if creds_dict:
        return Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
    path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if path and os.path.exists(path):
        return Credentials.from_service_account_file(path, scopes=SCOPES)
    raise ValueError("Set GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS")


def get_sheet(sheet_name: str):
    sheet_id = _get_sheet_id()
    if not sheet_id:
        raise ValueError("SHEET_ID not set (use env var or .streamlit/secrets.toml)")
    creds = _get_credentials()
    gc = gspread.authorize(creds)
    spreadsheet = gc.open_by_key(sheet_id)
    return spreadsheet.worksheet(sheet_name)


def parse_sheet_date(val):
    if val is None or val == "":
        return ""
    try:
        n = float(val)
        if n > 1000:
            from datetime import timedelta
            base = datetime(1899, 12, 30)
            d = base + timedelta(days=n)
            return d.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        pass
    return str(val).strip() or ""


def parse_sheet_time(val):
    if val is None or val == "":
        return ""
    try:
        n = float(val)
        if 0 <= n < 1:
            total_min = int(round(n * 24 * 60))
            h, m = divmod(total_min, 60)
            return f"{h:02d}:{m:02d}"
    except (ValueError, TypeError):
        pass
    return str(val).strip() or ""


def generate_user_id():
    return secrets.token_hex(16)


# --- Users ---


def get_all_users():
    try:
        ws = get_sheet(USERS_TAB)
        rows = ws.get_all_values()
    except Exception:
        return []
    if len(rows) < 2:
        return []
    users = []
    for row in rows[1:]:
        if len(row) >= 4:
            users.append({
                "userId": row[0] or "",
                "email": (row[1] or "").strip().lower(),
                "passwordHash": row[2] or "",
                "createdAt": row[3] or "",
            })
    return users


def find_user_by_email(email: str):
    users = get_all_users()
    norm = (email or "").strip().lower()
    for u in users:
        if u["email"] == norm:
            return u
    return None


def create_user(user_id: str, email: str, password_hash: str):
    ws = get_sheet(USERS_TAB)
    row = [user_id, email.strip().lower(), password_hash, datetime.utcnow().isoformat() + "Z"]
    ws.append_row(row, value_input_option="USER_ENTERED")


# --- Expenses ---


def _row_to_expense(row, idx):
    if len(row) < 8:
        row = row + [""] * (8 - len(row))
    uid, date, time, amount, category, payment_mode, notes, created = row[:8]
    return {
        "id": idx + 2,
        "userId": uid or "",
        "date": parse_sheet_date(date) or date or "",
        "time": parse_sheet_time(time) or time or "",
        "amount": float(amount) if amount else 0,
        "category": category or "",
        "paymentMode": payment_mode or "",
        "notes": notes or "",
        "createdAt": created or "",
    }


def get_expenses(user_id: str, from_date: Optional[str] = None, to_date: Optional[str] = None):
    if not user_id:
        return []
    try:
        ws = get_sheet(EXPENSES_TAB)
        rows = ws.get_all_values()
    except Exception:
        return []
    if len(rows) < 2:
        return []
    expenses = []
    from_dt = datetime.min if not from_date else datetime.strptime(from_date[:10], "%Y-%m-%d")
    to_dt = datetime.max if not to_date else datetime.strptime(to_date[:10], "%Y-%m-%d")
    to_dt = to_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
    for i, row in enumerate(rows[1:]):
        exp = _row_to_expense(row, i)
        if exp["userId"] != user_id:
            continue
        try:
            d = datetime.strptime(exp["date"][:10], "%Y-%m-%d") if exp["date"] else datetime.min
            if exp["time"]:
                try:
                    h, m = map(int, exp["time"].split(":")[:2])
                    d = d.replace(hour=h, minute=m, second=0)
                except (ValueError, IndexError):
                    pass
            if from_dt <= d <= to_dt:
                expenses.append(exp)
        except (ValueError, TypeError):
            pass
    return expenses


def get_totals(user_id: str, ref_date: Optional[datetime] = None):
    from datetime import timedelta
    if not ref_date:
        ref_date = datetime.now()
    # Fetch from start of week (or month) to end of month
    start_week = ref_date
    while start_week.weekday() != 0:
        start_week = start_week - timedelta(days=1)
    start_week = start_week.replace(hour=0, minute=0, second=0, microsecond=0)
    start_month = ref_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    fetch_from = min(start_week, start_month)
    end_month = ref_date.replace(day=1) + timedelta(days=32)
    end_month = (end_month.replace(day=1) - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
    expenses = get_expenses(
        user_id,
        from_date=fetch_from.strftime("%Y-%m-%d"),
        to_date=end_month.strftime("%Y-%m-%d"),
    )
    start_day = ref_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_day = ref_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    end_week = start_week + timedelta(days=6)
    end_week = end_week.replace(hour=23, minute=59, second=59, microsecond=999999)

    def dt(exp):
        try:
            d = datetime.strptime(exp["date"][:10], "%Y-%m-%d")
            if exp.get("time"):
                parts = exp["time"].split(":")
                h, m = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
                d = d.replace(hour=h, minute=m, second=0)
            return d
        except (ValueError, TypeError, IndexError):
            return datetime.min

    daily = sum(e["amount"] for e in expenses if start_day <= dt(e) <= end_day)
    weekly = sum(e["amount"] for e in expenses if start_week <= dt(e) <= end_week)
    monthly = sum(e["amount"] for e in expenses if start_month <= dt(e) <= end_month)
    return {"daily": daily, "weekly": weekly, "monthly": monthly}


def add_expense(user_id: str, date: str, time: str, amount: float, category: str, payment_mode: str, notes: str):
    if not user_id:
        raise ValueError("User ID required")
    ws = get_sheet(EXPENSES_TAB)
    row = [user_id, date, time, amount, category, payment_mode, notes, datetime.utcnow().isoformat() + "Z"]
    ws.append_row(row, value_input_option="USER_ENTERED")

# Expense Tracker (Streamlit)

Python Streamlit version of the Expense Tracker. Uses the **same Google Sheet** as the React/Node app — Expenses and Users tabs.

## Features

- **Log in / Sign up** — Multi-user auth with bcrypt
- **Dashboard** — Today, This week, This month totals
- **Add expense** — Date, Time, Amount, Category, Payment mode, Notes
- **View expenses** — Filter by Today / Week / Month
- **Time of day** — Hour-by-hour spending breakdown

## Setup

### 1. Google Sheet

Same as the Node app:

- **Expenses** tab: UserId | Date | Time | Amount | Category | Payment Mode | Notes | Created Timestamp
- **Users** tab: UserId | Email | PasswordHash | CreatedAt
- Share the Sheet with your service account email (Editor)

### 2. Credentials

**Option A – Local (secrets.toml)**

```bash
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
# Edit secrets.toml: add SHEET_ID and GOOGLE_APPLICATION_CREDENTIALS_JSON
```

**Option B – Environment variables**

```bash
export SHEET_ID=your_sheet_id
export GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
```

Or use `GOOGLE_APPLICATION_CREDENTIALS=./path/to/key.json` for a file.

### 3. Run locally

```bash
pip install -r requirements.txt
streamlit run app.py
```

Open http://localhost:8501

## Deploy to Streamlit Cloud

1. Push this folder to GitHub (or the `expense-tracker-streamlit` subfolder).
2. Go to [share.streamlit.io](https://share.streamlit.io) and sign in with GitHub.
3. **New app** → select your repo and set **Main file path** to `app.py`.
4. Add secrets in the dashboard:
   - `SHEET_ID` = your Google Sheet ID
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON` = paste the full JSON key content (or use Secret file upload)

5. Deploy — no credit card required.

## Same data as React app

This app reads and writes the **same** Google Sheet. Users and expenses are shared between the Streamlit and React versions.

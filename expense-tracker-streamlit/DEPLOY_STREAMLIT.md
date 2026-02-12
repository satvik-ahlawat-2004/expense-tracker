# Deploy Expense Tracker to Streamlit Cloud

**No credit card required.** Streamlit Community Cloud is free.

## Step 1: Push to GitHub

Ensure the `expense-tracker-streamlit` folder is in your GitHub repo. If the repo root is the project root, the path should be `expense-tracker-streamlit/` at the top level.

## Step 2: Create Streamlit Cloud app

1. Go to [share.streamlit.io](https://share.streamlit.io)
2. Sign in with GitHub
3. Click **New app**
4. **Repository:** Select your repo (e.g. `satvik-ahlawat-2004/expense-tracker`)
5. **Branch:** `main`
6. **Main file path:** `expense-tracker-streamlit/app.py`
7. **App URL:** Choose a subdomain (e.g. `expense-tracker-streamlit`)
8. Click **Deploy!**

## Step 3: Add secrets

In the app dashboard, go to **Settings** → **Secrets** and add:

```toml
SHEET_ID = "your_google_sheet_id_here"

GOOGLE_APPLICATION_CREDENTIALS_JSON = '''
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  ...
}
'''
```

Or use **Secret file** to upload your service account JSON file.

## Step 4: Deploy

Streamlit will build and deploy. Your app will be live at:

`https://your-app-name.streamlit.app`

## Troubleshooting

- **"SHEET_ID not set"** — Add SHEET_ID in Secrets
- **"Invalid credentials"** — Ensure the full JSON is in GOOGLE_APPLICATION_CREDENTIALS_JSON ( escape newlines in the private key as `\\n`)
- **Sheet not found** — Share the Google Sheet with the service account email (Editor)

# Deploy Expense Tracker to Render

Follow these steps to deploy your Expense Tracker app live on the web.

## Prerequisites

- GitHub account with the repo pushed
- Google Sheet set up (Expenses + Users tabs)
- Google Cloud service account JSON key

## Step 1: Connect to Render

1. Go to [render.com](https://render.com) and sign up (free).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select the **expense-tracker** repo.
4. Render will use the `render.yaml` in the repo. If it doesn’t detect it, use the settings below.

## Step 2: Configure the service

**Root directory:** `expense-tracker`

**Build command:**
```bash
cd client && npm install && npm run build
cd ../server && npm install
```

**Start command:**
```bash
cd server && npm start
```

**Runtime:** Node

## Step 3: Set environment variables

In the Render dashboard, go to **Environment** and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `SHEET_ID` | Your Google Sheet ID (from the URL: `.../d/SHEET_ID/edit`) |
| `JWT_SECRET` | A long random string (run `openssl rand -hex 32` locally) |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | **Full JSON content** of your service account key (paste as a single line) |

For `GOOGLE_APPLICATION_CREDENTIALS_JSON`:

1. Open your service account JSON file (e.g. `resounding-net-481006-j3-47b4dcb922a7.json`).
2. Copy the **entire** JSON (minified, single line).
3. Paste it into the env var value.

## Step 4: Deploy

1. Click **Create Web Service**.
2. Wait for the build and deploy to finish.
3. Your app will be available at a URL like `https://expense-tracker-xxxx.onrender.com`.

## After deployment

- Share your Google Sheet with the **service account email** (from the JSON) as **Editor**.
- The app URL serves both the API and the frontend.

## Troubleshooting

- **Storage temporarily unavailable:** Check `SHEET_ID` and that the Sheet is shared with the service account.
- **Server auth not configured:** Verify `JWT_SECRET` is set (at least 16 characters).
- **Build fails:** Check that `rootDir` is `expense-tracker` and the build runs from there.

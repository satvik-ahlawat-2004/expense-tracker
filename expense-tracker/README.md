# Expense Tracker Web App (MVP)

A lightweight, privacy-first expense tracker that uses **Google Sheets** as the primary data store. Works on mobile and laptop with fast manual entry, dashboard totals (daily/weekly/monthly), and time-of-day analysis.

## Tech Stack

- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express
- **Storage:** Google Sheets API (service account)

## Prerequisites

- Node.js 18+
- A Google Cloud project with Sheets API enabled
- A Google Sheet with header row: `Date`, `Time`, `Amount`, `Category`, `Payment Mode`, `Notes`, `Created Timestamp`

## Setup

### 1. Google Sheet & Service Account

1. Create a [Google Cloud project](https://console.cloud.google.com/).
2. Enable **Google Sheets API** (APIs & Services → Enable APIs).
3. Create a **Service Account** (APIs & Services → Credentials → Create Credentials → Service Account). Download the JSON key.
4. Create a new Google Sheet. Name the first sheet tab **Expenses**.
5. In row 1 of the **Expenses** tab, add headers: `UserId` | `Date` | `Time` | `Amount` | `Category` | `Payment Mode` | `Notes` | `Created Timestamp` (UserId is column A for multi-user filtering).
6. For **multi-user support**, add a second tab named **Users** with row 1: `UserId` | `Email` | `PasswordHash` | `CreatedAt`. The app uses this to store user accounts.
7. Share the Sheet with the **service account email** (from the JSON key) as **Editor**. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`.

### 2. Service Account Credentials (Important)

The backend reads the Google Sheets API key from a **service account JSON file**. Set this up as follows:

- **Location:** The JSON key file **must** be placed **inside the `server/` directory**.  
  Example: `expense-tracker/server/your-service-account-key.json`

- **Environment variable:** In `server/.env`, set the path **relative to the `server/` directory** (filename only is enough if the file is in `server/`):
  ```bash
  GOOGLE_APPLICATION_CREDENTIALS=./your-service-account-key.json
  ```
  Replace `your-service-account-key.json` with the actual filename of your key file.

- **Working directory:** This relative path works **only when the server is started from the `server/` directory**. Always run:
  ```bash
  cd server && npm run dev
  ```
  If you start the server from the project root (e.g. `npm run dev` from `expense-tracker/`), the relative path will not resolve and the app will not find the credentials. This is expected.

- **Security:** Service account keys must **never** be committed to Git. The file is listed in `server/.gitignore`. Do not add credential JSON files to version control.

### 3. Backend

```bash
cd server
cp .env.example .env
# Edit .env: set SHEET_ID, GOOGLE_APPLICATION_CREDENTIALS, and JWT_SECRET (e.g. openssl rand -hex 32)
npm install
npm run dev
```

Server runs at `http://localhost:3001`.

### 4. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at `http://localhost:5173`. The Vite config proxies `/api` to the backend.

## Scripts

| Location | Command   | Description        |
|----------|-----------|--------------------|
| server   | `npm run dev` | Start API with watch |
| server   | `npm start`   | Start API (production) |
| client   | `npm run dev` | Start dev server      |
| client   | `npm run build` | Production build   |

## Features (MVP)

- **Dashboard** — Daily, weekly, and monthly spending totals.
- **Add expense** — Fast manual entry (date, time, amount, category, payment mode, notes); data stored in Google Sheets.
- **View expenses** — List filtered by today, this week, or this month.
- **Time of day** — Hour-by-hour spending breakdown for the selected month (differentiation vs competitors).

## API

**Auth (multi-user)**

- `POST /api/auth/signup` — Register (body: email, password). Returns `{ token, user }`.
- `POST /api/auth/login` — Login (body: email, password). Returns `{ token, user }`.
- `GET /api/auth/me` — Current user (header: `Authorization: Bearer <token>`). Returns `{ user }`.

**Expenses**

- `POST /api/expenses` — Add expense (body: date, time, amount, category, paymentMode, notes).
- `GET /api/expenses?from=YYYY-MM-DD&to=YYYY-MM-DD` — List expenses in range.
- `GET /api/expenses/totals?date=YYYY-MM-DD` — Get daily, weekly, monthly totals.

## Project Structure

```
expense-tracker/
├── client/          # React + Vite
│   └── src/
│       ├── components/
│       ├── views/
│       ├── hooks/
│       ├── api/
│       ├── App.jsx
│       └── main.jsx
├── server/          # Node + Express
│   └── src/
│       ├── routes/
│       ├── services/   # Google Sheets
│       ├── config/
│       ├── middleware/
│       └── app.js
└── README.md
```

## Deploy to Render

Deploy this app live in one click:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/satvik-ahlawat-2004/expense-tracker)

After deploying, add these environment variables in the Render dashboard:

| Variable | Value |
|----------|-------|
| `SHEET_ID` | Your Google Sheet ID |
| `JWT_SECRET` | Run `openssl rand -hex 32` locally |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Full JSON content of your service account key |

See [DEPLOY.md](../DEPLOY.md) in the repo root for detailed steps.

## License

MIT

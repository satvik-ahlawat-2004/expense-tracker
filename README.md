# Expense Tracker Project

This folder contains the **Expense Tracker** app and the market analysis PDF.

**Note:** There is no `server` or `client` folder here. Both live inside **`expense-tracker/`**. From this folder, start the backend with **`npm run dev:server`** and the frontend with **`npm run dev:client`**.

## Run the app

The app code is inside **`expense-tracker/`**. You can run it in two ways:

### Option A – From this folder (project root)

```bash
# Terminal 1 – start the backend
npm run dev:server

# Terminal 2 – start the frontend
npm run dev:client
```

### Option B – From inside expense-tracker

```bash
cd expense-tracker

# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Then open **http://localhost:5173** in your browser.

For full setup (Google Sheet, credentials, env), see **[expense-tracker/README.md](expense-tracker/README.md)**.

## Deploy

### Render (React + Node app)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/satvik-ahlawat-2004/expense-tracker)

See **[DEPLOY.md](DEPLOY.md)** for details.

### Streamlit Cloud (Python app, no credit card)

The **Streamlit** version lives in `expense-tracker-streamlit/` and uses the same Google Sheet. Deploy at [share.streamlit.io](https://share.streamlit.io) — no payment required. See **[expense-tracker-streamlit/DEPLOY_STREAMLIT.md](expense-tracker-streamlit/DEPLOY_STREAMLIT.md)**.

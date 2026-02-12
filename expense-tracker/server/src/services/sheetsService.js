import { google } from 'googleapis';
import { config } from '../config/env.js';

const SHEET_NAME = 'Expenses';
// Column order: UserId, Date, Time, Amount, Category, Payment Mode, Notes, Created Timestamp (A–H)
const COLUMNS = ['UserId', 'Date', 'Time', 'Amount', 'Category', 'Payment Mode', 'Notes', 'Created Timestamp'];

function getSheetsClient() {
  const authOptions = {
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  };
  if (config.credentials) {
    authOptions.credentials = config.credentials;
  } else if (config.credentialsPath) {
    authOptions.keyFile = config.credentialsPath;
  }
  const auth = new google.auth.GoogleAuth(authOptions);
  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, sheetId: config.sheetId };
}

// Google Sheets stores dates/times as serials. Convert so filtering and frontend work.
const SHEETS_EPOCH_OFFSET = 25569; // days from 1899-12-30 to 1970-01-01

function isSheetSerial(val) {
  // Detect numeric values (number type or numeric string like "46061", "0.655")
  if (typeof val === 'number') return true;
  if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) return true;
  return false;
}

function parseSheetDate(val) {
  if (val == null || val === '') return '';
  if (isSheetSerial(val)) {
    const num = Number(val);
    // Only treat as a serial if it looks like one (> 1000 means a date after ~1902)
    if (num > 1000) {
      const d = new Date((num - SHEETS_EPOCH_OFFSET) * 86400 * 1000);
      return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    }
  }
  // Already an ISO date string like "2026-02-12"
  return String(val).trim() || '';
}

function parseSheetTime(val) {
  if (val == null || val === '') return '';
  if (isSheetSerial(val)) {
    const num = Number(val);
    // Time serials are fractions of a day (0.0 – 0.9999...)
    if (num >= 0 && num < 1) {
      const totalMinutes = Math.round(num * 24 * 60);
      const h = Math.floor(totalMinutes / 60) % 24;
      const m = totalMinutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  // Already a time string like "15:44"
  return String(val).trim() || '';
}

function rowToExpense(row, index) {
  const [userId, date, time, amount, category, paymentMode, notes, createdAt] = row;
  return {
    id: index + 2,
    userId: userId || '',
    date: parseSheetDate(date) || date || '',
    time: parseSheetTime(time) || time || '',
    amount: parseFloat(amount) || 0,
    category: category || '',
    paymentMode: paymentMode || '',
    notes: notes || '',
    createdAt: createdAt || '',
  };
}

function parseRange(from, to) {
  const fromDate = from ? new Date(from) : new Date(0);
  const toDate = to ? new Date(to) : new Date(8640000000000000);
  return { fromDate, toDate };
}

function expenseInRange(expense, fromDate, toDate) {
  const d = new Date(expense.date);
  return d >= fromDate && d <= toDate;
}

export async function getExpenses({ from, to, userId } = {}) {
  const { sheets, sheetId } = getSheetsClient();
  if (!sheetId) throw new Error('SHEET_ID not configured');
  if (!userId) throw new Error('UserId is required');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A2:H`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const rows = response.data.values || [];
  const { fromDate, toDate } = parseRange(from, to);

  const expenses = rows
    .map((row, i) => rowToExpense(row, i))
    .filter((e) => e.userId === userId && expenseInRange(e, fromDate, toDate));

  return expenses;
}

export async function getTotals(dateStr, userId) {
  if (!userId) throw new Error('UserId is required');

  const refDate = dateStr ? new Date(dateStr) : new Date();

  const startOfDay = new Date(refDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(refDate);
  endOfDay.setHours(23, 59, 59, 999);

  const startOfWeek = new Date(refDate);
  startOfWeek.setDate(refDate.getDate() - refDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
  const endOfMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const fetchFrom = startOfWeek < startOfMonth ? startOfWeek : startOfMonth;
  const fetchTo = endOfMonth;

  const expenses = await getExpenses({
    from: fetchFrom.toISOString().slice(0, 10),
    to: fetchTo.toISOString().slice(0, 10),
    userId,
  });

  const sum = (list) => list.reduce((acc, e) => acc + e.amount, 0);

  const daily = sum(
    expenses.filter((e) => {
      const d = new Date(e.date + (e.time ? 'T' + e.time : ''));
      return d >= startOfDay && d <= endOfDay;
    })
  );

  const weekly = sum(
    expenses.filter((e) => {
      const d = new Date(e.date + (e.time ? 'T' + e.time : ''));
      return d >= startOfWeek && d <= endOfWeek;
    })
  );

  const monthly = sum(
    expenses.filter((e) => {
      const d = new Date(e.date + (e.time ? 'T' + e.time : ''));
      return d >= startOfMonth && d <= endOfMonth;
    })
  );

  return { daily, weekly, monthly };
}

export async function addExpense(body, userId) {
  const { sheets, sheetId } = getSheetsClient();
  if (!sheetId) throw new Error('SHEET_ID not configured');
  if (!userId) throw new Error('UserId is required');

  const date = body.date || new Date().toISOString().slice(0, 10);
  const time = body.time || new Date().toTimeString().slice(0, 5);
  const amount = Number(body.amount);
  const category = String(body.category || '').trim();
  const paymentMode = String(body.paymentMode || '').trim();
  const notes = String(body.notes || '').trim();
  const createdAt = new Date().toISOString();

  if (!(Number.isFinite(amount) && amount >= 0)) throw new Error('Invalid amount');
  if (!category) throw new Error('Category is required');
  if (!paymentMode) throw new Error('Payment mode is required');

  const row = [userId, date, time, amount, category, paymentMode, notes, createdAt];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A:H`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  return {
    date,
    time,
    amount,
    category,
    paymentMode,
    notes,
    createdAt,
  };
}

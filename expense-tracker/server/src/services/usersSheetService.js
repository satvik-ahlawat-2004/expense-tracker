import { google } from 'googleapis';
import { config } from '../config/env.js';
import crypto from 'crypto';

const USERS_SHEET_NAME = 'Users';

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, sheetId: config.sheetId };
}

function rowToUser(row) {
  const [userId, email, passwordHash, createdAt] = row;
  return {
    userId: userId || '',
    email: (email || '').trim().toLowerCase(),
    passwordHash: passwordHash || '',
    createdAt: createdAt || '',
  };
}

export function generateUserId() {
  return crypto.randomBytes(16).toString('hex');
}

export async function getAllUsers() {
  const { sheets, sheetId } = getSheetsClient();
  if (!sheetId) throw new Error('SHEET_ID not configured');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${USERS_SHEET_NAME}!A2:D`,
  });

  const rows = response.data.values || [];
  return rows.map(rowToUser);
}

export async function findUserByEmail(email) {
  const users = await getAllUsers();
  const normalized = (email || '').trim().toLowerCase();
  return users.find((u) => u.email === normalized) || null;
}

export async function createUser({ userId, email, passwordHash }) {
  const { sheets, sheetId } = getSheetsClient();
  if (!sheetId) throw new Error('SHEET_ID not configured');

  const normalizedEmail = (email || '').trim().toLowerCase();
  const createdAt = new Date().toISOString();
  const row = [userId, normalizedEmail, passwordHash, createdAt];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${USERS_SHEET_NAME}!A:D`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  return {
    userId,
    email: normalizedEmail,
    createdAt,
  };
}

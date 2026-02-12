import dotenv from 'dotenv';

dotenv.config();

let credentials = null;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  } catch {
    console.warn('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON, falling back to keyFile');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  sheetId: process.env.SHEET_ID || '',
  credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  credentials,
  jwtSecret: process.env.JWT_SECRET || '',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],
  isProduction: process.env.NODE_ENV === 'production',
};

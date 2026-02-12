import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  sheetId: process.env.SHEET_ID || '',
  credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  jwtSecret: process.env.JWT_SECRET || '',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],
};

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { authRoutes } from './routes/authRoutes.js';
import { expenseRoutes } from './routes/expenseRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', expenseRoutes);

// Serve built frontend in production
if (config.isProduction) {
  const distPath = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});

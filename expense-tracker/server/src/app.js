import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { authRoutes } from './routes/authRoutes.js';
import { expenseRoutes } from './routes/expenseRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', expenseRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});

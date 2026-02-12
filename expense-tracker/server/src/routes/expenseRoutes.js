import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getExpenses, getTotals, addExpense } from '../services/sheetsService.js';

export const expenseRoutes = Router();

expenseRoutes.use(authMiddleware);

expenseRoutes.get('/expenses', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const expenses = await getExpenses({ from, to, userId: req.user.userId });
    res.json({ expenses });
  } catch (err) {
    next(err);
  }
});

expenseRoutes.get('/expenses/totals', async (req, res, next) => {
  try {
    const { date } = req.query;
    const totals = await getTotals(date, req.user.userId);
    res.json(totals);
  } catch (err) {
    next(err);
  }
});

expenseRoutes.post('/expenses', async (req, res, next) => {
  try {
    const row = await addExpense(req.body, req.user.userId);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

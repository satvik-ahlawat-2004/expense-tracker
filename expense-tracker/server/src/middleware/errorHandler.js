export function errorHandler(err, req, res, next) {
  const message = err.message || 'Internal server error';
  const code = err.code;

  console.error('[Server error]', message, err.code || '', err.response?.data || '');

  if (err.message === 'SHEET_ID not configured' || err.message?.includes('credentials')) {
    res.status(502).json({ error: 'Storage temporarily unavailable', code });
    return;
  }

  if (err.message?.includes('JWT_SECRET')) {
    res.status(503).json({
      error: 'Server auth not configured. Set JWT_SECRET in server/.env (e.g. run: openssl rand -hex 32)',
      code,
    });
    return;
  }

  if (
    message === 'Invalid amount' ||
    message === 'Category is required' ||
    message === 'Payment mode is required'
  ) {
    res.status(400).json({ error: message, code });
    return;
  }

  if (err.code === 'ECONNREFUSED' || err.response?.status >= 500) {
    res.status(502).json({ error: 'Storage temporarily unavailable', code });
    return;
  }

  if (err.response?.status === 404 || err.message?.includes('Unable to parse range') || err.message?.includes('not found')) {
    res.status(502).json({
      error: 'Sheet or range not found. Ensure the spreadsheet has a tab named "Users" with row 1: UserId, Email, PasswordHash, CreatedAt.',
      code,
    });
    return;
  }

  res.status(500).json({ error: 'Internal server error', code });
}

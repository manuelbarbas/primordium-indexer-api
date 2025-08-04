import { VercelRequest, VercelResponse } from '@vercel/node';

export function authenticate(req: VercelRequest, res: VercelResponse): boolean {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    res.status(500).json({ error: 'Server configuration error: API_KEY not set' });
    return false;
  }

  const providedKey = req.headers['x-api-key'];

  console.log('Auth Check:', {
    path: req.url,
    method: req.method,
    providedKey,
    expectedKey: apiKey,
    match: providedKey === apiKey
  });

  if (!providedKey || providedKey !== apiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}

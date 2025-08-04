import { VercelRequest, VercelResponse } from '@vercel/node';

export function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  //res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  //res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');


  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

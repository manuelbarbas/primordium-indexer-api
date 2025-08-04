import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_utils/cors';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  /*if (setCorsHeaders(req, res)) {
    return; // Preflight request handled
  }*/

  res.status(200).json({ status: 'ready' });
}

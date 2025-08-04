import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders } from './_utils/cors';

export default function handler(req: VercelRequest, res: VercelResponse) {

  if (setCorsHeaders(req, res)) {
    return; // Preflight request handled
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return res.json({
    message: "emit Herld(); ",
  });
}

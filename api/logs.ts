import { VercelRequest, VercelResponse } from '@vercel/node';
import { createBenchmark } from '@latticexyz/common';
import { setCorsHeaders } from './_utils/cors';
import { authenticate } from './_utils/auth';
import { getDatabase } from './_utils/database';
import { queryLogs } from '../src/postgres/queryLogs';
import { filterSchema } from '../src/postgres/querySchema';
import { recordToLog } from '../src/util/recordToLog';
import { debug, error } from '../src/util/debug';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  /*if (setCorsHeaders(req, res)) {
    return; // Preflight request handled
  }*/

  // Authenticate request
  if (!authenticate(req, res)) {
    return;
  }

  const database = getDatabase();
  const benchmark = createBenchmark('postgres:logs');

  try {
    const input = typeof req.query.input === 'string' ? JSON.parse(req.query.input) : {};
    const options = filterSchema.parse(input);
    console.log('Query options for /api/logs:', options);
    
    options.filters = options.filters && options.filters.length > 0 ? [...options.filters] : [];
    
    const records = await queryLogs(database, options ?? {}).execute();
    benchmark('query records');

    if (records.length === 0) {
      res.status(200).json({
        blockNumber: 0,
        chunk: 1,
        totalChunks: 1,
        logs: [],
      });
      return;
    }

    const blockNumber = records[0].chainBlockNumber;
    const logs = records.map(recordToLog);
    benchmark('map records to logs');

    const chunkSize = 1000;
    const chunks: (typeof logs)[] = [];
    for (let i = 0; i < logs.length; i += chunkSize) {
      const chunk = logs.slice(i, i + chunkSize);
      chunks.push(chunk);
    }

    // For serverless, we'll return all chunks as an array instead of streaming
    const response = chunks.map((chunk, index) => ({
      blockNumber,
      chunk: index + 1,
      totalChunks: chunks.length,
      logs: chunk,
    }));

    res.status(200).json(response);

  } catch (e) {
    console.error('Error in logs endpoint:', e);
    res.status(500).json({ error: 'Server error querying logs', details: e });
    error(e);
  }
}

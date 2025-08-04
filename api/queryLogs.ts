import { VercelRequest, VercelResponse } from '@vercel/node';
import { createBenchmark } from '@latticexyz/common';
import { setCorsHeaders } from './_utils/cors';
import { authenticate } from './_utils/auth';
import { getDatabase } from './_utils/database';
import { dbQuerySchema } from '../src/postgres/querySchema';
import { toSQL } from '../src/postgres/queryToSql';
import { recordToLog } from '../src/util/recordToLog';
import { debug } from '../src/util/debug';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (setCorsHeaders(req, res)) {
    return; // Preflight request handled
  }

  // Authenticate request
  if (!authenticate(req, res)) {
    return;
  }

  const database = getDatabase();
  const benchmark = createBenchmark('postgres:logs');

  try {
    console.log('request', req.query);
    
    const input = dbQuerySchema.parse(typeof req.query.input === 'string' ? JSON.parse(req.query.input) : {});
    const records = await toSQL(database, input.address, input.queries);
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

    // For serverless, return all chunks as an array instead of streaming
    const response = chunks.map((chunk, index) => ({
      blockNumber,
      chunk: index + 1,
      totalChunks: chunks.length,
      logs: chunk,
    }));

    res.status(200).json(response);

  } catch (e: any) {
    console.error('Error in queryLogs:', {
      message: e.message,
      stack: e.stack,
      cause: e.cause,
      name: e.name,
      code: e.code,
      detail: e.detail,
      hint: e.hint,
      position: e.position,
      internalPosition: e.internalPosition,
      internalQuery: e.internalQuery,
      where: e.where,
      schema: e.schema,
      table: e.table,
      column: e.column,
      dataType: e.dataType,
      constraint: e.constraint,
      file: e.file,
      line: e.line,
      routine: e.routine
    });
    
    res.status(500).json({
      error: 'Server error querying specific logs',
      details: {
        message: e.message,
        code: e.code,
        detail: e.detail,
        hint: e.hint
      }
    });
    debug(e);
  }
}

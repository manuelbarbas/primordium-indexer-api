import postgres from "postgres";
import { z } from "zod";

let database: ReturnType<typeof postgres> | null = null;

export function getDatabase() {
  if (!database) {
    const databaseUrl = process.env.INDEXER_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("INDEXER_DATABASE_URL environment variable is required");
    }

    database = postgres(databaseUrl, {
      prepare: false,
      connect_timeout: 60, // 60 seconds connection timeout
      idle_timeout: 30, // 30 seconds idle timeout
      max_lifetime: 60 * 60, // 1 hour max connection lifetime
      max: 5, // Reduced max connections for serverless
      idle_in_transaction_session_timeout: 60000, // 60 seconds in milliseconds
      connection: {
        application_name: 'mud-indexer-reader-serverless'
      }
    });
  }
  
  return database;
}

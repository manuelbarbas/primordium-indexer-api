#!/usr/bin/env node

import "dotenv/config";

import cors from "@koa/cors";
import Router from "@koa/router";
import Koa from "koa";
import bodyParser from "@koa/bodyparser";
import postgres from "postgres";
import { z } from "zod";

import { frontendEnvSchema, parseEnv } from "@bin/parseEnv";
import { apiIndexer } from "@/postgres/routes/api";

const env = parseEnv(
  z.intersection(
    frontendEnvSchema,
    z.object({
      INDEXER_DATABASE_URL: z.string(),
      API_KEY: z.string().min(1),
    }),
  ),
);

const database = postgres(env.INDEXER_DATABASE_URL, { 
  prepare: false,
  connect_timeout: 60, // 60 seconds connection timeout
  idle_timeout: 30, // 30 seconds idle timeout
  max_lifetime: 60 * 60, // 1 hour max connection lifetime
  max: 20, // max connections in pool
  idle_in_transaction_session_timeout: 60000, // 60 seconds in milliseconds
  connection: {
    application_name: 'mud-indexer-reader'
  }
});

const server = new Koa();

server.use(cors());
server.use(bodyParser());
server.use(apiIndexer(database,env.API_KEY));

const router = new Router();

router.get("/", (ctx) => {
  ctx.body = "emit Herld(); ";
});

// k8s healthchecks
router.get("/healthz", (ctx) => {
  ctx.status = 200;
});
router.get("/readyz", (ctx) => {
  ctx.status = 200;
});

server.use(router.routes());
server.use(router.allowedMethods());

server.listen({ host: env.INDEXER_HOST, port: env.INDEXER_PORT });
console.log(`postgres indexer frontend listening on http://${env.INDEXER_HOST}:${env.INDEXER_PORT}`);

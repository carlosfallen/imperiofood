/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type D1Database = import('@cloudflare/workers-types').D1Database;
type R2Bucket = import('@cloudflare/workers-types').R2Bucket;

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    orderOrigin?: {
      type: 'internal' | 'external';
      tableNumber?: number;
      tableId?: string;
    };
  }
}

interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ADMIN_SECRET: string;
  WHATSAPP_PHONE: string;
}
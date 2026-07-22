/**
 * server.js
 *
 * Local development API server.
 * Mounts each file in /api/*.js as an Express route at /api/<name>
 * so that the Vite dev proxy can forward /api/* calls here.
 *
 * Usage:  node server.js   (started automatically via npm run dev:full)
 */

import 'dotenv/config';
import express from 'express';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = 3001;

app.use(express.json());

/* ── Auto-mount every api/*.js handler ── */
const apiDir = path.join(__dirname, 'api');
const files  = readdirSync(apiDir).filter((f) => f.endsWith('.js'));

for (const file of files) {
  const name    = path.basename(file, '.js');          // e.g. "send-otp"
  const route   = `/api/${name}`;
  const fileUrl = pathToFileURL(path.join(apiDir, file)).href;

  // Dynamic import (ESM)
  const mod = await import(fileUrl);
  const handler = mod.default;

  app.all(route, async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`[${route}] Unhandled error:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  console.log(`  ✓ Mounted  ${route}`);
}

app.listen(PORT, () => {
  console.log(`\n🚀 Local API server running at http://localhost:${PORT}\n`);
});

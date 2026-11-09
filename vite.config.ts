import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {generateStockPrediction} from './src/server/geminiService.ts';

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/api/health' && req.method === 'GET') {
          res.statusCode = 200;
          return res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
        }

        if (req.url === '/api/predict' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const forecast = await generateStockPrediction(payload);
              res.statusCode = 200;
              res.end(JSON.stringify(forecast));
            } catch (err: unknown) {
              const errMsg = err instanceof Error ? err.message : String(err);
              console.error('API /api/predict error:', errMsg);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: errMsg }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});


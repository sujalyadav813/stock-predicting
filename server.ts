import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateStockPrediction } from './src/server/geminiService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Server-side Gemini stock prediction endpoint
app.post('/api/predict', async (req, res) => {
  try {
    const forecast = await generateStockPrediction(req.body);
    res.json(forecast);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error generating stock prediction:', message);
    res.status(500).json({ error: message });
  }
});

// Serve frontend static build
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`QuantPulse Production Server listening on http://0.0.0.0:${PORT}`);
});

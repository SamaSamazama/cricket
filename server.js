import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const provider = process.env.PROVIDER || 'cricketdata';

// Dynamically load adapter
let adapter;
if (provider === 'roanuz') {
  adapter = await import('./adapters/roanuz.js');
} else {
  adapter = await import('./adapters/cricketdata.js');
}

let latest = { matches: [] };
const clients = new Set();

app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders();
  res.write(`event: hello\ndata: "connected"\n\n`);
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of clients) c.write(payload);
}

adapter.startStream({
  onUpdate: (data) => { latest = data; broadcast('score', latest); },
  onError: (err) => { broadcast('error', { message: err.message || String(err) }); }
});

app.get('/api/score', (req, res) => res.json(latest));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Live Cricket running on http://localhost:${port}`);
});

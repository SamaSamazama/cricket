// Upgrade to push: implement Roanuz "Match via Push" (WebSocket/Webhook)
// This stub polls as a temporary fallback until credentials + push logic are added.
import fetch from 'node-fetch';

const BASE = 'https://apivX.roanuz.com'; // Check docs for correct base
const KEY = process.env.ROANUZ_API_KEY;
const SECRET = process.env.ROANUZ_API_SECRET;

function normalize(payload) {
  const raw = payload?.matches || payload?.data || [];
  const matches = raw.map(m => {
    const tA = m?.teams?.a?.name || m?.teams?.[0]?.name || 'Team A';
    const tB = m?.teams?.b?.name || m?.teams?.[1]?.name || 'Team B';
    const sA = m?.score?.a || null;
    const sB = m?.score?.b || null;
    const status = m?.status || m?.live?.status || 'Live';
    return {
      id: m.key || m.id,
      team1: tA,
      team2: tB,
      score1: sA?.innings ? `${sA.runs}/${sA.wickets} (${sA.overs})` : '',
      score2: sB?.innings ? `${sB.runs}/${sB.wickets} (${sB.overs})` : '',
      status,
      series: m?.series?.name || '',
      venue: m?.venue?.name || '',
      start_time: m?.start_at || ''
    };
  });
  return { matches };
}

export function startStream({ onUpdate, onError }) {
  if (!KEY || !SECRET) {
    console.warn('ROANUZ credentials missing, adapter idle');
    return () => {};
  }

  async function poll() {
    try {
      const r = await fetch(`${BASE}/matches/live`, {
        headers: { 'X-Api-Key': KEY, 'X-Api-Secret': SECRET }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      onUpdate(normalize(data));
    } catch (e) {
      onError(e);
    }
  }

  // TODO: Replace with WebSocket "Match via Push" for sub-second updates.
  poll();
  const interval = setInterval(poll, 5000);
  return () => clearInterval(interval);
}

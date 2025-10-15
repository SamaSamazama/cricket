import fetch from 'node-fetch';

const API = 'https://api.cricketdata.org'; // Confirm base after signup
const KEY = process.env.CRICKETDATA_API_KEY;

function normalize(payload) {
  const raw = payload?.matches || payload?.data || [];
  const matches = raw.map(m => {
    const tA = m.team1 || m.teams?.[0]?.name || m.teama?.name || m?.teamA || 'Team A';
    const tB = m.team2 || m.teams?.[1]?.name || m.teamb?.name || m?.teamB || 'Team B';
    const sA = m.score1 || m?.score?.[0] || m?.teama?.scores_full || m?.t1s || null;
    const sB = m.score2 || m?.score?.[1] || m?.teamb?.scores_full || m?.t2s || null;
    const status = m.status || m.state || m.live?.status || m?.match_status || 'Live';
    return {
      id: m.id || m.match_id || m.mid || m.key || `${tA}-${tB}-${m.start_time || m.date}`,
      team1: tA,
      team2: tB,
      score1: typeof sA === 'object' ? `${sA.runs}/${sA.wickets} (${sA.overs})` : sA,
      score2: typeof sB === 'object' ? `${sB.runs}/${sB.wickets} (${sB.overs})` : sB,
      status,
      series: m.series || m.series_name || m.tournament || m.title || '',
      venue: m.venue || m.venue_name || '',
      start_time: m.start_time || m.datetime || m.date || ''
    };
  });
  return { matches };
}

export function startStream({ onUpdate, onError }) {
  if (!KEY) console.warn('CRICKETDATA_API_KEY missing');

  async function poll() {
    try {
      const url = `${API}/matches/live?apikey=${encodeURIComponent(KEY)}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      onUpdate(normalize(data));
    } catch (e) {
      onError(e);
    }
  }

  poll();
  const interval = setInterval(poll, 15000); // Adjust per quota
  return () => clearInterval(interval);
}

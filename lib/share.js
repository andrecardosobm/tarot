// Codifica uma tiragem em um token URL-safe (sem servidor).
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(token) {
  const padded = token.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeReading(reading) {
  const compact = {
    s: reading.spreadId,
    q: reading.question || '',
    t: reading.theme,
    d: reading.date,
    c: reading.draw.map((d) => `${d.cardId}${d.reversed ? '!' : ''}`),
  };
  return toBase64Url(JSON.stringify(compact));
}

export function decodeReading(token) {
  try {
    const c = JSON.parse(fromBase64Url(token));
    if (!c || !Array.isArray(c.c)) return null;
    return {
      id: `shared-${c.d}`,
      spreadId: c.s,
      question: c.q,
      theme: c.t,
      date: c.d,
      draw: c.c.map((raw) => ({
        cardId: raw.replace(/!$/, ''),
        reversed: raw.endsWith('!'),
      })),
    };
  } catch {
    return null;
  }
}

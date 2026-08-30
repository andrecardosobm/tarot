const KEY = 'tarot:diario:v1';

export function loadReadings() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReading(reading) {
  if (typeof window === 'undefined') return [];
  const all = loadReadings();
  const next = [reading, ...all.filter((r) => r.id !== reading.id)].slice(0, 200);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* cota cheia ou storage indisponível: a tiragem segue visível na tela */
  }
  return next;
}

export function deleteReading(id) {
  const next = loadReadings().filter((r) => r.id !== id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignora */
  }
  return next;
}

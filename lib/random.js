// Aleatoriedade criptograficamente segura quando disponível, com fallback.
function randomInt(maxExclusive) {
  if (maxExclusive <= 0) return 0;
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
    const buf = new Uint32Array(1);
    let value;
    do {
      cryptoObj.getRandomValues(buf);
      value = buf[0];
    } while (value >= limit); // rejeita o excedente para não enviesar
    return value % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

// Fisher-Yates
export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function coinFlip() {
  return randomInt(2) === 1;
}

export function cut(list) {
  const point = randomInt(list.length - 20) + 10;
  return [...list.slice(point), ...list.slice(0, point)];
}

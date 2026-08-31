/**
 * Importa as ilustrações das 78 cartas para public/cards/<id>.webp
 * e gera o manifesto lib/cardImages.js.
 *
 *   node scripts/import-cards.mjs <pasta-com-as-imagens>
 *
 * Aceita jpg/jpeg/png/gif/webp e vários esquemas de nome usados pelos
 * baralhos Rider-Waite-Smith em domínio público, entre eles o do
 * sacred-texts.com (ar00…ar21, waac, wa02…, cupa, swkn, peki, …), o padrão
 * "wands-05" / "cups-page" e nomes por extenso ("05 of wands").
 *
 * Arquivos que não casarem com nenhuma carta são listados no final em vez de
 * serem adivinhados — melhor deixar de fora do que colocar a carta errada.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { DECK } from '../lib/deck.js';

const SUIT_ALIASES = {
  wands: ['wands', 'wand', 'wa', 'paus', 'bastos', 'batons', 'rods'],
  cups: ['cups', 'cup', 'cu', 'copas', 'coupes'],
  swords: ['swords', 'sword', 'sw', 'espadas', 'epees'],
  pentacles: ['pentacles', 'pentacle', 'pe', 'pent', 'ouros', 'coins', 'discos', 'disks'],
};

const RANK_ALIASES = {
  // 'a' sozinho fica de fora: em "cupa" (cu+pa = Pajem de Copas) ele faria
  // "cup"+"a" ser lido como Ás de Copas.
  ace: ['ace', 'ac', 'as', '01', '1'],
  '2': ['two', '02', '2'],
  '3': ['three', '03', '3'],
  '4': ['four', '04', '4'],
  '5': ['five', '05', '5'],
  '6': ['six', '06', '6'],
  '7': ['seven', '07', '7'],
  '8': ['eight', '08', '8'],
  '9': ['nine', '09', '9'],
  '10': ['ten', '10'],
  page: ['page', 'pa', 'pag', 'valete', 'pajem', 'pagem', 'jack'],
  knight: ['knight', 'kn', 'kni', 'cavaleiro', 'cavalo'],
  queen: ['queen', 'qu', 'que', 'rainha'],
  king: ['king', 'ki', 'kg', 'kin', 'rei'],
};

const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const LARGURA = 500; // suficiente para a carta ampliada, leve o bastante para o Pages

function normalize(name) {
  return path
    .basename(name, path.extname(name))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Descobre a qual carta um nome de arquivo corresponde, ou null. */
export function matchCard(filename) {
  const n = normalize(filename);

  // Naipes primeiro: "10ofpentacles" é um Dez de Ouros, não o Arcano X.
  for (const [suit, suitNames] of Object.entries(SUIT_ALIASES)) {
    for (const s of suitNames) {
      // naipe antes do valor (waac, wands05) ou depois (05ofwands, aceofcups)
      const antes = n.startsWith(s) ? n.slice(s.length) : null;
      const depois = n.endsWith(s) ? n.slice(0, -s.length) : null;
      for (const resto of [antes, depois]) {
        if (resto === null) continue;
        // tira conectores: "aceofcups", "reideouros", "10deouros"
        const limpo = resto.replace(/^(of|de|da|do)/, '').replace(/(of|de|da|do)$/, '');
        for (const [rank, rankNames] of Object.entries(RANK_ALIASES)) {
          if (rankNames.includes(limpo)) return `${suit}-${rank}`;
        }
      }
    }
  }

  // Arcanos maiores: ar00..ar21, major00, trump00, "00-the-fool"
  const major = n.match(/^(?:ar|arcano|major|maior|trump)?(\d{1,2})(?:the[a-z]+)?$/);
  if (major) {
    const num = Number(major[1]);
    if (num >= 0 && num <= 21) return `major-${num}`;
  }
  return null;
}

async function main() {
  const source = process.argv[2];
  if (!source) {
    console.error('Uso: node scripts/import-cards.mjs <pasta-com-as-imagens>');
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), 'public', 'cards');
  await fs.mkdir(outDir, { recursive: true });

  const validIds = new Set(DECK.map((c) => c.id));
  const entries = await fs.readdir(source);
  const matched = new Map();
  const unmatched = [];

  for (const entry of entries) {
    if (!EXTENSIONS.has(path.extname(entry).toLowerCase())) continue;
    const id = matchCard(entry);
    if (!id || !validIds.has(id)) {
      unmatched.push(entry);
      continue;
    }
    if (matched.has(id)) {
      console.warn(`aviso: ${entry} e ${matched.get(id)} apontam para ${id}; mantendo o primeiro`);
      continue;
    }
    matched.set(id, entry);
  }

  for (const [id, entry] of matched) {
    await sharp(path.join(source, entry))
      .resize({ width: LARGURA, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(outDir, `${id}.webp`));
  }

  const ids = [...matched.keys()].sort();
  await fs.writeFile(
    path.join(process.cwd(), 'lib', 'cardImages.js'),
    `// Gerado por scripts/import-cards.mjs — não edite à mão.\n` +
      `// Cartas com ilustração própria em public/cards/<id>.webp.\n` +
      `export const CARD_IMAGES = new Set(${JSON.stringify(ids, null, 2)});\n`
  );

  console.log(`${matched.size} de ${validIds.size} cartas importadas para public/cards/`);
  const faltando = DECK.filter((c) => !matched.has(c.id));
  if (faltando.length) {
    console.log(`sem imagem (seguem com a arte tipográfica): ${faltando.map((c) => c.id).join(', ')}`);
  }
  if (unmatched.length) {
    console.log(`arquivos não reconhecidos: ${unmatched.join(', ')}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}

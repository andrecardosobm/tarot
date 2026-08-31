# Ilustrações das cartas

Cada arquivo aqui é `<id-da-carta>.webp` — os ids são os de `lib/deck.js`
(`major-0`, `wands-ace`, `cups-10`, `swords-queen`, `pentacles-king`, …).

Não coloque arquivos aqui à mão: rode

```bash
node scripts/import-cards.mjs <pasta-com-as-imagens>
```

O script reconhece os esquemas de nome mais comuns dos baralhos
Rider-Waite-Smith em domínio público, converte para WebP e regenera o
manifesto `lib/cardImages.js`. Cartas sem imagem continuam exibindo a arte
tipográfica gerada em `components/CardArt.jsx`, então dá para importar o
baralho aos poucos.

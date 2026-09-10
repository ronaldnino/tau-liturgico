#!/usr/bin/env node
/**
 * Copia src/data/liturgical.js → functions/src/liturgical.js.
 * La Cloud Function necesita isSolemnity/isEasterVigil (y su cálculo de
 * Pascua) para replicar la misma regla litúrgica que el cliente. En vez de
 * mantener una segunda implementación a mano, se copia el archivo tal cual
 * (es JS puro sin imports, 100% portable a Node) antes de cada deploy.
 * Uso: node scripts/sync-functions-shared.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src', 'data', 'liturgical.js');
const dest = path.join(root, 'functions', 'src', 'liturgical.js');

const header = `// Generado automáticamente por scripts/sync-functions-shared.js — no editar a mano.\n// Fuente: src/data/liturgical.js\n\n`;

if (!fs.existsSync(src)) {
  console.error(`✗  No se encontró ${path.relative(root, src)}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, header + fs.readFileSync(src, 'utf8'));
console.log(`✓  ${path.relative(root, src)} → ${path.relative(root, dest)}`);

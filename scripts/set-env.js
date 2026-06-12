#!/usr/bin/env node
/**
 * Cambia el ambiente activo copiando los archivos de configuración correctos.
 * Uso: node scripts/set-env.js [dev|prod]
 */
const fs = require('fs');
const path = require('path');

const env = process.argv[2];
if (!env || !['dev', 'prod'].includes(env)) {
  console.error('Uso: node scripts/set-env.js [dev|prod]');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const configDir = path.join(root, 'config', env);

const copies = [
  [
    path.join(configDir, 'google-services.json'),
    path.join(root, 'android', 'app', 'google-services.json'),
  ],
  [
    path.join(configDir, 'GoogleService-Info.plist'),
    path.join(root, 'ios', 'TauLiturgico', 'GoogleService-Info.plist'),
  ],
  [
    path.join(root, `.env.${env}`),
    path.join(root, '.env'),
  ],
];

let allOk = true;
for (const [src, dest] of copies) {
  if (!fs.existsSync(src)) {
    console.error(`  ✗  Falta: ${path.relative(root, src)}`);
    allOk = false;
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log(`  ✓  ${path.relative(root, src)} → ${path.relative(root, dest)}`);
}

console.log('');
if (allOk) {
  console.log(`✅  Ambiente "${env}" activado.`);
  console.log('    Próximos pasos:');
  console.log('    1. npx react-native start --reset-cache');
  console.log(`    2. npm run ios   (o android) para reconstruir con la config ${env}`);
} else {
  console.log(`⚠️  Faltan archivos en config/${env}/`);
  console.log(`    Coloca google-services.json y GoogleService-Info.plist en esa carpeta.`);
  process.exit(1);
}

/**
 * ROAMLY — Script generazione icone PWA
 *
 * Eseguire UNA SOLA VOLTA in locale per generare i file PNG.
 * L'output viene committato nel repo — Netlify non esegue mai questo script.
 * sharp non è in package.json: installare temporaneamente con:
 *   node --input-type=module -e "import('sharp')" 2>/dev/null || npm install sharp --no-save
 *   node scripts/generate-icons.mjs
 *
 * File generati (tutti in public/icons/):
 *   icon-192.png          → Android homescreen
 *   icon-512.png          → Android splash screen + PWA
 *   icon-maskable-512.png → Android maskable (safe area 80%)
 *   apple-touch-icon.png  → iOS homescreen (180×180)
 */

import { createRequire } from 'module'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')

// Verifica che sharp sia disponibile
let sharp
try {
  const require = createRequire(import.meta.url)
  sharp = require('sharp')
} catch {
  console.error(
    '\n⚠️  sharp non trovato. Installalo temporaneamente:\n' +
    '   npm install sharp --no-save\n' +
    '   node scripts/generate-icons.mjs\n'
  )
  process.exit(1)
}

const svgPath = join(root, 'public', 'favicon.svg')
if (!existsSync(svgPath)) {
  console.error('❌ public/favicon.svg non trovato')
  process.exit(1)
}

const svgBuffer = readFileSync(svgPath)

const icone = [
  { nome: 'icon-192.png',          size: 192, maskable: false },
  { nome: 'icon-512.png',          size: 512, maskable: false },
  { nome: 'apple-touch-icon.png',  size: 180, maskable: false },
  // Maskable: il logo occupa l'80% del safe area — aggiunge padding del 10%
  { nome: 'icon-maskable-512.png', size: 512, maskable: true  },
]

for (const { nome, size, maskable } of icone) {
  const outPath = join(root, 'public', 'icons', nome)

  if (maskable) {
    // Per le maskable icon: logo ridotto al 80% con padding, sfondo #04342C pieno
    const logoSize   = Math.round(size * 0.8)
    const padding    = Math.round(size * 0.1)

    await sharp(svgBuffer)
      .resize(logoSize, logoSize)
      .toBuffer()
      .then((logoBuffer) =>
        sharp({
          create: {
            width:      size,
            height:     size,
            channels:   4,
            background: { r: 4, g: 52, b: 44, alpha: 1 }, // #04342C
          },
        })
          .composite([{ input: logoBuffer, top: padding, left: padding }])
          .png()
          .toFile(outPath)
      )
  } else {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath)
  }

  console.log(`✓ ${nome} (${size}×${size}${maskable ? ', maskable' : ''})`)
}

console.log('\n✅ Icone generate in public/icons/')
console.log('   Committa i file generati nel repository.')

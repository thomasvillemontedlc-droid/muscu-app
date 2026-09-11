// Compresse automatiquement les illustrations d'exercice : toute image
// raster (.png/.jpg/.jpeg) déposée dans public/exercices/ est convertie en
// .webp puis supprimée, sauf si un .webp du même nom existe déjà. Lancé
// automatiquement avant `npm run dev` et `npm run build` (voir les scripts
// "predev"/"prebuild" dans package.json) : rien à faire manuellement en
// déposant de nouveaux fichiers. Les .svg ne sont pas concernés (déjà
// vectoriels, pas de gain à les rastériser).
import { readdir, unlink } from 'node:fs/promises'
import { extname, basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const DIR = fileURLToPath(new URL('../public/exercices/', import.meta.url))
const RASTER_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg'])
const WEBP_QUALITY = 82

async function main() {
  let entries
  try {
    entries = await readdir(DIR)
  } catch {
    return // dossier absent (pas encore d'illustrations) : rien à faire
  }

  const existingWebp = new Set(entries.filter((e) => extname(e).toLowerCase() === '.webp'))
  let converted = 0

  for (const entry of entries) {
    const ext = extname(entry).toLowerCase()
    if (!RASTER_EXTENSIONS.has(ext)) continue

    const webpName = `${basename(entry, ext)}.webp`
    if (existingWebp.has(webpName)) continue // déjà compressé lors d'un passage précédent

    const sourcePath = join(DIR, entry)
    const destPath = join(DIR, webpName)

    await sharp(sourcePath).webp({ quality: WEBP_QUALITY }).toFile(destPath)
    await unlink(sourcePath)
    converted++
    console.log(`[exercices] ${entry} -> ${webpName}`)
  }

  if (converted > 0) console.log(`[exercices] ${converted} image(s) compressée(s) en WebP.`)
}

await main()

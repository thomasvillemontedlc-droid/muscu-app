// Attacher l'élément au DOM avant de cliquer, et ne révoquer l'URL
// qu'après un court délai : sur mobile, cliquer un <a> détaché du DOM ou
// révoquer l'URL trop tôt peut silencieusement empêcher le téléchargement.
export function downloadJson(exportData, filename) {
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function getExportFilename(now = new Date()) {
  return `muscu-export-${now.toISOString().slice(0, 10)}.json`
}

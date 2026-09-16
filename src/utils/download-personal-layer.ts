import { storage } from '@/services/storage'

// Shared by IconRail's export button and MobileNav's drawer export button —
// same personal-layer JSON download, two entry points.
export function downloadPersonalLayer(): void {
  const json = storage.personalLayer.export()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `grill-prep-personal-layer-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Revoking synchronously right after click() is flaky outside Chrome —
  // give the browser a tick to start the download first.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

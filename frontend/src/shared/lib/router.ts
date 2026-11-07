/**
 * Router hash mini untuk kebutuhan navigasi aplikasi (tanpa dependensi baru —
 * daftar dependensi playbook disetujui tidak mencakup react-router).
 *
 * - Rute berbasis hash (#/login) karena aman untuk PWA tanpa konfigurasi server.
 * - Route dengan parameter diurutkan setelah rute statis (matchRoute).
 */
import { useSyncExternalStore } from 'react'

function readHash(): string {
  const raw = window.location.hash.slice(1)
  return raw === '' ? '/' : raw
}

export function navigate(to: string): void {
  if (readHash() === to) return
  window.location.hash = to
}

interface RouteData {
  path: string
  getSnapshot: () => string
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
  }
}

/** Path aktif saat ini; re-render hanya saat hash berubah. */
export function useRouterPath(): string {
  return useSyncExternalStore(subscribe, readHash, readHash)
}

interface RouteConfig {
  /** Contoh statis: "/login"; contoh dinamis: "/bayar/:recordId". */
  path: string
  component: (ctx: { path: string; param?: string }) => React.ReactElement
  /** Bila true, hanya role admin (UI-only; otorisasi tetap di server). */
  adminOnly?: boolean
}

/** Cocokkan "/bayar/123" pada konfigurasi "/bayar/:recordId", atau path statis eksak. */
export function matchRoute(
  routes: readonly RouteConfig[],
  current: string,
): { config: RouteConfig; param?: string } | null {
  for (const config of routes) {
    const staticPart = config.path.split('/:')[0] ?? config.path
    if (config.path.includes('/:')) {
      const param = current.startsWith(staticPart + '/') ? current.slice(staticPart.length + 1) : ''
      if (param.length > 0) return { config, param }
    } else if (config.path === current) {
      return { config }
    }
  }
  return null
}

export type { RouteConfig, RouteData }

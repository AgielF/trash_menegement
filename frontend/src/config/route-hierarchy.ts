export interface RouteHierarchyEntry {
  pattern: string
  destination: string
}

/** Deterministic parent routes; these must never depend on browser history. */
export const ROUTE_HIERARCHY: readonly RouteHierarchyEntry[] = [
  { pattern: '/kasbon/:id', destination: '/rumah' },
  { pattern: '/admin/houses/create', destination: '/admin/houses' },
  { pattern: '/admin/houses/edit/:id', destination: '/admin/houses' },
  { pattern: '/houses/create', destination: '/admin/houses' },
  { pattern: '/houses/edit/:id', destination: '/admin/houses' },
  { pattern: '/admin/houses', destination: '/admin' },
  { pattern: '/admin/import', destination: '/admin/settings' },
  { pattern: '/admin/pending', destination: '/admin/settings' },
  { pattern: '/admin/settings', destination: '/admin' },
  { pattern: '/rumah', destination: '/' },
  { pattern: '/uang', destination: '/' },
]

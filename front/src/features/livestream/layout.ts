// Grid columns for the livestream video grid by total tile count.
export function getGridCols(tiles: number): string {
  if (tiles <= 1) return 'grid-cols-1'
  if (tiles === 2) return 'grid-cols-2'
  return 'grid-cols-2 sm:grid-cols-3'
}

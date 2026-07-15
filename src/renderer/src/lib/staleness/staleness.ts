/** Re-probe Docker when a surface that shows Docker data opens and the cached
 *  info is older than this. `getDockerInfo` caches until forced, so without a
 *  staleness rule the numbers would never move. */
export const DOCKER_STALE_MS = 5 * 60 * 1000

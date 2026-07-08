/** Result of a node_modules delete request. `blocked` is set when the delete
 *  was refused: 'unmounted' (path gone since scan) or 'live' (app running). */
export interface DeleteResult {
  freed: number
  blocked?: 'unmounted' | 'live'
}

/** Result of a batch node_modules delete request. `blockedIds` lists ids skipped
 *  because their project was live; ids whose node_modules had already vanished are
 *  dropped from the store silently (skipped, not counted as blocked). */
export interface DeleteManyResult {
  freed: number
  blockedIds: string[]
}

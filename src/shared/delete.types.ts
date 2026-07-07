/** Result of a node_modules delete request. `blocked` is set when the delete
 *  was refused: 'unmounted' (path gone since scan) or 'live' (app running). */
export interface DeleteResult {
  freed: number
  blocked?: 'unmounted' | 'live'
}

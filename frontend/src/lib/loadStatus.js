// Finite state machine helpers for task loading lifecycle.
/**
 * @typedef {'idle'|'loading'|'ready'|'empty'|'error'} LoadStatus
 * @typedef {Object} ViewState
 * @property {LoadStatus} status
 * @property {string|null|undefined} error
 * @property {string|null|undefined} lastLoadedAt
 * @property {boolean} isReady
 * @property {boolean} isEmpty
 * @property {boolean} isLoading
 * @property {boolean} isError
 */

/**
 * Compute effective status given base status and task count.
 * If base is 'ready' but zero tasks => 'empty'.
 * @param {number} tasksCount
 * @param {LoadStatus} base
 * @returns {LoadStatus}
 */
export function computeStatus(tasksCount, base){
  if (base === 'ready') return tasksCount === 0 ? 'empty' : 'ready';
  return base;
}

/**
 * Derive full view state with convenience flags.
 * @param {LoadStatus} base
 * @param {number} tasksCount
 * @param {string|null} [error]
 * @returns {ViewState}
 */
export function deriveViewState(base, tasksCount, error){
  const status = computeStatus(tasksCount, base);
  return {
    status,
    error: error || null,
    lastLoadedAt: (status === 'ready' || status === 'empty') ? new Date().toISOString() : null,
    isReady: status === 'ready',
    isEmpty: status === 'empty',
    isLoading: status === 'loading',
    isError: status === 'error'
  };
}

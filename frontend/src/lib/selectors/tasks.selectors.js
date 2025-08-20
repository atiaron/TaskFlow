// Memoized task selectors using a lightweight createSelector implementation.
// If 'reselect' is later added as dependency, swap createSelector import.

import { indexTasks } from '../taskIndex';
import { sortTasks } from '../sortTasks';
import { getTasksForView } from '../views';

// Minimal createSelector (arity 2+) fallback
function createSelector(inputs, resultFunc){
  let lastArgs = null; let lastResult;
  return function(){
    const args = Array.from(arguments);
    const inputValues = inputs.map(fn => fn.apply(null, args));
    if (lastArgs && inputValues.every((v,i)=> v === lastArgs[i])) return lastResult;
    lastArgs = inputValues;
    lastResult = resultFunc.apply(null, inputValues);
    return lastResult;
  };
}

export const selectAll = tasks => tasks;

export const selectIndexed = createSelector([selectAll], (tasks)=> indexTasks(tasks));

export const selectActive = createSelector([selectIndexed], (idx)=> idx.activeIds.map(id => idx.byId.get(id)) );
export const selectStarredActive = createSelector([selectIndexed], (idx)=> idx.starredActiveIds.map(id => idx.byId.get(id)) );
export const selectCompleted = createSelector([selectIndexed], (idx)=> idx.completedIds.map(id => idx.byId.get(id)) );

export const selectTasksForView = createSelector([
  selectAll,
  (_tasks, view) => view
], (tasks, view) => getTasksForView(tasks, view));

export const selectSortedForView = createSelector([
  selectTasksForView
], (arr) => sortTasks(arr));

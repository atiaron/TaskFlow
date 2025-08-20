// Soft migration shim – re-export new normalized meta API.
// Keep this file until all imports switch to selectTaskMeta directly.
export { selectTaskMeta as deriveTaskMeta, selectTaskMeta, deriveUrgency, derivePriority } from './taskMeta';

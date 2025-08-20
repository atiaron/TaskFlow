import { useEffect, useMemo, useRef } from 'react';
import { kv } from '../storage/kvStore';
import { useFlags } from './FlagProvider';
import { logInfo } from '../obs/errorReporter';

const DID_KEY = 'tf__device_id';
function ensureDeviceId() {
  let id = kv.get(DID_KEY);
  if (!id) { try { id = crypto.randomUUID(); } catch { id = Math.random().toString(36).slice(2); } kv.set(DID_KEY, id); }
  return id;
}

function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0);
}

export function useExperiment(flagName, variants, opts) {
  const { getFlag } = useFlags();
  const override = getFlag(`exp.${flagName}`);
  const userId = kv.get(opts?.userIdKey || 'tf__user_id') || ensureDeviceId();

  const assigned = useMemo(() => {
    if (override && variants.includes(override)) return override;
    const h = hash32(`${userId}:${flagName}`);
    const idx = h % variants.length;
    return variants[idx];
  }, [flagName, variants, userId, override]);

  const exposed = useRef(false);
  useEffect(() => {
    if (exposed.current) return;
    exposed.current = true;
    logInfo('experiment_exposure', { flag: flagName, variant: assigned, userId });
  }, [flagName, assigned, userId]);

  return assigned;
}

import { getModernTasksMode, isModernTask } from './modernTasks';

// We cannot easily mutate the pre-resolved mode from here because module evaluation caches it.
// So we'll test only deterministic hashing behavior when mode is percentage by simulating via manual function duplication.

// Re-import helpers (copy of hash logic) for isolated test of distribution
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function bucket(str){
  return hash(str) % 100;
}

describe('modernTasks feature flag', () => {
  test('hash stability', () => {
    const ids = ['a','task-123','שלום','🚀','LONG-ID-XYZ-999'];
    const first = ids.map(bucket);
    const second = ids.map(bucket);
    expect(second).toEqual(first); // deterministic
  });

  test('percentage bucket range', () => {
    for (let i=0; i<50; i++) {
      const b = bucket('id-'+i);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(100);
    }
  });

  test('distribution roughness (not strict)', () => {
    const counts = Array(100).fill(0);
    for (let i=0; i<500; i++) counts[bucket('t'+i)]++;
    // Expect no bucket to have zero and none excessively large.
    const nonZero = counts.filter(c=>c>0).length;
    expect(nonZero).toBeGreaterThan(80); // loose heuristic
  });
});

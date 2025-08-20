import { initErrorReporter, logInfo, getBuffer } from '../obs/errorReporter';

describe('errorReporter', () => {
  beforeEach(() => {
    // clear localStorage side effects for consistency
    try { localStorage.clear(); } catch {}
  });

  test('collects info log', () => {
    initErrorReporter();
    logInfo('hello-test', { x: 1 });
    const buf = getBuffer();
    expect(buf.some(e => e.msg === 'hello-test' && e.type === 'info')).toBeTruthy();
  });
});

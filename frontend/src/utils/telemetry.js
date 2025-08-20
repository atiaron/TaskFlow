// Minimal telemetry utility (can be swapped later)
// Usage: telemetry.event('modern_task_row_render', { modern: true })

const QUEUE = [];
let flushScheduled = false;

function scheduleFlush(){
  if (flushScheduled) return;
  flushScheduled = true;
  setTimeout(()=> {
    // eslint-disable-next-line no-console
    console.info('[telemetry batch]', QUEUE.splice(0, QUEUE.length));
    flushScheduled = false;
  }, 1500);
}

export const telemetry = {
  event(name, data){
    QUEUE.push({ name, data, ts: Date.now() });
    if (QUEUE.length >= 20) {
      // immediate flush threshold
      // eslint-disable-next-line no-console
      console.info('[telemetry batch]', QUEUE.splice(0, QUEUE.length));
      flushScheduled = false;
      return;
    }
    scheduleFlush();
  }
};

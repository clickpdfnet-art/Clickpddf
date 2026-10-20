import test from 'node:test';
import assert from 'node:assert/strict';
import { startDownloadCountdown, DownloadRequestGate } from './downloadCountdown.ts';

test('near-simultaneous manual and automatic requests issue only once per file', () => {
  const gate = new DownloadRequestGate();
  assert.equal(gate.claim('first', 5000), true);
  assert.equal(gate.claim('first', 5001), false);
  assert.equal(gate.claim('second', 5001), true);
  assert.equal(gate.claim('first', 6500), true); // Explicit later retry remains available.
  gate.clear();
  assert.equal(gate.claim('first', 6501), true); // A new processing run is independent.
});

test('counts 5 to 1, then requests exactly one download at five seconds', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const ticks: number[] = [];
  let downloads = 0;
  startDownloadCountdown((s) => ticks.push(s), () => { downloads++; });
  for (let i = 0; i < 4; i++) t.mock.timers.tick(1000);
  assert.deepEqual(ticks, [5, 4, 3, 2, 1]);
  assert.equal(downloads, 0);
  t.mock.timers.tick(1000);
  assert.equal(downloads, 1);
  t.mock.timers.tick(10000);
  assert.equal(downloads, 1);
});

test('manual download, clear or unmount cancellation prevents a later duplicate', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let downloads = 0;
  const cancel = startDownloadCountdown(() => {}, () => { downloads++; });
  t.mock.timers.tick(2000);
  cancel();
  cancel();
  t.mock.timers.tick(10000);
  assert.equal(downloads, 0);
});

test('batch files have independent countdowns without cancelling their neighbors', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const downloaded: string[] = [];
  startDownloadCountdown(() => {}, () => downloaded.push('first'));
  t.mock.timers.tick(2000);
  const cancelSecond = startDownloadCountdown(() => {}, () => downloaded.push('second'));
  startDownloadCountdown(() => {}, () => downloaded.push('third'));
  cancelSecond();
  for (let i = 0; i < 3; i++) t.mock.timers.tick(1000);
  assert.deepEqual(downloaded, ['first']);
  for (let i = 0; i < 2; i++) t.mock.timers.tick(1000);
  assert.deepEqual(downloaded, ['first', 'third']);
});

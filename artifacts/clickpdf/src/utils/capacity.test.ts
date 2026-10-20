import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { validateFileBatch, validateFileSafety } from './securitySanitizer.ts';
import { OutputArchive } from './outputArchive.ts';
import { auditMemoryPressure, executeConcurrentBatch } from './memoryManager.ts';

// Admission tests deliberately use file metadata, not gigabyte allocations.
// These prove that selection has no arbitrary cap, NOT that every device can
// successfully parse/process a 1 GB PDF.
const file = (name: string, mb: number, type = 'application/pdf') =>
  ({ name, size: mb * 1024 * 1024, type, lastModified: 1 }) as File;

test('50, 100, 200, 500, 600 and 1000 MB PDFs are admitted without a size cap', () => {
  for (const mb of [50, 100, 200, 500, 600, 1000]) {
    assert.equal(validateFileSafety(file(`${mb}.pdf`, mb)).valid, true);
  }
});

test('20 files at once and a further 20 preserve all 40 selections', () => {
  const selected = Array.from({ length: 20 }, (_, i) => file(`${i}.pdf`, 2));
  const first = validateFileBatch(selected);
  const second = validateFileBatch(selected, 'pdf', first.validFiles);
  assert.equal(first.validFiles.length, 20);
  assert.equal(second.validFiles.length, 20);
  assert.equal(second.totalSizeBytes, 80 * 1024 * 1024);
});

test('batch admission permits more than 1 GB and more than 100 files', () => {
  const result = validateFileBatch(Array.from({ length: 150 }, () => file('same.pdf', 1000)));
  assert.equal(result.validFiles.length, 150);
  assert.equal(result.errors.length, 0);
});

test('image, Word, Excel, and PowerPoint batch selections use the same uncapped validator', () => {
  for (const [extension, type] of [
    ['png', 'image'], ['docx', 'word'], ['xlsx', 'excel'], ['pptx', 'powerpoint'],
  ] as const) {
    const input = Array.from({ length: 25 }, (_, i) => file(`${i}.${extension}`, 1000, ''));
    assert.equal(validateFileBatch(input, type).validFiles.length, 25);
  }
});

test('empty and unsupported files are rejected without dropping valid neighbors', () => {
  const result = validateFileBatch([file('empty.pdf', 0), file('image.png', 1, 'image/png'), file('valid.pdf', 1)]);
  assert.equal(result.validFiles.length, 1);
  assert.equal(result.errors.length, 2);
});

test('extreme-size audit is advisory and recommends serial processing', () => {
  const audit = auditMemoryPressure([file('large.pdf', 1000), file('other.pdf', 1000)]);
  assert.equal(audit.isSafe, true);
  assert.equal(audit.recommendedConcurrency, 1);
  assert.match(audit.warning || '', /capacity/);
});

test('every duplicate output name survives ZIP packaging, including within folders', async () => {
  const archive = new OutputArchive();
  const folder = archive.folder('documents');
  for (let i = 0; i < 20; i++) folder.file('same.pdf', new Uint8Array([i]));
  const data = await archive.generateAsync({ type: 'uint8array' });
  const zip = await JSZip.loadAsync(data);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  assert.equal(entries.length, 20);
  const values = await Promise.all(entries.map(async (entry) => (await entry.async('uint8array'))[0]));
  assert.deepEqual(values.sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => i));
});

test('case-insensitive ZIP collisions and unsafe path components are handled', async () => {
  const archive = new OutputArchive();
  archive.file('../../same.pdf', 'one');
  archive.file('SAME.pdf', 'two');
  const zip = await JSZip.loadAsync(await archive.generateAsync({ type: 'uint8array' }));
  const names = Object.values(zip.files).filter((entry) => !entry.dir).map((entry) => entry.name);
  assert.equal(names.length, 2);
  assert.ok(names.every((name) => !name.includes('..')));
  assert.equal(new Set(names.map((name) => name.toLowerCase())).size, 2);
});

test('serial batches retain 19 successes and identify one failure without stopping', async () => {
  let active = 0;
  let peak = 0;
  const result = await executeConcurrentBatch({
    items: Array.from({ length: 20 }, (_, i) => i),
    concurrency: 1,
    yieldIntervalMs: 0,
    worker: async (item) => {
      active++;
      peak = Math.max(peak, active);
      try {
        if (item === 4) throw new Error('Unreadable fixture');
        return item;
      } finally { active--; }
    },
  });
  assert.equal(peak, 1);
  assert.equal(result.successes.length, 19);
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].index, 4);
});

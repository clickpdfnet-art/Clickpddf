import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PdfBackgroundCancelledError, runPdfBackground } from '../src/utils/pdfBackground.ts';

const originalWorkerDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Worker');

function installWorker(WorkerConstructor) {
  Object.defineProperty(globalThis, 'Worker', {
    configurable: true,
    writable: true,
    value: WorkerConstructor,
  });
}

function makeControlledWorker() {
  const instances = [];

  class ControlledWorker {
    constructor(url, options) {
      this.url = url;
      this.options = options;
      this.postedMessages = [];
      this.terminationCount = 0;
      instances.push(this);
    }

    postMessage(message) {
      this.postedMessages.push(message);
    }

    terminate() {
      this.terminationCount += 1;
    }
  }

  installWorker(ControlledWorker);
  return instances;
}

after(() => {
  if (originalWorkerDescriptor) {
    Object.defineProperty(globalThis, 'Worker', originalWorkerDescriptor);
  } else {
    delete globalThis.Worker;
  }
});

test('constructor failure rejects cleanly without a worker to terminate', async () => {
  const expectedError = new Error('worker constructor blocked');
  installWorker(class {
    constructor() {
      throw expectedError;
    }
  });

  await assert.rejects(
    runPdfBackground('merge', []),
    (error) => error === expectedError,
  );
});

test('worker error event rejects with the Merge message and terminates once', async () => {
  const instances = makeControlledWorker();
  const pending = runPdfBackground('merge', []);
  const worker = instances[0];
  let preventedDefault = false;

  worker.onerror({
    preventDefault() {
      preventedDefault = true;
    },
    message: 'worker script failed',
  });

  await assert.rejects(
    pending,
    {
      message: 'The selected PDFs could not be combined in the background. Your files are still available; check that each PDF is readable and try again.',
    },
  );
  assert.equal(preventedDefault, true);
  assert.equal(worker.terminationCount, 1);
});

test('messageerror rejects with the existing message and terminates once', async () => {
  const instances = makeControlledWorker();
  const pending = runPdfBackground('merge', []);
  const worker = instances[0];

  worker.onmessageerror();

  await assert.rejects(
    pending,
    { message: 'Could not receive background PDF output. Your selected files have been kept.' },
  );
  assert.equal(worker.terminationCount, 1);
});

test('worker operation error rejects with its message and terminates once', async () => {
  const instances = makeControlledWorker();
  const pending = runPdfBackground('merge', []);
  const worker = instances[0];

  worker.onmessage({ data: { type: 'error', message: 'fixture operation failed' } });

  await assert.rejects(pending, { message: 'fixture operation failed' });
  assert.equal(worker.terminationCount, 1);
});

test('successful result resolves with the output and terminates once', async () => {
  const instances = makeControlledWorker();
  const expectedResult = new Uint8Array([7, 8, 9]);
  const pending = runPdfBackground('merge', []);
  const worker = instances[0];

  worker.onmessage({ data: { type: 'result', data: expectedResult } });

  assert.deepEqual(await pending, expectedResult);
  assert.equal(worker.terminationCount, 1);
});

test('progress does not settle the operation before the final result', async () => {
  const instances = makeControlledWorker();
  const progress = [];
  let settled = false;
  const pending = runPdfBackground('merge', [], (current, total) => {
    progress.push([current, total]);
  });
  pending.then(
    () => { settled = true; },
    () => { settled = true; },
  );
  const worker = instances[0];

  worker.onmessage({ data: { type: 'progress', current: 1, total: 2 } });
  assert.deepEqual(progress, [[1, 2]]);
  assert.equal(settled, false);
  assert.equal(worker.terminationCount, 0);

  const expectedResult = new Uint8Array([3, 4]);
  worker.onmessage({ data: { type: 'result', data: expectedResult } });

  assert.deepEqual(await pending, expectedResult);
  await Promise.resolve();
  assert.equal(settled, true);
  assert.equal(worker.terminationCount, 1);
});

test('an already-aborted signal rejects before constructing a Worker', async () => {
  let constructorCalls = 0;
  installWorker(class {
    constructor() {
      constructorCalls += 1;
    }
  });
  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    runPdfBackground('merge', [], undefined, undefined, controller.signal),
    (error) => error instanceof PdfBackgroundCancelledError && error.name === 'AbortError',
  );
  assert.equal(constructorCalls, 0);
});

test('cancelling active work rejects once and terminates once despite repeated abort', async () => {
  const instances = makeControlledWorker();
  const controller = new AbortController();
  const pending = runPdfBackground('merge', [], undefined, undefined, controller.signal);
  const worker = instances[0];

  controller.abort();
  controller.abort();

  await assert.rejects(
    pending,
    (error) => error instanceof PdfBackgroundCancelledError && error.name === 'AbortError',
  );
  assert.equal(worker.terminationCount, 1);
  assert.equal(worker.onmessage, null);
  assert.equal(worker.onerror, null);
  assert.equal(worker.onmessageerror, null);
});

test('late result after cancellation cannot settle or update progress again', async () => {
  const instances = makeControlledWorker();
  const controller = new AbortController();
  const progress = [];
  const pending = runPdfBackground('merge', [], (current, total) => progress.push([current, total]), undefined, controller.signal);
  const worker = instances[0];
  const lateMessage = worker.onmessage;

  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  lateMessage({ data: { type: 'progress', current: 1, total: 1 } });
  lateMessage({ data: { type: 'result', data: new Uint8Array([1]) } });

  assert.deepEqual(progress, []);
  assert.equal(worker.terminationCount, 1);
});

test('late error after cancellation is ignored and does not terminate twice', async () => {
  const instances = makeControlledWorker();
  const controller = new AbortController();
  const pending = runPdfBackground('merge', [], undefined, undefined, controller.signal);
  const worker = instances[0];
  const lateError = worker.onerror;

  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  lateError({ preventDefault() {}, message: 'late worker error' });

  assert.equal(worker.terminationCount, 1);
});

test('postMessage failure rejects and terminates the created Worker exactly once', async () => {
  let worker;
  class ThrowingWorker {
    constructor() {
      this.terminationCount = 0;
      worker = this;
    }

    postMessage() {
      throw new Error('postMessage failed');
    }

    terminate() {
      this.terminationCount += 1;
    }
  }
  installWorker(ThrowingWorker);

  await assert.rejects(runPdfBackground('merge', []), { message: 'postMessage failed' });
  assert.equal(worker.terminationCount, 1);
});

test('a retry posts the same selected file objects in the original order', async () => {
  const instances = makeControlledWorker();
  const selectedFiles = [{ name: 'first.pdf' }, { name: 'second.pdf' }];
  const controller = new AbortController();
  const cancelled = runPdfBackground('merge', selectedFiles, undefined, undefined, controller.signal);
  controller.abort();
  await assert.rejects(cancelled, { name: 'AbortError' });

  const retry = runPdfBackground('merge', selectedFiles);
  const retryWorker = instances[1];
  assert.equal(retryWorker.postedMessages[0].files, selectedFiles);
  assert.deepEqual(retryWorker.postedMessages[0].files.map((file) => file.name), ['first.pdf', 'second.pdf']);

  retryWorker.onmessage({ data: { type: 'result', data: new Uint8Array([2]) } });
  assert.deepEqual(await retry, new Uint8Array([2]));
  assert.equal(instances[0].terminationCount, 1);
  assert.equal(retryWorker.terminationCount, 1);
});

test('Merge component wires accessible cancellation and unmount stale-state guards', () => {
  const source = readFileSync(new URL('../src/components/ToolWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /data-testid="button-cancel-merge"/);
  assert.match(source, /aria-label=\{t\.cancelMergeBtn\}/);
  assert.match(source, /componentMountedRef\.current = false;[\s\S]*mergeAbortControllerRef\.current\?\.abort\(\);/);
  assert.match(source, /componentMountedRef\.current && mergeAttemptId === mergeOperationIdRef\.current/);
  assert.match(source, /mergeAbortControllerRef\.current = null;/);
});

test('Merge cancellation copy is explicit for all 21 supported locales', () => {
  const source = readFileSync(new URL('../src/i18n/translations.ts', import.meta.url), 'utf8');
  const locales = ['en', 'ja', 'ur', 'de', 'hi', 'ar', 'zh', 'tl', 'es', 'it', 'no', 'pt', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'fr'];
  const readValue = (locale, key) => {
    const start = source.indexOf(`const ${locale}: TranslationDict = {`);
    assert.notEqual(start, -1, `Missing locale object: ${locale}`);
    const end = source.indexOf('\n};', start);
    assert.notEqual(end, -1, `Could not find end of locale object: ${locale}`);
    const block = source.slice(start, end);
    const match = block.match(new RegExp(`\\b${key}:\\s*'([^']+)'`));
    assert.ok(match, `Missing ${key} in locale ${locale}`);
    return match[1];
  };

  assert.equal(locales.length, 21);
  for (const locale of locales) {
    for (const key of ['cancelMergeBtn', 'mergeCancelledMessage']) {
      const value = readValue(locale, key);
      assert.ok(value.trim(), `${locale}.${key} must not be empty`);
      if (locale !== 'en') assert.notEqual(value, readValue('en', key), `${locale}.${key} must not fall back to English`);
    }
  }
});

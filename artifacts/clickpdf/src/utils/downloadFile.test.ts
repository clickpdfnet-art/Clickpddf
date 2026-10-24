import test from 'node:test';
import assert from 'node:assert/strict';
import { downloadFile } from './downloadFile.ts';

type FakeAnchor = HTMLAnchorElement & { clickCount: number };

function installDownloadMocks() {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const previousRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  const anchors: FakeAnchor[] = [];
  const createdBlobs: Blob[] = [];
  const revokedUrls: string[] = [];
  const scheduled: Array<{ callback: TimerHandler; delay: number }> = [];
  let nextUrl = 0;

  const body = {
    appendChild(node: FakeAnchor) {
      anchors.push(node);
      Object.defineProperty(node, 'parentNode', { configurable: true, value: body });
      return node;
    },
    removeChild(node: FakeAnchor) {
      const index = anchors.indexOf(node);
      if (index >= 0) anchors.splice(index, 1);
      Object.defineProperty(node, 'parentNode', { configurable: true, value: null });
      return node;
    },
  };

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      body,
      createElement: () => {
        const anchor = {
          style: {},
          clickCount: 0,
          click() { this.clickCount += 1; },
          setAttribute() {},
        } as unknown as FakeAnchor;
        return anchor;
      },
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      setTimeout(callback: TimerHandler, delay: number) {
        scheduled.push({ callback, delay });
        return scheduled.length;
      },
    },
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value(blob: Blob) {
      createdBlobs.push(blob);
      nextUrl += 1;
      return `blob:test-${nextUrl}`;
    },
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value(url: string) { revokedUrls.push(url); },
  });

  return {
    anchors,
    body,
    createdBlobs,
    revokedUrls,
    scheduled,
    restore() {
      if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
      else delete (globalThis as { document?: Document }).document;
      if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
      else delete (globalThis as { window?: Window }).window;
      if (previousCreateObjectURL) Object.defineProperty(URL, 'createObjectURL', previousCreateObjectURL);
      else delete (URL as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL;
      if (previousRevokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', previousRevokeObjectURL);
      else delete (URL as { revokeObjectURL?: typeof URL.revokeObjectURL }).revokeObjectURL;
    },
  };
}

test('each download creates a new attached anchor and object URL from fresh Blob data', () => {
  const mocks = installDownloadMocks();
  try {
    assert.equal(downloadFile(new Uint8Array([1, 2, 3]), 'report.pdf'), true);
    assert.equal(downloadFile(new Uint8Array([4, 5, 6]), 'report.pdf'), true);

    assert.equal(mocks.anchors.length, 2);
    assert.notEqual(mocks.anchors[0].href, mocks.anchors[1].href);
    assert.notEqual(mocks.createdBlobs[0], mocks.createdBlobs[1]);
    assert.equal(mocks.anchors[0].parentNode, mocks.body);
    assert.equal(mocks.anchors[0].clickCount, 1);
    assert.equal(mocks.anchors[0].download, 'report.pdf');
    assert.equal(mocks.anchors[0].type, 'application/pdf');
    assert.deepEqual(mocks.revokedUrls, []);
  } finally {
    mocks.restore();
  }
});

test('download URL and DOM anchor are retained for at least 60 seconds', () => {
  const mocks = installDownloadMocks();
  try {
    downloadFile(new Uint8Array([7, 8]), 'archive.zip');
    assert.equal(mocks.scheduled.length, 1);
    assert.ok(mocks.scheduled[0].delay >= 60_000);
    assert.deepEqual(mocks.revokedUrls, []);

    const cleanup = mocks.scheduled[0].callback as () => void;
    cleanup();
    assert.deepEqual(mocks.revokedUrls, ['blob:test-1']);
    assert.equal(mocks.anchors.length, 0);
  } finally {
    mocks.restore();
  }
});

test('MIME types are inferred for common tool outputs', () => {
  const mocks = installDownloadMocks();
  try {
    downloadFile(new Uint8Array([1]), 'notes.md');
    downloadFile(new Uint8Array([1]), 'table.csv');
    downloadFile(new Uint8Array([1]), 'secure_vault.html');
    assert.deepEqual(mocks.createdBlobs.map(blob => blob.type), [
      'text/markdown;charset=utf-8',
      'text/csv;charset=utf-8',
      'text/html;charset=utf-8',
    ]);
  } finally {
    mocks.restore();
  }
});

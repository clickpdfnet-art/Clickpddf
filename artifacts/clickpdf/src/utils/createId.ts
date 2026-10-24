let fallbackCounter = 0;

function createFallbackId(): string {
  fallbackCounter = (fallbackCounter + 1) % Number.MAX_SAFE_INTEGER;
  const randomPart = () =>
    Math.floor(Math.random() * 0x1_0000_0000)
      .toString(16)
      .padStart(8, '0');

  return `${Date.now().toString(36)}-${fallbackCounter.toString(36)}-${randomPart()}-${randomPart()}`;
}

function createUuidFromRandomValues(cryptoApi: Crypto): string | undefined {
  if (typeof cryptoApi.getRandomValues !== 'function') return undefined;

  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Creates an ID on both modern secure contexts and browsers that lack randomUUID.
 * The last-resort fallback is intentionally non-cryptographic; these IDs are
 * only used for local UI keys and temporary browser file names.
 */
export function createId(prefix?: string): string {
  let id: string | undefined;
  let cryptoApi: Crypto | undefined;

  try {
    cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
    if (typeof cryptoApi?.randomUUID === 'function') {
      id = cryptoApi.randomUUID.call(cryptoApi);
    }
  } catch {
    // Older browsers and restricted contexts may expose but reject randomUUID.
  }

  if (!id && cryptoApi) {
    try {
      id = createUuidFromRandomValues(cryptoApi);
    } catch {
      // Fall through to the timestamp + counter + Math.random implementation.
    }
  }

  id ||= createFallbackId();
  return prefix ? `${prefix}-${id}` : id;
}

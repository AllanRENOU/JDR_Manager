/** Fonctions `URL.createObjectURL` / `revokeObjectURL` simulées (absentes de jsdom). */
export interface ObjectUrlStubs {
  createObjectURL: ReturnType<typeof vi.fn<(blob: Blob) => string>>;
  revokeObjectURL: ReturnType<typeof vi.fn<(url: string) => void>>;
}

/**
 * Installe des versions simulées de `URL.createObjectURL` et `URL.revokeObjectURL` pendant
 * chaque test du bloc courant, puis les retire.
 */
export function stubObjectUrls(): ObjectUrlStubs {
  const stubs: ObjectUrlStubs = {
    createObjectURL: vi.fn<(blob: Blob) => string>(),
    revokeObjectURL: vi.fn<(url: string) => void>(),
  };
  const target = URL as unknown as Record<string, unknown>;
  const original = { create: target['createObjectURL'], revoke: target['revokeObjectURL'] };

  beforeEach(() => {
    let counter = 0;
    stubs.createObjectURL.mockReset().mockImplementation(() => `blob:test/${++counter}`);
    stubs.revokeObjectURL.mockReset();
    target['createObjectURL'] = stubs.createObjectURL;
    target['revokeObjectURL'] = stubs.revokeObjectURL;
  });

  afterEach(() => {
    target['createObjectURL'] = original.create;
    target['revokeObjectURL'] = original.revoke;
  });

  return stubs;
}

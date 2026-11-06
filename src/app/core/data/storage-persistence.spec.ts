import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { StoragePersistence } from './storage-persistence';

describe('StoragePersistence', () => {
  function setup(storage: Partial<StorageManager> | undefined): StoragePersistence {
    const document = { defaultView: { navigator: { storage } } } as unknown as Document;
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: document }] });
    return TestBed.inject(StoragePersistence);
  }

  it('demande le stockage persistant s’il ne l’est pas encore', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    const service = setup({ persisted: vi.fn().mockResolvedValue(false), persist });
    expect(await service.request()).toBe(true);
    expect(persist).toHaveBeenCalledOnce();
    expect(service.persisted()).toBe(true);
  });

  it('ne redemande pas si le stockage est déjà persistant', async () => {
    const persist = vi.fn();
    const service = setup({ persisted: vi.fn().mockResolvedValue(true), persist });
    expect(await service.request()).toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  it('enregistre un refus du navigateur', async () => {
    const service = setup({
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(false),
    });
    expect(await service.request()).toBe(false);
    expect(service.persisted()).toBe(false);
  });

  it('ne fait rien si l’API est absente ou en erreur', async () => {
    expect(await setup(undefined).request()).toBeNull();
    TestBed.resetTestingModule();
    const failing = setup({
      persisted: vi.fn().mockRejectedValue(new Error('interdit')),
      persist: vi.fn(),
    });
    expect(await failing.request()).toBeNull();
    expect(failing.persisted()).toBeNull();
  });
});

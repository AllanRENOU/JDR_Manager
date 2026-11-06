import { ApplicationRef, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DATA_REPOSITORY, DataRepository } from '../data/data-repository';
import { DataError } from '../data/data-error';
import { Id } from '../models';
import { stubObjectUrls } from '../../../testing/object-url';
import { MediaUrls } from './media-urls';

describe('MediaUrls', () => {
  const { revokeObjectURL } = stubObjectUrls();
  let service: MediaUrls;
  let getMediaUrl: ReturnType<typeof vi.fn<(id: Id) => Promise<string>>>;
  let created = 0;

  beforeEach(() => {
    created = 0;
    getMediaUrl = vi.fn((id: Id) =>
      id === 'absent'
        ? Promise.reject(new DataError('media-not-found', id))
        : Promise.resolve(`blob:test/${id}/${++created}`),
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: DATA_REPOSITORY, useValue: { getMediaUrl } as Partial<DataRepository> },
      ],
    });
    service = TestBed.inject(MediaUrls);
  });

  /** Laisse les promesses en attente se terminer. */
  const flush = () => new Promise((resolve) => setTimeout(resolve));

  it('crée l’URL au premier usage puis la partage', async () => {
    const first = await service.acquire('m1');
    const second = await service.acquire('m1');
    expect(first).toBe('blob:test/m1/1');
    expect(second).toBe(first);
    expect(getMediaUrl).toHaveBeenCalledTimes(1);
    expect(service.usageCount('m1')).toBe(2);
  });

  it('ne révoque l’URL qu’à la dernière libération', async () => {
    const url = await service.acquire('m1');
    await service.acquire('m1');

    service.release('m1');
    await flush();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    service.release('m1');
    await flush();
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith(url);
    expect(service.usageCount('m1')).toBe(0);

    // Un nouvel usage recrée une URL.
    expect(await service.acquire('m1')).toBe('blob:test/m1/2');
  });

  it('ne révoque pas une URL distante', async () => {
    getMediaUrl.mockResolvedValueOnce('https://api.exemple/media/m1');
    await service.acquire('m1');
    service.release('m1');
    await flush();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it('ignore une libération en trop', () => {
    expect(() => service.release('inconnu')).not.toThrow();
  });

  it('oublie un média introuvable pour permettre un nouvel essai', async () => {
    await expect(service.acquire('absent')).rejects.toBeInstanceOf(DataError);
    await flush();
    expect(service.usageCount('absent')).toBe(0);
    await expect(service.acquire('absent')).rejects.toBeInstanceOf(DataError);
    expect(getMediaUrl).toHaveBeenCalledTimes(2);
  });

  describe('track', () => {
    it('suit l’id réactif, libère l’ancien média et tout libère à la destruction', async () => {
      const injector = Injector.create({ providers: [], parent: TestBed.inject(Injector) });
      const mediaId = signal<Id | null>('m1');
      const ref = service.track(mediaId, injector);
      const appRef = TestBed.inject(ApplicationRef);

      appRef.tick();
      await flush();
      expect(ref.url()).toBe('blob:test/m1/1');
      expect(ref.missing()).toBe(false);

      mediaId.set('m2');
      appRef.tick();
      await flush();
      expect(ref.url()).toBe('blob:test/m2/2');
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test/m1/1');

      mediaId.set('absent');
      appRef.tick();
      await flush();
      expect(ref.url()).toBeNull();
      expect(ref.missing()).toBe(true);

      mediaId.set('m2');
      appRef.tick();
      await flush();
      injector.destroy();
      await flush();
      expect(service.usageCount('m2')).toBe(0);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test/m2/3');
    });

    it('renvoie null sans id', async () => {
      const ref = service.track(() => null, TestBed.inject(Injector));
      TestBed.tick();
      await flush();
      expect(ref.url()).toBeNull();
      expect(getMediaUrl).not.toHaveBeenCalled();
    });
  });
});

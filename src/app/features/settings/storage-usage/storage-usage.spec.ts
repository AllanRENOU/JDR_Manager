import { TestBed } from '@angular/core/testing';

import { aMedia } from '../../../../testing/data-builders';
import { useNodeBlob } from '../../../../testing/node-blob';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { StoragePersistence } from '../../../core/data/storage-persistence';
import { StorageUsage } from './storage-usage';

describe('StorageUsage', () => {
  useNodeBlob();

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [...useTestRepository()],
    }),
  );

  it('affiche la place occupée par les images et les sons (13.1.2, NF-14)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const image = aMedia();
    const sound = aMedia({ mimeType: 'audio/mpeg', fileName: 'pluie.mp3' });
    // L'import passe par uploadMedia ; ici on enregistre directement des médias de taille connue.
    for (const [media, size] of [
      [image, 3 * 1024 * 1024],
      [sound, 1536],
    ] as const) {
      const file = new File([new Uint8Array(size)], media.fileName, { type: media.mimeType });
      await repository.uploadMedia(file);
    }
    expect(await repository.getStorageUsage()).toEqual({
      images: { count: 1, bytes: 3 * 1024 * 1024 },
      sounds: { count: 1, bytes: 1536 },
    });

    const persistence = TestBed.inject(StoragePersistence);
    vi.spyOn(persistence, 'estimate').mockResolvedValue({ usage: 0, quota: 2 * 1024 ** 3 });
    vi.spyOn(persistence, 'persisted').mockReturnValue(false);
    const fixture = TestBed.createComponent(StorageUsage);
    const el = fixture.nativeElement as HTMLElement;
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.usage')).not.toBeNull();
    });
    const rows = [...el.querySelectorAll('.usage__row')].map((r) =>
      [...r.children].map((c) => c.textContent?.replace(/\s+/g, ' ').trim()).join(' '),
    );
    expect(rows).toEqual([
      'Images (battlemaps) 1 fichier · 3 Mo',
      'Sons 1 fichier · 1,5 Ko',
      'Total 3 Mo',
      'Place disponible pour l’application (estimation du navigateur) 2 Go',
    ]);
    expect(el.querySelector('.protection--off')?.textContent).toContain('Données non protégées');
  });
});

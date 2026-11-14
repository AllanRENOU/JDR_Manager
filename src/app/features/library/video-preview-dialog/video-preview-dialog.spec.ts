import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';

import { useNodeBlob } from '../../../../testing/node-blob';
import { stubObjectUrls } from '../../../../testing/object-url';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { VideoPreviewData, VideoPreviewDialog } from './video-preview-dialog';

describe('VideoPreviewDialog', () => {
  useNodeBlob();
  const objectUrls = stubObjectUrls();
  // Données de la fenêtre, complétées par chaque test avant de créer le composant.
  const data: VideoPreviewData = { name: '', mediaId: '' };

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [...useTestRepository(), { provide: DIALOG_DATA, useValue: data }],
    }),
  );

  function render(name: string, mediaId: string) {
    Object.assign(data, { name, mediaId });
    const fixture = TestBed.createComponent(VideoPreviewDialog);
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('lit la vidéo avec le lecteur du navigateur, puis libère son URL (VID-04)', async () => {
    const mediaId = await TestBed.inject(DATA_REPOSITORY).uploadMedia(
      new File(['vidéo'], 'intro.mp4', { type: 'video/mp4' }),
    );
    const { fixture, el } = render('Intro', mediaId);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('video')).not.toBeNull();
    });
    expect(el.querySelector('app-modal')?.textContent).toContain('Intro');
    const video = el.querySelector('video')!;
    expect(video.controls).toBe(true);
    expect(video.autoplay).toBe(true);
    const url = video.getAttribute('src');
    expect(url).toMatch(/^blob:/);
    expect(video.getAttribute('aria-label')).toBe('Lecteur de la vidéo « Intro »');

    fixture.destroy();
    await vi.waitFor(() => expect(objectUrls.revokeObjectURL).toHaveBeenCalledWith(url));
  });

  it('signale un fichier introuvable', async () => {
    const { fixture, el } = render('Perdue', 'absent');
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('[role="alert"]')?.textContent).toContain('Fichier introuvable');
    });
    expect(el.querySelector('video')).toBeNull();
  });
});

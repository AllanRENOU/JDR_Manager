import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../testing/transloco-testing';
import { Notifications } from '../ui/notification-host/notifications';
import { FileDrop } from './file-drop';

@Component({
  imports: [FileDrop],
  template: `
    <main
      appFileDrop
      #drop="appFileDrop"
      [appFileDropDisabled]="disabled()"
      (filesDropped)="dropped.push($event)"
    >
      <p class="state">{{ drop.active() }} {{ drop.fileCount() }}</p>
    </main>
  `,
})
class Host {
  readonly disabled = signal(false);
  readonly dropped: File[][] = [];
}

/** DataTransfer simulé (jsdom n'en fournit pas). */
function transfer(types: string[], files: File[] = []): DataTransfer {
  return {
    types,
    files,
    items: files.map(() => ({ kind: 'file' })),
    dropEffect: 'none',
  } as unknown as DataTransfer;
}

function fire(type: string, data: DataTransfer): DragEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', { value: data });
  window.dispatchEvent(event);
  return event;
}

describe('FileDrop', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] }));

  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const state = async () => {
      await fixture.whenStable();
      return (fixture.nativeElement.querySelector('.state') as HTMLElement).textContent?.trim();
    };
    return { fixture, state };
  }

  const files = [new File(['a'], 'carte.png'), new File(['b'], 'pluie.mp3')];
  const rejectedFile = new File(['c'], 'notes.txt', { type: 'text/plain' });

  it('s’active au glisser de fichiers et compte les fichiers', async () => {
    const { state } = await render();
    const enter = fire('dragenter', transfer(['Files'], files));
    expect(enter.defaultPrevented).toBe(true);
    expect(await state()).toBe('true 2');
    expect(fire('dragover', transfer(['Files'], files)).defaultPrevented).toBe(true);
  });

  it('ne clignote pas quand le pointeur passe d’un élément à un autre (compteur)', async () => {
    const { state } = await render();
    fire('dragenter', transfer(['Files'], files));
    fire('dragenter', transfer(['Files'], files)); // entre dans un enfant
    fire('dragleave', transfer(['Files'], files)); // quitte le parent
    expect(await state()).toBe('true 2');
    fire('dragleave', transfer(['Files'], files)); // quitte la fenêtre
    expect(await state()).toBe('false 0');
  });

  it('émet les fichiers déposés (formats acceptés) et se désactive', async () => {
    const { fixture, state } = await render();
    fire('dragenter', transfer(['Files'], files));
    const drop = fire('drop', transfer(['Files'], files));
    expect(drop.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.dropped).toEqual([files]);
    expect(await state()).toBe('false 0');
  });

  it('ignore les glisser-déposer internes (sans fichiers) et l’état désactivé', async () => {
    const { fixture, state } = await render();
    const internal = fire('dragenter', transfer(['text/plain']));
    expect(internal.defaultPrevented).toBe(false);
    expect(await state()).toBe('false 0');

    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    fire('dragenter', transfer(['Files'], files));
    fire('drop', transfer(['Files'], files));
    expect(await state()).toBe('false 0');
    expect(fixture.componentInstance.dropped).toEqual([]);
  });

  describe('filtrage des formats (3.4.3)', () => {
    @Component({
      imports: [FileDrop],
      template: `
        <main
          appFileDrop
          [appFileDropKinds]="['sound']"
          (filesDropped)="dropped.push($event)"
          (filesRejected)="rejected.push($event)"
        ></main>
      `,
    })
    class SoundHost {
      readonly dropped: File[][] = [];
      readonly rejected: File[][] = [];
    }

    it('ne transmet que les formats acceptés et signale les fichiers refusés', async () => {
      const fixture = TestBed.createComponent(SoundHost);
      await fixture.whenStable();
      fire('drop', transfer(['Files'], [...files, rejectedFile]));

      expect(fixture.componentInstance.dropped).toEqual([[files[1]]]);
      expect(fixture.componentInstance.rejected).toEqual([[files[0], rejectedFile]]);
      const [notification] = TestBed.inject(Notifications).notifications();
      expect(notification.tone).toBe('danger');
      expect(notification.message).toBe(
        '2 fichier(s) ignoré(s), format non pris en charge : carte.png, notes.txt. Formats acceptés : MP3, OGG, WAV, M4A.',
      );
    });

    it('n’émet pas filesDropped si aucun fichier n’est accepté', async () => {
      const { fixture } = await render();
      fire('drop', transfer(['Files'], [rejectedFile]));
      expect(fixture.componentInstance.dropped).toEqual([]);
      expect(TestBed.inject(Notifications).notifications()).toHaveLength(1);
    });
  });
});

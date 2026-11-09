import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DATA_REPOSITORY } from '../app/core/data/data-repository';
import { provideFrenchLocale } from '../app/core/i18n/locale';
import { Action } from '../app/core/models';
import { ActionRunner } from '../app/features/presentation/engine/action-runner';
import { PlaySessionStore } from '../app/features/presentation/engine/play-session-store';
import { PresentationEngine } from '../app/features/presentation/engine/presentation-engine';
import { Modals } from '../app/shared/ui/modal/modals';
import { aBattlemap, aProject, aScene, aSceneNode, aSoundNode, anAction } from './data-builders';
import { FakeAudio, useFakeAudio } from './fake-audio';
import { FakePlayerBus, useFakePlayerChannel } from './fake-player-channel';
import { useTestRepository } from './test-repository';
import { getTranslocoTestingModule } from './transloco-testing';

/**
 * Banc de test de la Présentation : vrai moteur et vrai dépôt IndexedDB, Web Audio simulé,
 * canal de la fenêtre joueurs en mémoire, traductions françaises. Projet « p1 » « La crypte » :
 * - dossier « Acte I » › scène A « La taverne » (première ; battlemaps b1 « Salle » par défaut et
 *   b2 « Étage » ; texte de scène ; ambiance « Taverne » à l'ouverture), puis B « La forêt » et
 *   C « Le marché », toutes deux scènes suivantes de A ;
 * - sons « Taverne » (projet) et « Pluie » (bibliothèque globale).
 */
export function usePresentation(): { audio: FakeAudio; bus: FakePlayerBus } {
  const audio = useFakeAudio();
  const bus = useFakePlayerChannel();
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        provideRouter([]),
        provideFrenchLocale(),
        PresentationEngine,
        ActionRunner,
        PlaySessionStore,
        ...useTestRepository(),
        ...audio.providers,
        ...bus.providers,
      ],
    });
  });
  afterEach(async () => {
    TestBed.inject(Modals).closeAll();
    await TestBed.inject(PresentationEngine).stop();
  });
  return { audio, bus };
}

/** Enregistre le projet de démonstration, plus d'éventuelles actions de la scène A. */
export async function seedPresentation(actions: Action[] = []): Promise<void> {
  const repository = TestBed.inject(DATA_REPOSITORY);
  const folder = aSceneNode('p1', { id: 'acte', kind: 'folder', name: 'Acte I', order: 0 });
  await repository.saveProject({ ...aProject({ id: 'p1', name: 'La crypte' }), firstSceneId: 'A' });
  await repository.saveSceneNodes([
    folder,
    aSceneNode('p1', { id: 'A', name: 'La taverne', parentId: 'acte', order: 0 }),
    aSceneNode('p1', { id: 'B', name: 'La forêt', parentId: 'acte', order: 1 }),
    aSceneNode('p1', { id: 'C', name: 'Le marché', parentId: 'acte', order: 2 }),
  ]);
  await repository.saveScene(
    aScene('p1', 'A', { defaultBattlemapId: 'b1', nextSceneIds: ['B', 'C'] }),
  );
  await repository.saveScene(aScene('p1', 'B', { nextSceneIds: ['C'] }));
  await repository.saveScene(aScene('p1', 'C'));
  await repository.saveBattlemap(aBattlemap('A', 'm1', { id: 'b1', name: 'Salle', order: 0 }));
  await repository.saveBattlemap(aBattlemap('A', 'm2', { id: 'b2', name: 'Étage', order: 1 }));
  await repository.saveSoundNodes([
    aSoundNode('p1', { id: 'taverne', name: 'Taverne', mediaId: 'son-taverne' }),
    aSoundNode('global', { id: 'pluie', name: 'Pluie', mediaId: 'son-pluie' }),
  ]);
  for (const action of [
    anAction('A', {
      id: 'texte-a',
      name: 'Texte de scène',
      trigger: 'scene-open',
      isSceneText: true,
      elements: [{ id: 't-a', type: 'add-text', text: 'Odeur de bière.' }],
    }),
    anAction('A', {
      id: 'ambiance',
      name: 'Ambiance',
      trigger: 'scene-open',
      order: 1,
      elements: [
        {
          id: 'e-amb',
          type: 'play-sound',
          soundId: 'taverne',
          volume: 0.6,
          loop: true,
          fadeInMs: 0,
          fadeOutMs: 0,
        },
      ],
    }),
    ...actions,
  ]) {
    await repository.saveAction(action);
  }
}

/** Démarre la partie sur la scène A (sans fenêtre de lancement) et attend son ambiance. */
export async function startPresentation(): Promise<PresentationEngine> {
  const engine = TestBed.inject(PresentationEngine);
  await engine.start('p1');
  await vi.waitFor(() => expect(engine.sounds()).toHaveLength(1));
  return engine;
}

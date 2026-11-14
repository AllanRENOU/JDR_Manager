import { aSoundNode } from '../../../testing/data-builders';
import { soundChoiceNodes, soundPath } from './sound-choice';

describe('sound-choice', () => {
  const names = { project: 'Ce projet', global: 'Bibliothèque globale' };
  const folder = aSoundNode('p1', { kind: 'folder', name: 'Ambiances' });
  const tavern = aSoundNode('p1', { name: 'Taverne', parentId: folder.id });
  const rain = aSoundNode('global', { name: 'Pluie' });
  const other = aSoundNode('p2', { name: 'Autre projet' });
  const sounds = [folder, tavern, rain, other];

  it('range les sons sous deux dossiers racines : le projet puis la bibliothèque globale', () => {
    const nodes = soundChoiceNodes(sounds, 'p1', names);
    expect(nodes.filter((n) => n.parentId === null).map((n) => n.name)).toEqual([
      'Ce projet',
      'Bibliothèque globale',
    ]);
    expect(nodes.find((n) => n.id === folder.id)?.parentId).toBe('library:p1');
    expect(nodes.find((n) => n.id === tavern.id)?.parentId).toBe(folder.id);
    expect(nodes.find((n) => n.id === rain.id)?.parentId).toBe('library:global');
    expect(nodes.some((n) => n.id === other.id)).toBe(false);
  });

  it('ne propose que les éléments du type demandé : sons par défaut, vidéos, ou les deux', () => {
    const intro = aSoundNode('global', { name: 'Intro', mediaKind: 'video' });
    const all = [...sounds, intro];
    const items = (kinds?: Parameters<typeof soundChoiceNodes>[3]) =>
      soundChoiceNodes(all, 'p1', names, kinds)
        .filter((n) => n.kind === 'item')
        .map((n) => n.name);
    expect(items()).toEqual(['Taverne', 'Pluie']);
    expect(items('video')).toEqual(['Intro']);
    expect(items(['sound', 'video'])).toEqual(['Taverne', 'Pluie', 'Intro']);
    // Les dossiers restent visibles quel que soit le type.
    expect(soundChoiceNodes(all, 'p1', names, 'video').some((n) => n.id === folder.id)).toBe(true);
    expect(soundPath(intro.id, all, names)).toBe('Bibliothèque globale › Intro');
  });

  it('donne l’emplacement d’un son, ou null s’il a été supprimé', () => {
    expect(soundPath(tavern.id, sounds, names)).toBe('Ce projet › Ambiances › Taverne');
    expect(soundPath(rain.id, sounds, names)).toBe('Bibliothèque globale › Pluie');
    expect(soundPath('absent', sounds, names)).toBeNull();
  });
});

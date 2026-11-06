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

  it('donne l’emplacement d’un son, ou null s’il a été supprimé', () => {
    expect(soundPath(tavern.id, sounds, names)).toBe('Ce projet › Ambiances › Taverne');
    expect(soundPath(rain.id, sounds, names)).toBe('Bibliothèque globale › Pluie');
    expect(soundPath('absent', sounds, names)).toBeNull();
  });
});

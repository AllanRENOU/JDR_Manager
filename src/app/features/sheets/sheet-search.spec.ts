import { aSheet, aSheetNode } from '../../../testing/data-builders';
import { Sheet, SheetNode } from '../../core/models';
import { EXCERPT_LENGTH, filterSheetNodes, searchSheets } from './sheet-search';

describe('searchSheets', () => {
  const pnj = aSheetNode('p', { id: 'pnj', kind: 'folder', name: 'PNJ', order: 0 });
  const village = aSheetNode('p', { id: 'village', kind: 'folder', name: 'Village', order: 1 });
  const garde = aSheetNode('p', { id: 'garde', parentId: pnj.id, name: 'Garde du pont' });
  const aubergiste = aSheetNode('p', {
    id: 'aubergiste',
    parentId: pnj.id,
    name: 'Aubergiste',
    order: 1,
  });
  const taverne = aSheetNode('p', { id: 'taverne', parentId: village.id, name: 'Taverne' });
  const nodes: SheetNode[] = [taverne, aubergiste, village, garde, pnj];
  const sheets: Sheet[] = [
    aSheet('p', 'garde', { text: 'Un **soldat** fatigué qui garde le pont.' }),
    aSheet('p', 'aubergiste', { text: '## Hôte\n\nIl sert la bière à la *Taverne*.' }),
    aSheet('p', 'taverne', { text: '' }),
  ];
  const ids = (query: string) => searchSheets(nodes, sheets, query).map((r) => r.node.id);

  it('renvoie toutes les fiches dans l’ordre de l’arborescence pour une recherche vide', () => {
    expect(ids('  ')).toEqual(['garde', 'aubergiste', 'taverne']);
  });

  it('cherche dans le titre et dans le texte, titres d’abord', () => {
    expect(ids('taverne')).toEqual(['taverne', 'aubergiste']);
    const [title, text] = searchSheets(nodes, sheets, 'taverne');
    expect(title).toMatchObject({ titleMatch: true, textMatch: false, excerpt: null });
    expect(text).toMatchObject({ titleMatch: false, textMatch: true });
  });

  it('ignore les accents et la casse, dans les deux sens', () => {
    expect(ids('HOTE')).toEqual(['aubergiste']);
    expect(ids('fatigue')).toEqual(['garde']);
    expect(ids('bière')).toEqual(['aubergiste']);
  });

  it('cherche dans le texte rendu, sans les marqueurs Markdown', () => {
    expect(ids('soldat fatigué')).toEqual(['garde']);
    expect(ids('**')).toEqual([]);
  });

  it('ne renvoie pas les dossiers, même si leur nom correspond', () => {
    expect(ids('village')).toEqual([]);
  });

  it('donne les dossiers de chaque fiche', () => {
    const [result] = searchSheets(nodes, sheets, 'garde du');
    expect(result.folders.map((f) => f.name)).toEqual(['PNJ']);
  });

  it('donne un extrait du texte brut avec le passage trouvé, dans sa casse d’origine', () => {
    const [result] = searchSheets(nodes, sheets, 'biere');
    expect(result.excerpt).toEqual({
      before: 'Hôte Il sert la ',
      match: 'bière',
      after: ' à la Taverne.',
      cutStart: false,
      cutEnd: false,
    });
  });

  it('donne le début du texte quand seul le titre correspond', () => {
    const [result] = searchSheets(nodes, sheets, 'garde du pont');
    expect(result.excerpt).toMatchObject({ before: '', match: '', cutStart: false });
    expect(result.excerpt?.after).toBe('Un soldat fatigué qui garde le pont.');
  });

  it('coupe un long texte autour de l’occurrence, sur des espaces', () => {
    const long = `${'avant '.repeat(30)}le trésor caché ${'après '.repeat(60)}`;
    const node = aSheetNode('p', { id: 'long', name: 'Longue' });
    const [result] = searchSheets([node], [aSheet('p', 'long', { text: long })], 'tresor');
    const excerpt = result.excerpt!;
    expect(excerpt).toMatchObject({ match: 'trésor', cutStart: true, cutEnd: true });
    expect(excerpt.before.startsWith('avant ')).toBe(true);
    expect(excerpt.after.endsWith('après')).toBe(true);
    const length = (excerpt.before + excerpt.match + excerpt.after).length;
    expect(length).toBeLessThanOrEqual(EXCERPT_LENGTH);
  });

  it('accepte une fiche sans texte enregistré', () => {
    const node = aSheetNode('p', { name: 'Vide' });
    expect(searchSheets([node], [], 'vide')).toMatchObject([{ excerpt: null }]);
  });
});

describe('filterSheetNodes', () => {
  const pnj = aSheetNode('p', { id: 'pnj', kind: 'folder', name: 'PNJ' });
  const garde = aSheetNode('p', { id: 'garde', parentId: pnj.id, name: 'Garde' });
  const lieux = aSheetNode('p', { id: 'lieux', kind: 'folder', name: 'Lieux', order: 1 });
  const pont = aSheetNode('p', { id: 'pont', parentId: lieux.id, name: 'Pont' });
  const nodes = [pnj, garde, lieux, pont];
  const sheets = [aSheet('p', 'garde', { text: 'Surveille le *passage*.' })];
  const ids = (query: string) => filterSheetNodes(nodes, sheets, query).map((n) => n.id);

  it('garde tout pour une recherche vide', () => {
    expect(ids('')).toEqual(['pnj', 'garde', 'lieux', 'pont']);
  });

  it('garde les fiches trouvées par leur texte et leurs dossiers', () => {
    expect(ids('passage')).toEqual(['pnj', 'garde']);
  });

  it('garde un dossier trouvé par son nom avec son contenu, comme filterNodes', () => {
    expect(ids('lieux')).toEqual(['lieux', 'pont']);
  });
});

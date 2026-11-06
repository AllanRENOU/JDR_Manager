import { pluralKey } from './plural';

describe('pluralKey', () => {
  it('suit la règle française : 0 et 1 au singulier', () => {
    expect(pluralKey('project.stats.scenes', 0)).toBe('project.stats.scenes.one');
    expect(pluralKey('project.stats.scenes', 1)).toBe('project.stats.scenes.one');
    expect(pluralKey('project.stats.scenes', 2)).toBe('project.stats.scenes.other');
  });
});

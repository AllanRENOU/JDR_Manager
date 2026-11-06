import { formatDuration } from './duration';

describe('formatDuration', () => {
  it('affiche minutes et secondes, et les heures au-delà d’une heure', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(187_000)).toBe('3:07');
    expect(formatDuration(760_400)).toBe('12:40');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });

  it('affiche un tiret pour une durée inconnue', () => {
    expect(formatDuration(undefined)).toBe('—');
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(Number.NaN)).toBe('—');
  });
});

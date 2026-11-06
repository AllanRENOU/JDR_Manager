import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DataError } from '../../../core/data/data-error';
import { NotificationHost } from './notification-host';
import { Notifications } from './notifications';

describe('Notifications', () => {
  let service: Notifications;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [NotificationHost, getTranslocoTestingModule()] });
    service = TestBed.inject(Notifications);
  });

  afterEach(() => vi.useRealTimers());

  it('affiche puis retire automatiquement une notification', () => {
    service.info('Projet enregistré.');
    expect(service.notifications()).toEqual([
      { id: 1, tone: 'info', message: 'Projet enregistré.' },
    ]);
    vi.advanceTimersByTime(4000);
    expect(service.notifications()).toEqual([]);
  });

  it('traduit le message d’une DataError, ou affiche un message générique', () => {
    service.fromError(new DataError('quota-exceeded', 'plein'));
    service.fromError(new Error('inattendue'));
    const [quota, generic] = service.notifications();
    expect(quota.tone).toBe('danger');
    expect(quota.message).toContain('Espace de stockage du navigateur insuffisant');
    expect(generic.message).toBe('Une erreur est survenue.');
  });

  it('garde une notification sans durée jusqu’à sa fermeture, depuis la zone d’affichage', () => {
    service.error('Battlemap introuvable.', 0);
    const fixture = TestBed.createComponent(NotificationHost);
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('app-alert') as HTMLElement;
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.textContent).toContain('Battlemap introuvable.');

    vi.advanceTimersByTime(60_000);
    expect(service.notifications()).toHaveLength(1);
    (alert.querySelector('button') as HTMLButtonElement).click();
    expect(service.notifications()).toEqual([]);
  });
});

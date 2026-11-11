import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../../testing/transloco-testing';
import { FeedWait } from './feed-wait';

describe('FeedWait', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] }));
  afterEach(() => vi.useRealTimers());

  function render(durationMs: number, text?: string) {
    TestBed.configureTestingModule({ imports: [FeedWait, getTranslocoTestingModule()] });
    const fixture = TestBed.createComponent(FeedWait);
    fixture.componentRef.setInput('wait', {
      id: 'w',
      endsAt: Date.now() + durationMs,
      durationMs,
      ...(text ? { text } : {}),
    });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      time: () => el.querySelector('[role="timer"]')?.textContent?.trim(),
      progress: () => el.style.getPropertyValue('--wait-progress'),
    };
  }

  it('affiche le temps restant, arrondi à la seconde supérieure, et le décompte ; le fond se remplit', async () => {
    const { fixture, time, progress } = render(65_000);
    expect(fixture.nativeElement.textContent).toContain('Attente en cours');
    expect(time()).toBe('1:05');
    expect(progress()).toBe('0');

    await vi.advanceTimersByTimeAsync(5_250);
    fixture.detectChanges();
    expect(time()).toBe('1:00');

    await vi.advanceTimersByTimeAsync(59_500);
    fixture.detectChanges();
    expect(time()).toBe('0:01');

    await vi.advanceTimersByTimeAsync(1_000);
    fixture.detectChanges();
    expect(time()).toBe('0:00');
    expect(progress()).toBe('1');
  });

  it('le compte à rebours est un minuteur accessible', () => {
    const { fixture } = render(10_000);
    const timer = fixture.nativeElement.querySelector('[role="timer"]');
    expect(timer.getAttribute('aria-label')).toBe('Temps restant');
  });

  it('affiche le texte de l’attente à la place de « Attente en cours », toujours lu au lecteur d’écran', () => {
    const { fixture } = render(10_000, 'Le garde passe.');
    const label = fixture.nativeElement.querySelector('.wait__label') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Attente en cours : Le garde passe.');
    expect(label.querySelector('.visually-hidden')?.textContent).toContain('Attente en cours');
  });
});

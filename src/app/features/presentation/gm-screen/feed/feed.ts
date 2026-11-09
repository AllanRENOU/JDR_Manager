import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  LucideArrowDown,
  LucideArrowRight,
  LucideCheck,
  LucideChevronUp,
  LucideMousePointerClick,
} from '@lucide/angular';

import { pluralKey } from '../../../../core/i18n/plural';
import { Id } from '../../../../core/models';
import { Button } from '../../../../shared/ui/button/button';
import { PresentationEngine } from '../../engine/presentation-engine';
import { FeedBattlemap } from '../feed-battlemap/feed-battlemap';

/** Écart (px) au-delà duquel le MJ est considéré comme remonté dans le fil. */
const SCROLLED_UP_THRESHOLD = 48;

/**
 * Fil d'actualité de la scène (Brief §6.10, FIL-01 à FIL-09) : textes, miniatures de battlemap,
 * blocs « Clic de l'utilisateur ». Chaque nouvel élément (ou le texte retrouvé à une relance)
 * est amené en haut de la zone ; les éléments précédents sont estompés et restent relisibles.
 */
@Component({
  selector: 'app-feed',
  imports: [
    Button,
    FeedBattlemap,
    TranslocoPipe,
    LucideArrowDown,
    LucideArrowRight,
    LucideCheck,
    LucideChevronUp,
    LucideMousePointerClick,
  ],
  templateUrl: './feed.html',
  styleUrl: './feed.scss',
})
export class Feed {
  protected readonly engine = inject(PresentationEngine);
  private readonly injector = inject(Injector);
  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  /** Le MJ a remonté le fil : plus d'estompage, bouton « Revenir au dernier élément ». */
  protected readonly scrolledUp = signal(false);

  /** Élément courant : le dernier montré (ajout ou relance), sinon le dernier du fil. */
  protected readonly currentId = computed<Id | null>(() => {
    const feed = this.engine.feed();
    const focus = this.engine.focus()?.itemId;
    return feed.some((item) => item.id === focus) ? focus! : (feed.at(-1)?.id ?? null);
  });
  protected readonly currentIndex = computed(() =>
    this.engine.feed().findIndex((item) => item.id === this.currentId()),
  );
  protected readonly previousKey = computed(() =>
    pluralKey('presentation.previousItems', this.currentIndex()),
  );

  constructor() {
    // FIL-06, CTL-03 : à chaque élément montré, il passe en haut de la zone.
    effect(() => {
      this.engine.focus();
      const id = this.currentId();
      if (id) {
        untracked(() => afterNextRender(() => this.scrollTo(id), { injector: this.injector }));
      }
    });
  }

  /** Remonte d'un élément (pastille « N éléments précédents »). */
  protected showPrevious(): void {
    const scroller = this.scroller().nativeElement;
    const items = [...scroller.querySelectorAll<HTMLElement>('[data-feed-item]')];
    const above = items.filter((el) => el.offsetTop < scroller.scrollTop - 1).at(-1);
    this.scrollToElement(above ?? items[0]);
  }

  /** « Revenir au dernier élément ». */
  protected backToCurrent(): void {
    const id = this.currentId();
    if (id) {
      this.scrollTo(id);
    }
  }

  protected onScroll(): void {
    const scroller = this.scroller().nativeElement;
    const current = this.elementOf(this.currentId());
    this.scrolledUp.set(
      !!current &&
        scroller.scrollTop < current.offsetTop - SCROLLED_UP_THRESHOLD - this.topPadding(),
    );
  }

  private scrollTo(id: Id): void {
    const element = this.elementOf(id);
    if (element) {
      this.scrollToElement(element);
    }
    this.scrolledUp.set(false);
  }

  private scrollToElement(element: HTMLElement | undefined): void {
    if (!element) {
      return;
    }
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.scroller().nativeElement.scrollTo?.({
      top: Math.max(0, element.offsetTop - this.topPadding()),
      behavior: smooth ? 'smooth' : 'auto',
    });
  }

  private elementOf(id: Id | null): HTMLElement | undefined {
    if (!id) {
      return undefined;
    }
    return (
      this.scroller().nativeElement.querySelector<HTMLElement>(`[data-feed-item="${id}"]`) ??
      undefined
    );
  }

  /** Marge au-dessus de l'élément courant : laisse voir la fin du précédent, estompé. */
  private topPadding(): number {
    return parseFloat(getComputedStyle(this.scroller().nativeElement).scrollPaddingTop) || 0;
  }
}

import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormField, form, max, min, validate } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideTriangleAlert } from '@lucide/angular';

import { ActionElement, Id } from '../../../core/models';
import { MarkdownEditor } from '../../../shared/markdown/markdown-editor';
import { Selections } from '../../../shared/selection-dialog/selections';
import { Field } from '../../../shared/ui/field/field';
import { Input } from '../../../shared/ui/input/input';
import { SummaryContext } from '../action-summary';
import { BattlemapCard } from '../battlemap-card/battlemap-card';
import { elementProblem } from '../element-validation';
import { soundChoiceNodes, soundPath } from '../../../shared/selection-dialog/sound-choice';

/**
 * Champs saisis au clavier, communs aux types d'éléments. Les cibles (battlemap, son, scène)
 * se choisissent à part (miniatures, fenêtres de sélection).
 */
interface ElementFields {
  text: string;
  seconds: number | null;
  /** Volume en % (0 à 100) ; l'élément le stocke de 0 à 1. */
  volume: number | null;
  loop: boolean;
  /** Fondus en secondes ; l'élément les stocke en millisecondes. */
  fadeIn: number | null;
  fadeOut: number | null;
}

function toFields(element: ActionElement): ElementFields {
  return {
    text: element.type === 'add-text' || element.type === 'user-click' ? element.text : '',
    seconds: element.type === 'wait' ? element.seconds : 1,
    volume: element.type === 'play-sound' ? Math.round(element.volume * 100) : 100,
    loop: element.type === 'play-sound' ? element.loop : false,
    fadeIn: element.type === 'play-sound' ? element.fadeInMs / 1000 : 0,
    fadeOut: element.type === 'play-sound' ? element.fadeOutMs / 1000 : 0,
  };
}

/**
 * Reporte les champs saisis dans l'élément. Une valeur invalide (vide, hors bornes) n'est pas
 * reportée : l'élément garde sa dernière valeur valide, et le champ affiche son erreur.
 */
function applyFields(element: ActionElement, fields: ElementFields): ActionElement {
  const num = (value: number | null, fallback: number, valid: (v: number) => boolean) =>
    value === null || Number.isNaN(value) || !valid(value) ? fallback : value;
  const positive = (v: number) => v > 0;
  const notNegative = (v: number) => v >= 0;
  switch (element.type) {
    case 'add-text':
    case 'user-click':
      return { ...element, text: fields.text };
    case 'wait':
      return { ...element, seconds: num(fields.seconds, element.seconds, positive) };
    case 'play-sound': {
      const volume = num(fields.volume, element.volume * 100, (v) => v >= 0 && v <= 100);
      const fadeIn = num(fields.fadeIn, element.fadeInMs / 1000, notNegative);
      const fadeOut = num(fields.fadeOut, element.fadeOutMs / 1000, notNegative);
      return {
        ...element,
        volume: volume / 100,
        loop: fields.loop,
        fadeInMs: Math.round(fadeIn * 1000),
        fadeOutMs: Math.round(fadeOut * 1000),
      };
    }
    default:
      return element;
  }
}

const sameElement = (a: ActionElement, b: ActionElement) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Formulaire d'un élément d'action (ACT-04 à ACT-11), affiché dans sa carte dépliée.
 * Signal Forms (TEC-06) pour les champs saisis ; chaque modification renvoie l'élément mis à jour.
 */
@Component({
  selector: 'app-element-form',
  imports: [
    BattlemapCard,
    Field,
    FormField,
    Input,
    MarkdownEditor,
    NgTemplateOutlet,
    TranslocoPipe,
    LucideTriangleAlert,
  ],
  templateUrl: './element-form.html',
  styleUrl: './element-form.scss',
})
export class ElementForm {
  private readonly selections = inject(Selections);
  private readonly transloco = inject(TranslocoService);

  readonly element = input.required<ActionElement>();
  readonly context = input.required<SummaryContext>();
  /** Scène de l'action : non sélectionnable comme cible de « Changer de scène ». */
  readonly sceneId = input.required<Id>();
  readonly projectId = input.required<Id>();

  readonly elementChange = output<ActionElement>();

  protected readonly fields = linkedSignal(() => toFields(this.element()));
  protected readonly form = form(this.fields, (path) => {
    validate(path.text, ({ value }) =>
      this.element().type === 'user-click' && !value().trim()
        ? { kind: 'required', message: 'action.form.clickTextRequired' }
        : undefined,
    );
    validate(path.seconds, ({ value }) => {
      const seconds = value();
      return seconds === null || Number.isNaN(seconds) || seconds <= 0
        ? { kind: 'min', message: 'action.form.durationInvalid' }
        : undefined;
    });
    min(path.volume, 0, { message: 'action.form.volumeInvalid' });
    max(path.volume, 100, { message: 'action.form.volumeInvalid' });
    min(path.fadeIn, 0, { message: 'action.form.fadeInvalid' });
    min(path.fadeOut, 0, { message: 'action.form.fadeInvalid' });
  });

  /** Erreurs affichées même sur les champs non visités (après « Enregistrer »). */
  private readonly revealed = signal(false);

  /** Élément à corriger : champ saisi invalide ou problème bloquant (8.4.1). */
  readonly invalid = computed(
    () => this.form().invalid() || elementProblem(this.element()) !== null,
  );

  /** Cible (battlemap, son, scène) jamais choisie, une fois les erreurs révélées. */
  protected readonly choiceError = computed(() => {
    const problem = this.revealed() ? elementProblem(this.element()) : null;
    return problem && problem.endsWith('Required') && this.element().type !== 'user-click'
      ? problem
      : '';
  });

  /** Affiche toutes les erreurs, comme si chaque champ avait été visité. */
  revealErrors(): void {
    this.revealed.set(true);
    for (const field of ['text', 'seconds', 'volume', 'fadeIn', 'fadeOut'] as const) {
      this.form[field]().markAsTouched();
    }
  }

  constructor() {
    // Chaque saisie remonte l'élément modifié à l'éditeur d'action.
    effect(() => {
      const fields = this.fields();
      const current = untracked(this.element);
      const updated = applyFields(current, fields);
      if (!sameElement(current, updated)) {
        this.elementChange.emit(updated);
      }
    });
  }

  private readonly libraryNames = computed(() => ({
    project: this.transloco.translate('sound.project'),
    global: this.transloco.translate('sound.global'),
  }));

  /** Emplacement du son choisi ; `null` : pas choisi ; `false` : supprimé. */
  protected readonly soundLabel = computed<string | null | false>(() => {
    const element = this.element();
    if (element.type !== 'play-sound' && element.type !== 'stop-sound') {
      return null;
    }
    if (!element.soundId) {
      return null;
    }
    return (
      soundPath(element.soundId, this.context().soundNodes ?? [], this.libraryNames()) ?? false
    );
  });

  /** Chemin de la scène cible ; `null` : pas choisie ; `false` : supprimée. */
  protected readonly sceneLabel = computed<string | null | false>(() => {
    const element = this.element();
    if (element.type !== 'change-scene' || !element.sceneId) {
      return null;
    }
    const nodes = this.context().sceneNodes;
    if (!nodes.some((n) => n.id === element.sceneId && n.kind === 'item')) {
      return false;
    }
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const names: string[] = [];
    for (let id: Id | null = element.sceneId; id; id = byId.get(id)?.parentId ?? null) {
      names.unshift(byId.get(id)?.name ?? '');
    }
    return names.join(' › ');
  });

  /** Message d'erreur (clé de traduction) d'un champ, une fois le champ quitté. */
  protected error(field: keyof ElementFields): string {
    const state = this.form[field]();
    return state.touched() && state.invalid() ? (state.errors()[0]?.message ?? '') : '';
  }

  protected chooseBattlemap(battlemapId: Id): void {
    const element = this.element();
    if (element.type === 'show-battlemap') {
      this.elementChange.emit({ ...element, battlemapId });
    }
  }

  /** Fenêtre de sélection unique dans les deux bibliothèques de sons (ACT-05, ACT-06). */
  protected async chooseSound(): Promise<void> {
    const element = this.element();
    if (element.type !== 'play-sound' && element.type !== 'stop-sound') {
      return;
    }
    const chosen = await this.selections.select({
      title: this.transloco.translate('action.form.chooseSoundTitle'),
      nodes: soundChoiceNodes(
        this.context().soundNodes ?? [],
        this.projectId(),
        this.libraryNames(),
      ),
      mode: 'single',
      checkedIds: element.soundId ? [element.soundId] : [],
    });
    if (chosen?.[0]) {
      this.elementChange.emit({ ...this.element(), soundId: chosen[0] } as ActionElement);
    }
  }

  /** Fenêtre de sélection unique de la scène cible (ACT-09), scène actuelle grisée. */
  protected async chooseScene(): Promise<void> {
    const element = this.element();
    if (element.type !== 'change-scene') {
      return;
    }
    const chosen = await this.selections.select({
      title: this.transloco.translate('action.form.chooseSceneTitle'),
      subtitle: this.transloco.translate('action.form.chooseSceneSubtitle'),
      nodes: this.context().sceneNodes,
      mode: 'single',
      checkedIds: element.sceneId ? [element.sceneId] : [],
      disabledIds: [this.sceneId()],
      labels: { disabled: 'scene.current' },
    });
    if (chosen?.[0]) {
      this.elementChange.emit({ ...element, sceneId: chosen[0] });
    }
  }
}

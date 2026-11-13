import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { FormField, disabled, form, maxLength, validate } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideDynamicIcon, LucidePlus, LucideTrash2 } from '@lucide/angular';

import { pluralKey } from '../../../core/i18n/plural';
import { Action, ActionElement, ActionElementType, Id, Trigger } from '../../../core/models';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { Input } from '../../../shared/ui/input/input';
import { Modal } from '../../../shared/ui/modal/modal';
import { Menu } from '../../../shared/ui/menu/menu';
import { MenuItem } from '../../../shared/ui/menu/menu-item';
import { Modals } from '../../../shared/ui/modal/modals';
import {
  SegmentedControl,
  SegmentedOption,
} from '../../../shared/ui/segmented-control/segmented-control';
import { SummaryContext } from '../action-summary';
import { ElementCard } from '../element-card/element-card';
import { ElementForm } from '../element-form/element-form';
import { ELEMENT_TYPE_INFOS, newElement } from '../element-types';

/** Contenu modifiable d'une action. */
export interface ActionDraft {
  name: string;
  trigger: Trigger;
  /** Masquée au départ en Présentation (ACT-12) ; ignoré si le déclencheur n'est pas manuel. */
  hidden: boolean;
  elements: ActionElement[];
}

/** Données de la fenêtre : action à modifier (`null` : nouvelle action) et contexte de la scène. */
export interface ActionEditorData {
  action: Action | null;
  /** Scène de l'action (non sélectionnable comme cible de « Changer de scène »). */
  sceneId: Id;
  /** Projet : sa bibliothèque de sons est présentée avant la globale. */
  projectId: Id;
  sceneName: string;
  /** Noms des sons, battlemaps et scènes, pour présenter les éléments. */
  context: SummaryContext;
}

/** Résultat : action à enregistrer, ou à supprimer (confirmation déjà faite). */
export type ActionEditorResult = { kind: 'save'; draft: ActionDraft } | { kind: 'delete' };
import { Capitalize } from '../../../shared/ui/capitalize/capitalize';

/**
 * Éditeur d'action (Brief §7.2, ACT-01 à ACT-03) : fenêtre de 900 px avec nom, déclencheur et
 * éléments. Formulaire en Signal Forms (TEC-06). N'écrit rien : renvoie le résultat à l'éditeur
 * de scène, qui enregistre.
 */
@Component({
  selector: 'app-action-editor',
  imports: [
    Capitalize,
    Modal,
    Field,
    Input,
    Button,
    SegmentedControl,
    FormField,
    ElementCard,
    ElementForm,
    CdkDrag,
    CdkDropList,
    CdkMenuTrigger,
    Menu,
    MenuItem,
    TranslocoPipe,
    LucideDynamicIcon,
    LucidePlus,
    LucideTrash2,
  ],
  templateUrl: './action-editor.html',
  styleUrl: './action-editor.scss',
})
export class ActionEditor {
  private readonly ref = inject<DialogRef<ActionEditorResult>>(DialogRef);
  protected readonly data = inject<ActionEditorData>(DIALOG_DATA);
  private readonly transloco = inject(TranslocoService);
  private readonly modals = inject(Modals);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly isNew = this.data.action === null;
  /** L'action « Texte de scène » se lance toujours à l'ouverture et ne se supprime pas (SCN-06). */
  protected readonly isSceneText = this.data.action?.isSceneText ?? false;

  /** Copie de travail : rien n'est enregistré avant « Enregistrer ». */
  protected readonly draft = signal<ActionDraft>({
    name: this.data.action?.name ?? '',
    trigger: this.data.action?.trigger ?? 'manual',
    hidden: this.data.action?.hidden ?? false,
    elements: structuredClone(this.data.action?.elements ?? []),
  });

  protected readonly form = form(this.draft, (path) => {
    // Obligatoire, espaces seuls refusés ; le message est une clé de traduction.
    validate(path.name, ({ value }) =>
      value().trim() ? undefined : { kind: 'required', message: 'action.editor.nameRequired' },
    );
    maxLength(path.name, 120);
    disabled(path.trigger, () => this.isSceneText);
  });

  protected readonly triggerOptions = computed<SegmentedOption<Trigger>[]>(() =>
    (['scene-open', 'manual'] as const).map((value) => ({
      value,
      label: this.transloco.translate(`action.triggerOptions.${value}`),
    })),
  );

  /** Message d'erreur du nom, affiché une fois le champ quitté ou à l'enregistrement. */
  protected readonly nameError = computed(() => {
    const state = this.form.name();
    return state.touched() && state.invalid() ? (state.errors()[0]?.message ?? '') : '';
  });

  protected readonly elementTypes = ELEMENT_TYPE_INFOS;
  /** Cartes dépliées. */
  protected readonly expandedIds = signal<ReadonlySet<Id>>(new Set());

  private readonly elementForms = viewChildren(ElementForm);
  /** « Enregistrer » a été demandé : les éléments à corriger sont signalés (8.4.1). */
  private readonly submitted = signal(false);
  protected readonly invalidIds = computed<ReadonlySet<Id>>(() =>
    this.submitted()
      ? new Set(
          this.elementForms()
            .filter((f) => f.invalid())
            .map((f) => f.element().id),
        )
      : new Set(),
  );

  /** Ajoute un élément à la fin, seul déplié : les autres se replient (8.2.3). */
  protected addElement(type: ActionElementType): void {
    const element = newElement(type);
    this.draft.update((d) => ({ ...d, elements: [...d.elements, element] }));
    this.expandedIds.set(new Set([element.id]));
  }

  /** Élément modifié dans son formulaire (8.3). */
  protected updateElement(element: ActionElement): void {
    this.draft.update((d) => ({
      ...d,
      elements: d.elements.map((e) => (e.id === element.id ? element : e)),
    }));
  }

  protected removeElement(id: Id): void {
    this.draft.update((d) => ({ ...d, elements: d.elements.filter((e) => e.id !== id) }));
    this.setExpanded(id, false);
  }

  /** Glisser-déposer par la poignée (8.2.1). */
  protected moveElement(from: number, to: number): void {
    if (from === to) {
      return;
    }
    this.draft.update((d) => {
      const elements = [...d.elements];
      moveItemInArray(elements, from, to);
      return { ...d, elements };
    });
  }

  protected setExpanded(id: Id, expanded: boolean): void {
    this.expandedIds.update((ids) => {
      const next = new Set(ids);
      if (expanded) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  /**
   * Validation globale (8.4.1) : nom et éléments. En cas d'erreur, rien n'est renvoyé ; les
   * éléments à corriger sont dépliés et signalés, et le premier problème reçoit le focus.
   */
  protected save(event?: Event): void {
    event?.preventDefault();
    this.form.name().markAsTouched();
    this.submitted.set(true);
    this.elementForms().forEach((f) => f.revealErrors());
    const invalidIds = this.invalidIds();
    if (this.form().invalid() || invalidIds.size > 0) {
      this.expandedIds.update((ids) => new Set([...ids, ...invalidIds]));
      afterNextRender(() => this.focusFirstProblem(), { injector: this.injector });
      return;
    }
    // Copie propre : Signal Forms marque les objets des listes d'une clé Symbol.
    const draft = structuredClone(this.draft());
    this.ref.close({
      kind: 'save',
      draft: {
        ...draft,
        name: draft.name.trim(),
        // Seule une action « au clic du MJ » peut être masquée au départ.
        hidden: draft.trigger === 'manual' && draft.hidden,
      },
    });
  }

  private focusFirstProblem(): void {
    const root = this.host.nativeElement;
    const target =
      root.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      root.querySelector<HTMLElement>('app-element-card.invalid button');
    target?.scrollIntoView?.({ block: 'center' });
    target?.focus();
  }

  protected cancel(): void {
    this.ref.close();
  }

  /** Supprime l'action après confirmation (NF-31) ; impossible pour « Texte de scène ». */
  protected async remove(): Promise<void> {
    const name = this.data.action?.name ?? '';
    // Actions qui la font apparaître ou la masquent : elles la signaleront comme introuvable
    // (PRS-07).
    const id = this.data.action?.id;
    const users = (this.data.context.actions ?? []).filter(
      (a) =>
        a.id !== id &&
        a.elements.some(
          (e) =>
            (e.type === 'show-action' || e.type === 'hide-action') &&
            !!id &&
            e.actionIds.includes(id),
        ),
    ).length;
    const confirmed = await this.modals.confirm({
      title: this.transloco.translate('action.editor.deleteTitle', { name }),
      message: this.transloco.translate(
        users > 0
          ? pluralKey('action.editor.deleteShownMessage', users)
          : 'action.editor.deleteMessage',
        { count: users },
      ),
      confirmLabel: this.transloco.translate('common.actions.delete'),
      destructive: true,
    });
    if (confirmed) {
      this.ref.close({ kind: 'delete' });
    }
  }
}

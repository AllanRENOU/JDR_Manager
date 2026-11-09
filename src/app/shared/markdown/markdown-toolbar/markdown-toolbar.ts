import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  LucideBold,
  LucideDynamicIcon,
  LucideHeading2,
  LucideIcon,
  LucideItalic,
  LucideList,
  LucideListOrdered,
  LucideTextQuote,
} from '@lucide/angular';

import { Button } from '../../ui/button/button';
import { MarkdownEditor } from '../markdown-editor';
import { MarkdownFormat } from '../markdown-format';

interface ToolbarTool {
  format: MarkdownFormat;
  icon: LucideIcon;
  /** Clé de traduction du libellé (`markdown.<format>`). */
  labelKey: string;
  /** Raccourci pour `aria-keyshortcuts`, et tel qu'affiché dans l'infobulle. */
  shortcut?: { aria: string; label: string };
}

const TOOLS: readonly ToolbarTool[] = [
  {
    format: 'bold',
    icon: LucideBold,
    labelKey: 'markdown.bold',
    shortcut: { aria: 'Control+B', label: 'Ctrl+B' },
  },
  {
    format: 'italic',
    icon: LucideItalic,
    labelKey: 'markdown.italic',
    shortcut: { aria: 'Control+I', label: 'Ctrl+I' },
  },
  { format: 'heading', icon: LucideHeading2, labelKey: 'markdown.heading' },
  { format: 'bullet-list', icon: LucideList, labelKey: 'markdown.bulletList' },
  { format: 'numbered-list', icon: LucideListOrdered, labelKey: 'markdown.numberedList' },
  { format: 'quote', icon: LucideTextQuote, labelKey: 'markdown.quote' },
];

/**
 * Barre de mise en page Markdown (gras, italique, titre, listes, citation) d'un champ
 * `textarea[appMarkdownEditor]`. `app-field` l'affiche d'elle-même quand il contient un tel champ.
 * Les boutons ne prennent pas le focus à la souris : la sélection du champ est conservée.
 */
@Component({
  selector: 'app-markdown-toolbar',
  imports: [Button, LucideDynamicIcon, TranslocoPipe],
  templateUrl: './markdown-toolbar.html',
  styleUrl: './markdown-toolbar.scss',
})
export class MarkdownToolbar {
  readonly editor = input.required<MarkdownEditor>();
  /** Identifiant du champ piloté (`aria-controls`). */
  readonly controlId = input('');

  protected readonly tools = TOOLS;
}

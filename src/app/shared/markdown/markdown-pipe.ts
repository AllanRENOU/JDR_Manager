import { Pipe, PipeTransform } from '@angular/core';

import { renderMarkdown } from './markdown-format';

/**
 * Texte Markdown → HTML, à lier **uniquement** à `[innerHTML]` (assaini par Angular) :
 *
 * ```html
 * <div class="app-markdown" [innerHTML]="text | markdown"></div>
 * ```
 * La classe `app-markdown` (`src/styles/components/_markdown.scss`) met en forme le rendu.
 */
@Pipe({
  name: 'markdown',
})
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return renderMarkdown(value);
  }
}

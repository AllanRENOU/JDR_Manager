/**
 * Raccourcis clavier de la Présentation (NF-32) : touche affichée (`keys`, ou clé de traduction
 * `keysKey` pour un nom de touche) et clé de traduction du libellé.
 */
export const PRESENTATION_SHORTCUTS: readonly {
  keys?: string;
  keysKey?: string;
  labelKey: string;
}[] = [
  { keysKey: 'presentation.shortcuts.enterKey', labelKey: 'presentation.shortcuts.continueLast' },
  { keys: 'C', labelKey: 'presentation.shortcuts.continue' },
  { keys: 'S', labelKey: 'presentation.shortcuts.nextScene' },
  { keys: 'A', labelKey: 'presentation.shortcuts.goToScene' },
  { keys: 'P', labelKey: 'presentation.shortcuts.playPause' },
  { keys: '1 – 9', labelKey: 'presentation.shortcuts.runAction' },
  { keys: '?', labelKey: 'presentation.shortcuts.help' },
];

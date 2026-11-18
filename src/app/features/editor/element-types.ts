import {
  LucideAudioLines,
  LucideClapperboard,
  LucideEye,
  LucideEyeOff,
  LucideFilm,
  LucideHourglass,
  LucideIcon,
  LucideMap,
  LucideMousePointerClick,
  LucideScrollText,
  LucideSquarePlay,
  LucideSquareStop,
  LucideSquareX,
  LucideType,
  LucideVolume2,
  LucideVolumeX,
  LucideZap,
} from '@lucide/angular';

import { ActionElement, ActionElementType, newId } from '../../core/models';
import { ELEMENT_TONES, PillTone } from '../../shared/ui/pill/pill';

/** Présentation d'un type d'élément : libellé, icône et couleur (Brief §2.6). */
export interface ElementTypeInfo {
  type: ActionElementType;
  /** Clé de traduction du nom du type, ex. « Lancer un son ». */
  labelKey: string;
  icon: LucideIcon;
  tone: PillTone;
  /** Clé de l'aide affichée en infobulle sur le nom du type (carte de l'éditeur d'action). */
  helpKey?: string;
}

const HELP_KEYS: Partial<Record<ActionElementType, string>> = {
  'user-click': 'action.form.clickHelp',
};

const ICONS: Record<ActionElementType, LucideIcon> = {
  'show-battlemap': LucideMap,
  'play-sound': LucideAudioLines,
  'stop-sound': LucideVolumeX,
  'stop-all-sounds': LucideSquareX,
  'play-video': LucideFilm,
  'stop-video': LucideSquareStop,
  'add-text': LucideType,
  'change-scene': LucideClapperboard,
  wait: LucideHourglass,
  'user-click': LucideMousePointerClick,
  'show-action': LucideEye,
  'hide-action': LucideEyeOff,
  'show-sheet': LucideScrollText,
};

/** Ordre du menu « Ajouter un élément » (spécifications §4.3). */
const MENU_ORDER: readonly ActionElementType[] = [
  'show-battlemap',
  'play-sound',
  'stop-sound',
  'stop-all-sounds',
  'play-video',
  'stop-video',
  'add-text',
  'show-sheet',
  'change-scene',
  'show-action',
  'hide-action',
  'wait',
  'user-click',
];

/** Types d'éléments dans l'ordre du menu. */
export const ELEMENT_TYPE_INFOS: readonly ElementTypeInfo[] = MENU_ORDER.map((type) => ({
  type,
  labelKey: `action.types.${type}`,
  icon: ICONS[type],
  tone: ELEMENT_TONES[type],
  helpKey: HELP_KEYS[type],
}));

/** Sous-menu du menu « Ajouter un élément » qui regroupe des types voisins (sons, vidéo, actions). */
export interface ElementMenuGroup {
  id: 'sound' | 'video' | 'action';
  /** Clé de traduction du nom du sous-menu. */
  labelKey: string;
  icon: LucideIcon;
  tone: PillTone;
  types: readonly ElementTypeInfo[];
}

/** Entrée du menu « Ajouter un élément » : un type, ou un sous-menu de types. */
export type ElementMenuEntry =
  { kind: 'type'; info: ElementTypeInfo } | { kind: 'group'; group: ElementMenuGroup };

const MENU_GROUPS: readonly Omit<ElementMenuGroup, 'types' | 'labelKey'>[] = [
  { id: 'sound', icon: LucideVolume2, tone: 'sound' },
  { id: 'video', icon: LucideSquarePlay, tone: 'video' },
  { id: 'action', icon: LucideZap, tone: 'action' },
];

const GROUP_OF: Partial<Record<ActionElementType, ElementMenuGroup['id']>> = {
  'play-sound': 'sound',
  'stop-sound': 'sound',
  'stop-all-sounds': 'sound',
  'play-video': 'video',
  'stop-video': 'video',
  'show-action': 'action',
  'hide-action': 'action',
};

/**
 * Menu « Ajouter un élément » : les types dans l'ordre de `MENU_ORDER`, ceux d'un même groupe
 * réunis dans un sous-menu placé à la position du premier d'entre eux.
 */
export const ELEMENT_MENU: readonly ElementMenuEntry[] = (() => {
  const entries: ElementMenuEntry[] = [];
  for (const info of ELEMENT_TYPE_INFOS) {
    const groupId = GROUP_OF[info.type];
    if (!groupId) {
      entries.push({ kind: 'type', info });
      continue;
    }
    if (entries.some((e) => e.kind === 'group' && e.group.id === groupId)) continue;
    const base = MENU_GROUPS.find((g) => g.id === groupId)!;
    const types = ELEMENT_TYPE_INFOS.filter((t) => GROUP_OF[t.type] === groupId);
    entries.push({
      kind: 'group',
      group: { ...base, labelKey: `action.editor.menuGroups.${groupId}`, types },
    });
  }
  return entries;
})();

export function elementTypeInfo(type: ActionElementType): ElementTypeInfo {
  return ELEMENT_TYPE_INFOS.find((info) => info.type === type)!;
}

/**
 * Nouvel élément avec ses valeurs par défaut. Les cibles (son, battlemap, scène) restent vides
 * jusqu'à ce que le MJ les choisisse dans le formulaire de l'élément.
 */
export function newElement(type: ActionElementType): ActionElement {
  const id = newId();
  switch (type) {
    case 'show-battlemap':
      return { id, type, battlemapId: '' };
    case 'play-sound':
      return { id, type, soundId: '', volume: 1, loop: false, fadeInMs: 0, fadeOutMs: 0 };
    case 'stop-sound':
      return { id, type, soundId: '' };
    case 'stop-all-sounds':
    case 'stop-video':
      return { id, type };
    case 'play-video':
      return { id, type, videoId: '', volume: 1 };
    case 'add-text':
      return { id, type, text: '' };
    case 'change-scene':
      return { id, type, sceneId: '' };
    case 'wait':
      return { id, type, seconds: 1 };
    case 'user-click':
      return { id, type, text: '' };
    case 'show-action':
    case 'hide-action':
      return { id, type, actionIds: [] };
    case 'show-sheet':
      return { id, type, sheetId: '' };
  }
}

import {
  LucideAudioLines,
  LucideClapperboard,
  LucideEye,
  LucideEyeOff,
  LucideHourglass,
  LucideIcon,
  LucideMap,
  LucideMousePointerClick,
  LucideSquareX,
  LucideType,
  LucideVolumeX,
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
}

const ICONS: Record<ActionElementType, LucideIcon> = {
  'show-battlemap': LucideMap,
  'play-sound': LucideAudioLines,
  'stop-sound': LucideVolumeX,
  'stop-all-sounds': LucideSquareX,
  'add-text': LucideType,
  'change-scene': LucideClapperboard,
  wait: LucideHourglass,
  'user-click': LucideMousePointerClick,
  'show-action': LucideEye,
  'hide-action': LucideEyeOff,
};

/** Ordre du menu « Ajouter un élément » (spécifications §4.3). */
const MENU_ORDER: readonly ActionElementType[] = [
  'show-battlemap',
  'play-sound',
  'stop-sound',
  'stop-all-sounds',
  'add-text',
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
}));

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
      return { id, type };
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
  }
}

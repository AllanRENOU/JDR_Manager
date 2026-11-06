import { Id } from './id';

/** Image de carte rattachée à une scène. */
export interface Battlemap {
  id: Id;
  sceneId: Id;
  name: string;
  /** Image stockée dans le store `media`. */
  mediaId: Id;
  order: number;
}

/** Pixels of movement before we decide whether a touch is a swipe or a scroll. */
export const SWIPE_LOCK_PX = 10;
/** A swipe must be this much wider than tall, so scrolling the list never deletes by accident. */
export const SWIPE_DOMINANCE = 1.6;
const MIN_DELETE_PX = 110;
const DELETE_FRACTION = 0.4;

export type Gesture = 'pending' | 'swipe' | 'scroll';

/** Left-to-right movement that is clearly horizontal is a swipe; anything else vertical or leftward is not. */
export function classifyGesture(dx: number, dy: number): Gesture {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < SWIPE_LOCK_PX) return 'pending';
  if (dx > 0 && ax >= ay * SWIPE_DOMINANCE) return 'swipe';
  return 'scroll';
}

/** How far a card has to travel to the right before letting go deletes it. */
export function deleteDistance(cardWidth: number): number {
  return Math.max(MIN_DELETE_PX, cardWidth * DELETE_FRACTION);
}

export function shouldDelete(dx: number, cardWidth: number): boolean {
  return dx >= deleteDistance(cardWidth);
}

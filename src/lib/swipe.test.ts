import { describe, expect, it } from 'vitest';
import { classifyGesture, deleteDistance, shouldDelete } from './swipe';

describe('swipe', () => {
  it('waits until the finger has moved a little', () => {
    expect(classifyGesture(4, 3)).toBe('pending');
  });

  it('treats a clearly horizontal left-to-right move as a swipe', () => {
    expect(classifyGesture(30, 4)).toBe('swipe');
  });

  it('leaves vertical and diagonal moves to scrolling', () => {
    expect(classifyGesture(4, 30)).toBe('scroll');
    expect(classifyGesture(30, 25)).toBe('scroll');
  });

  it('ignores right-to-left moves', () => {
    expect(classifyGesture(-40, 2)).toBe('scroll');
  });

  it('deletes after 40% of the width, but never under 110px', () => {
    expect(deleteDistance(400)).toBe(160);
    expect(deleteDistance(200)).toBe(110);
    expect(shouldDelete(159, 400)).toBe(false);
    expect(shouldDelete(160, 400)).toBe(true);
    expect(shouldDelete(109, 200)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { describeLiveUpdate } from './liveUpdate';

describe('describeLiveUpdate', () => {
  it('tells the user a new screen was received', () => {
    expect(describeLiveUpdate({ action: 'download' })).toContain('받았어요');
    expect(describeLiveUpdate({ action: 'stage', bundleId: 'x' })).toContain('받았어요');
  });

  it('explains why nothing was applied', () => {
    expect(describeLiveUpdate({ action: 'none', reason: 'current' })).toContain('최신');
    expect(describeLiveUpdate({ action: 'none', reason: 'native-too-old' })).toContain('APK');
    expect(describeLiveUpdate(null)).toContain('없어요');
  });
});

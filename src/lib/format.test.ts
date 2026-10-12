import { describe, expect, it } from 'vitest';
import { formatDayLabel, formatHeaderDate, formatTime } from './format';

describe('format', () => {
  const now = new Date(2026, 9, 12, 20, 0); // 2026-10-12 (Monday)

  it('formats the header date in Korean', () => {
    expect(formatHeaderDate(now)).toBe('10월 12일 월요일');
  });

  it('labels today, yesterday and older days', () => {
    expect(formatDayLabel('2026-10-12', now)).toBe('오늘');
    expect(formatDayLabel('2026-10-11', now)).toBe('어제');
    expect(formatDayLabel('2026-10-09', now)).toBe('10월 9일 금요일');
    expect(formatDayLabel('2025-12-31', now)).toBe('2025년 12월 31일 수요일');
  });

  it('formats 12-hour time with noon and midnight', () => {
    expect(formatTime(new Date(2026, 0, 1, 0, 5).getTime())).toBe('오전 12:05');
    expect(formatTime(new Date(2026, 0, 1, 12, 0).getTime())).toBe('오후 12:00');
    expect(formatTime(new Date(2026, 0, 1, 15, 30).getTime())).toBe('오후 3:30');
  });
});

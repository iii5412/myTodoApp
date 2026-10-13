import { describe, expect, it } from 'vitest';
import { inferSchedule } from './schedule';

const now = new Date(2026, 9, 13, 16, 20); // Tuesday; local timezone, same as the input control.
const at = (day: number, hour = 9, minute = 0, month = 9, year = 2026) => new Date(year, month, day, hour, minute).getTime();

describe('inferSchedule', () => {
  it('recognizes Korean dates, clocks, half hours and dates without times', () => {
    expect(inferSchedule('내일 오후 3시 병원', now)).toBe(at(14, 15));
    expect(inferSchedule('장보기 모레 오전 9시 반', now)).toBe(at(15, 9, 30));
    expect(inferSchedule('오늘 18:45에 운동', now)).toBe(at(13, 18, 45));
    expect(inferSchedule('내일 서류 제출', now)).toBe(at(14));
    expect(inferSchedule('모레 자정에 확인', now)).toBe(at(15, 0));
    expect(inferSchedule('내일 오전 12시 10분 확인', now)).toBe(at(14, 0, 10));
    expect(inferSchedule('내일 오후 12시 식사', now)).toBe(at(14, 12));
  });
  it('recognizes calendar dates and rolls unspecified past years forward', () => {
    expect(inferSchedule('10월 20일 오전 9시 회의', now)).toBe(at(20));
    expect(inferSchedule('2026-10-20 14:30 예약', now)).toBe(at(20, 14, 30));
    expect(inferSchedule('10/20 제출', now)).toBe(at(20));
    expect(inferSchedule('1월 2일 제출', now)).toBe(at(2, 9, 0, 0, 2027));
    expect(inferSchedule('2025년 10월 20일 기록', now)).toBe(at(20, 9, 0, 9, 2025));
  });
  it('handles week boundaries and explicit week offsets', () => {
    expect(inferSchedule('금요일 오후 2시 미팅', now)).toBe(at(16, 14));
    expect(inferSchedule('다음 주 월요일 오전 10시 출근', now)).toBe(at(19, 10));
    expect(inferSchedule('이번주 월요일 정오 정리', now)).toBe(at(12, 12));
    expect(inferSchedule('월요일 체크', now)).toBe(at(19));
  });
  it('handles relative times and the next occurrence of a clock', () => {
    expect(inferSchedule('30분 후 전화', now)).toBe(at(13, 16, 50));
    expect(inferSchedule('2시간 뒤 확인', now)).toBe(at(13, 18, 20));
    expect(inferSchedule('3일 후 오후 2시 제출', now)).toBe(at(16, 14));
    expect(inferSchedule('오후 3시 전화', now)).toBe(at(14, 15));
    expect(inferSchedule('18:00 운동', now)).toBe(at(13, 18));
    expect(inferSchedule('내일 제출', new Date(2026, 11, 31, 18))).toBe(at(1, 9, 0, 0, 2027));
  });
  it('does not guess from ordinary numbers, substrings or invalid dates/times', () => {
    for (const text of ['사과 3개', '3시간 공부', '내일모레 해야 함', '2월 30일 예약', '2026-02-29 예약', '내일 25시 회의', '내일 오후 13시 회의', '내일 18:99 회의', '0분 후 전화']) {
      expect(inferSchedule(text, now), text).toBeUndefined();
    }
  });
});

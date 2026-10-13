import { describe, expect, it } from 'vitest';
import { inferEditedSchedule, inferSchedule } from './schedule';

const now = new Date(2026, 9, 13, 16, 20); // Tuesday; local timezone, same as the input control.
const at = (day: number, hour = 9, minute = 0, month = 9, year = 2026) => new Date(year, month, day, hour, minute).getTime();

describe('inferSchedule', () => {
  it('defaults unqualified hours 1 through 6 to afternoon, including minutes and punctuation', () => {
    for (let hour = 1; hour <= 6; hour++) {
      expect(inferSchedule(`오늘 ${hour}시.회의`, now)).toBe(at(13, hour + 12));
      expect(inferSchedule(`오늘 ${hour}시 반 회의`, now)).toBe(at(13, hour + 12, 30));
      expect(inferSchedule(`오늘 ${hour}:45 회의`, now)).toBe(at(13, hour + 12, 45));
    }
    expect(inferSchedule('오늘 7시 출근', now)).toBe(at(13, 7));
    expect(inferSchedule('오늘 12시 식사', now)).toBe(at(13, 12));
    expect(inferSchedule('오늘 16시 회의', now)).toBe(at(13, 16));
    expect(inferSchedule('3시 전화', now)).toBe(at(14, 15));
    expect(inferSchedule('6시 전화', now)).toBe(at(13, 18));
  });
  it('respects explicit morning/afternoon and zero-padded 24-hour times', () => {
    for (const prefix of ['오전', '아침', '새벽']) {
      for (let hour = 1; hour <= 6; hour++) {
        expect(inferSchedule(`오늘 ${prefix} ${hour}시.출발`, now)).toBe(at(13, hour));
      }
    }
    expect(inferSchedule('오늘 오후 3시 회의', now)).toBe(at(13, 15));
    expect(inferSchedule('오늘 03:30 출발', now)).toBe(at(13, 3, 30));
    expect(inferSchedule('2026-10-20T03:00 출발', now)).toBe(at(20, 3));
    expect(inferSchedule('오늘 밤 3시 출발', now)).toBe(at(13, 3));
    expect(inferSchedule('오늘 밤 6시 출발', now)).toBe(at(13, 18));
    expect(inferSchedule('오늘 밤 9시 출발', now)).toBe(at(13, 21));
    expect(inferSchedule('오늘 밤 12시 출발', now)).toBe(at(13, 0));
  });
  it('accepts punctuation between the date, time and task without reading 반차 as half past', () => {
    expect(inferSchedule('오늘 오후 4시.반차', now)).toBe(at(13, 16));
    expect(inferSchedule('오늘,오후 4시.반차', now)).toBe(at(13, 16));
    expect(inferSchedule('내일 오후 4시 반.회의', now)).toBe(at(14, 16, 30));
    expect(inferSchedule('10월 20일,오전 9:30.회의', now)).toBe(at(20, 9, 30));
    expect(inferSchedule('오늘 정오.점심', now)).toBe(at(13, 12));
    expect(inferSchedule('30분 후.전화', now)).toBe(at(13, 16, 50));
  });
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

describe('inferEditedSchedule', () => {
  it('updates both date and time when the expression changes', () => {
    expect(inferEditedSchedule('오늘 3시 회의', '오늘 4시.반차', at(13, 15), now)).toBe(at(13, 16));
    expect(inferEditedSchedule('오늘 4시.반차', '내일 4시.반차', at(13, 16), now)).toBe(at(14, 16));
    expect(inferEditedSchedule('내일 4시.반차', '내일 새벽 4시 출발', at(14, 16), now)).toBe(at(14, 4));
    expect(inferEditedSchedule('전화하기', '내일 3시 전화하기', undefined, now)).toBe(at(14, 15));
  });
  it('keeps the existing date on description-only edits, even after the original relative day has passed', () => {
    expect(inferEditedSchedule('내일 3시 회의', '내일 3시 회의실 변경', at(12, 15), now)).toBe(at(12, 15));
    expect(inferEditedSchedule('30분 후 전화', '30분 후 전화 확인', at(13, 10), now)).toBe(at(13, 10));
    expect(inferEditedSchedule('전화하기', '거래처 전화하기', at(20, 10), now)).toBe(at(20, 10));
    expect(inferEditedSchedule('오늘 3시 회의', '오늘 3시 회의 준비', undefined, now)).toBeUndefined();
  });
  it('clears the schedule when its date/time expression is removed', () => {
    expect(inferEditedSchedule('오늘 3시 회의', '회의', at(13, 15), now)).toBeUndefined();
    expect(inferEditedSchedule('오늘 3시 회의', '오늘 25시 회의', at(13, 15), now)).toBeUndefined();
  });
});

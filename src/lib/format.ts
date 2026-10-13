const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatHeaderDate(now = new Date()): string {
  return `${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS[now.getDay()]}요일`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const period = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${hour12}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** "2026-10-12" (local day key from groupByDay) to "오늘" / "어제" / "10월 9일 목요일". */
export function formatDayLabel(day: string, now = new Date()): string {
  const [year, month, date] = day.split('-').map(Number);
  const target = new Date(year, month - 1, date);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((startOfToday.getTime() - target.getTime()) / 86_400_000);
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  const sameYear = year === now.getFullYear();
  return `${sameYear ? '' : `${year}년 `}${month}월 ${date}일 ${WEEKDAYS[target.getDay()]}요일`;
}

export function startOfToday(now = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/** datetime-local uses the device's local time, not a UTC ISO string. */
export function toDateTimeInput(timestamp?: number): string {
  if (timestamp === undefined) return '';
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeInput(value: string): number | undefined {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function formatSchedule(timestamp: number, now = new Date()): string {
  const date = new Date(timestamp);
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `${formatDayLabel(day, now)} · ${formatTime(timestamp)}`;
}

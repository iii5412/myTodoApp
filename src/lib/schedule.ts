/** Korean quick-entry dates, interpreted on the device without sending the task anywhere.
 * Date-only expressions use 09:00. Time-only expressions use the next occurrence.
 * Ambiguous/invalid expressions are left for the user to set manually.
 */
export function inferSchedule(text: string, now = new Date()): number | undefined {
  const relative = text.match(/(?:^|[\s.,!?;·，。！？])(\d+)\s*(분|시간|일)\s*(?:후|뒤)(?=$|[\s.,!?;·，。！？]|에)/);
  if (relative) {
    const amount = Number(relative[1]);
    if (amount < 1 || amount > 365) return undefined;
    const date = new Date(now);
    if (relative[2] === '일') date.setDate(date.getDate() + amount);
    else date.setMinutes(date.getMinutes() + amount * (relative[2] === '시간' ? 60 : 1));
    // An explicit clock time can accompany "3일 후".
    if (relative[2] !== '일') return date.getTime();
  }

  const date = new Date(now);
  let hasDate = false;
  const calendar = text.match(/(?:^|[\s.,!?;·，。！？])(?:(\d{4})(?:년\s*|[-/.]))?(\d{1,2})(?:월\s*|[-/])(\d{1,2})(?:일)?(?=$|[\s.,!?;·，。！？]|에|T)/);
  const day = text.match(/(?:^|[\s.,!?;·，。！？])(오늘|내일|모레)(?=$|[\s.,!?;·，。！？]|에)/);
  const weekday = text.match(/(?:^|[\s.,!?;·，。！？])(?:(이번\s*주|다음\s*주)\s*)?([월화수목금토일])요일(?=$|[\s.,!?;·，。！？]|에)/);
  if (calendar) {
    const year = calendar[1] ? Number(calendar[1]) : now.getFullYear();
    const month = Number(calendar[2]) - 1;
    const dayOfMonth = Number(calendar[3]);
    date.setFullYear(year, month, dayOfMonth);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== dayOfMonth) return undefined;
    if (!calendar[1] && new Date(year, month, dayOfMonth + 1).getTime() <= now.getTime()) {
      date.setFullYear(year + 1);
      if (date.getMonth() !== month || date.getDate() !== dayOfMonth) return undefined;
    }
    hasDate = true;
  } else if (day) {
    date.setDate(date.getDate() + ({ 오늘: 0, 내일: 1, 모레: 2 }[day[1] as '오늘' | '내일' | '모레']));
    hasDate = true;
  } else if (relative?.[2] === '일') {
    date.setDate(date.getDate() + Number(relative[1]));
    hasDate = true;
  } else if (weekday) {
    const target = '월화수목금토일'.indexOf(weekday[2]);
    const current = (now.getDay() + 6) % 7;
    const week = weekday[1]?.replace(/\s/g, '');
    date.setDate(date.getDate() + (week === '다음주' ? 7 + target - current : week === '이번주' ? target - current : (target - current + 7) % 7));
    hasDate = true;
  }

  const clock = text.match(/(?:^|[\s.,!?;·，。！？]|T)(?:(오전|오후|아침|점심|저녁|밤|새벽)\s*)?(\d{1,2})(?::(\d{2})|시(?:\s*(반|\d{1,2}\s*분))?)(?=$|[\s.,!?;·，。！？]|에|까지)/);
  let hour = 9;
  let minute = 0;
  if (clock) {
    hour = Number(clock[2]);
    minute = clock[3] ? Number(clock[3]) : clock[4] === '반' ? 30 : clock[4] ? Number(clock[4].replace(/\s*분/, '')) : 0;
    if (minute > 59 || hour > 23) return undefined;
    if (clock[1]) {
      if (hour < 1 || hour > 12) return undefined;
      hour %= 12;
      if (['오후', '점심', '저녁', '밤'].includes(clock[1])) hour += 12;
    }
  } else if (/(?:^|[\s.,!?;·，。！？])정오(?=$|[\s.,!?;·，。！？]|에)/.test(text)) {
    hour = 12;
  } else if (/(?:^|[\s.,!?;·，。！？])자정(?=$|[\s.,!?;·，。！？]|에)/.test(text)) {
    hour = 0;
  } else {
    // Don't silently replace a malformed time with the date-only default.
    if (/(?:\d+\s*시|\d+:\d+)/.test(text) || !hasDate) return undefined;
  }
  date.setHours(hour, minute, 0, 0);
  if (!hasDate && date.getTime() <= now.getTime()) date.setDate(date.getDate() + 1);
  return date.getTime();
}

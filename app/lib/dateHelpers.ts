export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function fmtTime(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const am = h < 12;
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}${m ? ':' + String(m).padStart(2, '0') : ''}${am ? 'a' : 'p'}`;
}

export function fmtTimeRange(start: Date, end: Date): string {
  const sAM = start.getHours() < 12;
  const eAM = end.getHours() < 12;
  if (sAM === eAM) {
    let h = start.getHours() % 12;
    if (h === 0) h = 12;
    const m = start.getMinutes();
    const left = `${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
    return `${left}–${fmtTime(end)}`;
  }
  return `${fmtTime(start)}–${fmtTime(end)}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_LONG  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export const fmtMonthDay  = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
export const weekdayShort = (d: Date) => DAYS_SHORT[d.getDay()];
export const weekdayLong  = (d: Date) => DAYS_LONG[d.getDay()];
export const monthName    = (d: Date) => ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()];

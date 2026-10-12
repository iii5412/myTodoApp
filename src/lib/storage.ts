import { AppData, emptyData, parseAppData } from './todos';

const KEY = 'mytodo.data.v1';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    return parseAppData(JSON.parse(raw)) ?? emptyData();
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function exportBackup(data: AppData): string {
  return JSON.stringify({ app: 'mytodo', exportedAt: new Date().toISOString(), ...data }, null, 2);
}

export function importBackup(text: string): AppData | null {
  try {
    return parseAppData(JSON.parse(text));
  } catch {
    return null;
  }
}

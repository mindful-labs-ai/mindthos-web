export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type UUID = string;

export function generateId(type?: string): UUID {
  if (!type) return crypto.randomUUID();

  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);
  const timestamp = `${yy}${MM}${dd}${HH}${mm}${ss}${ms}`;
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 7);

  return `${type}-${timestamp}-${rand}`;
}

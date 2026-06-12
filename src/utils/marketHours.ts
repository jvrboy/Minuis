export interface SessionInfo {
  name: string;
  abbr: string;
  open: number;
  close: number;
  offset: number;
}

export const FOREX_SESSIONS: SessionInfo[] = [
  { name: 'Sydney', abbr: 'SYD', open: 22, close: 7, offset: 11 },
  { name: 'Tokyo', abbr: 'TKO', open: 0, close: 9, offset: 9 },
  { name: 'London', abbr: 'LON', open: 7, close: 16, offset: 1 },
  { name: 'New York', abbr: 'NY', open: 13, close: 22, offset: -4 },
];

export function getActiveSessions(): { session: SessionInfo; minutesUntilOpen: number; minutesUntilClose: number }[] {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const currentMinute = utcHours * 60 + utcMinutes;

  return FOREX_SESSIONS.map((s) => {
    const openMin = s.open * 60;
    let closeMin = s.close * 60;
    if (closeMin <= openMin) closeMin += 1440;

    let localMin = currentMinute;
    if (closeMin <= openMin) {
      if (localMin < openMin) localMin += 1440;
    }

    const isOpen = localMin >= openMin && localMin < closeMin;
    const minutesUntilOpen = isOpen ? 0 : (openMin - localMin + 1440) % 1440;
    const minutesUntilClose = isOpen ? closeMin - localMin : 0;

    return { session: s, minutesUntilOpen, minutesUntilClose };
  });
}

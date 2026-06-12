import type { EconomicEvent, NewsFilter, Timeframe } from '../types';
import { ECONOMIC_EVENTS, COUNTRY_FLAGS } from '../constants';

const IMPACT_ORDER: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export function getUpcomingEvents(count: number = 10): EconomicEvent[] {
  const now = Date.now();
  const events: EconomicEvent[] = [];

  for (let i = 0; i < count; i++) {
    const template = ECONOMIC_EVENTS[i % ECONOMIC_EVENTS.length];
    const dayOffset = Math.floor(i / ECONOMIC_EVENTS.length) * 7;
    const hourOffset = (i % 24) * 1;
    const eventTime = now + dayOffset * 86400000 + hourOffset * 3600000;

    events.push({
      id: `eco_${i}`,
      title: template.title,
      country: template.country,
      currency: template.currency,
      time: eventTime,
      impact: template.impact,
      forecast: i % 2 === 0 ? `${(Math.random() * 2 - 1).toFixed(1)}%` : undefined,
      previous: `${(Math.random() * 2 - 1).toFixed(1)}%`,
    });
  }

  return events.sort((a, b) => a.time - b.time);
}

export function isSuppressedByNews(events: EconomicEvent[], filter: NewsFilter): boolean {
  if (!filter.enabled) return false;

  const now = Date.now();
  const minImpactLevel = IMPACT_ORDER[filter.minImpact] || 3;

  for (const ev of events) {
    const eventImpact = IMPACT_ORDER[ev.impact] || 1;
    if (eventImpact < minImpactLevel) continue;

    const before = filter.suppressMinutesBefore * 60000;
    const after = filter.suppressMinutesAfter * 60000;

    if (ev.time - before <= now && now <= ev.time + after) {
      return true;
    }
  }

  return false;
}

export function getSuppressingEvents(events: EconomicEvent[], filter: NewsFilter): EconomicEvent[] {
  if (!filter.enabled) return [];

  const now = Date.now();
  const minImpactLevel = IMPACT_ORDER[filter.minImpact] || 3;

  return events.filter((ev) => {
    const eventImpact = IMPACT_ORDER[ev.impact] || 1;
    if (eventImpact < minImpactLevel) return false;
    const before = filter.suppressMinutesBefore * 60000;
    const after = filter.suppressMinutesAfter * 60000;
    return ev.time - before <= now && now <= ev.time + after;
  });
}

export function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '';
}

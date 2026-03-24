import type { OpeningHours, Weekday } from '../../types/domain';
import { weekdays } from '../../types/domain';

export const defaultOpeningHours: OpeningHours = {
  mon: '07:00-22:00',
  tue: '07:00-22:00',
  wed: '07:00-22:00',
  thu: '07:00-22:00',
  fri: '07:00-22:00',
  sat: '07:00-22:00',
  sun: '07:00-22:00',
};

export const weekdayLabels: Record<Weekday, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export function normalizeOpeningHours(value: unknown): OpeningHours {
  const candidate = typeof value === 'object' && value !== null ? (value as Partial<OpeningHours>) : {};

  return weekdays.reduce<OpeningHours>(
    (result, day) => {
      result[day] = typeof candidate[day] === 'string' && candidate[day] ? candidate[day] : defaultOpeningHours[day];
      return result;
    },
    { ...defaultOpeningHours },
  );
}

export function formatOpeningHours(hours: OpeningHours) {
  return weekdays.map((day) => `${weekdayLabels[day]}: ${hours[day]}`).join(' | ');
}

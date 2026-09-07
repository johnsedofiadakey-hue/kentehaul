import { useState, useEffect, useCallback } from 'react';

/**
 * Single source of truth for flash sale timing.
 *
 * Replaces two near-identical countdown effects (PremiumHome and the unrouted
 * PageViews.Home) that between them had three bugs:
 *
 *   1. `flashSaleEndDate` was saved by <input type="datetime-local"> as a naive
 *      string ("2026-09-20T18:00"). `new Date()` parses that in the *viewer's*
 *      timezone, so one sale ended at six different absolute moments around the
 *      world. New writes store UTC ISO in `flashSaleEndAt`; the legacy field is
 *      still read so existing Firestore data keeps working.
 *   2. Nothing turned the sale off. At zero the banner sat on "Ends in 0d 0h 0m"
 *      and discounted prices kept applying until someone manually unticked a box.
 *      Phase is now derived from the clock, so the sale expires itself.
 *   3. There was no start date at all, so a sale could not be scheduled.
 *
 * @returns {{phase: 'idle'|'upcoming'|'live'|'ended', timeLeft: object, target: Date|null}}
 *   phase 'upcoming' — starts soon, show the teaser and count down to the start
 *   phase 'live'     — count down to the end, apply sale pricing
 *   phase 'ended'/'idle' — show nothing, apply regular pricing
 */

const MS = { day: 86400000, hour: 3600000, minute: 60000, second: 1000 };
const ZERO = { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };

/** Legacy naive datetime-local strings have no zone; anything else Date can parse. */
const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const breakdown = (ms) => {
  if (ms <= 0) return ZERO;
  return {
    days: Math.floor(ms / MS.day),
    hours: Math.floor((ms / MS.hour) % 24),
    minutes: Math.floor((ms / MS.minute) % 60),
    seconds: Math.floor((ms / MS.second) % 60),
    total: ms
  };
};

export const resolveSaleWindow = (siteContent, now = Date.now()) => {
  if (!siteContent?.flashSaleEnabled) return { phase: 'idle', timeLeft: ZERO, target: null };

  // `flashSaleEndDate` is the pre-UTC field still present in live Firestore data.
  const start = parseDate(siteContent.flashSaleStartAt);
  const end = parseDate(siteContent.flashSaleEndAt || siteContent.flashSaleEndDate);

  // A sale with no end date is an always-on toggle — the old behaviour, preserved.
  if (!end) return { phase: 'live', timeLeft: ZERO, target: null };

  if (now >= end.getTime()) return { phase: 'ended', timeLeft: ZERO, target: end };

  if (start && now < start.getTime()) {
    const teaseDays = Number(siteContent.flashSaleTeaseDays ?? 3);
    const teaseFrom = start.getTime() - teaseDays * MS.day;
    if (now < teaseFrom) return { phase: 'idle', timeLeft: ZERO, target: start };
    return { phase: 'upcoming', timeLeft: breakdown(start.getTime() - now), target: start };
  }

  return { phase: 'live', timeLeft: breakdown(end.getTime() - now), target: end };
};

/** Pure check for pricing code that has no need of a ticking countdown. */
export const isSaleLive = (siteContent, now = Date.now()) =>
  resolveSaleWindow(siteContent, now).phase === 'live';

/**
 * Phase only, without the 1s heartbeat.
 *
 * Pricing lives in App.jsx, whose re-render cascades over the whole tree — running
 * that every second to keep a countdown fresh would be wasteful. The phase only
 * changes at two known instants, so schedule a single timeout to the next boundary
 * instead. Without this, a sale that expired mid-session would keep applying
 * discounted prices to the cart until some unrelated state change forced a render.
 */
export function useSalePhase(siteContent) {
  const [phase, setPhase] = useState(() => resolveSaleWindow(siteContent).phase);

  useEffect(() => {
    let timer;
    const schedule = () => {
      const { phase: next, target } = resolveSaleWindow(siteContent);
      setPhase(next);
      // 'ended' is terminal and its target is in the past — re-arming on a past
      // target would spin a 1s timer forever. Nothing else can change the phase
      // until siteContent itself does, which re-runs this effect.
      if (next === 'ended' || !target) return;
      const delay = target.getTime() - Date.now();
      if (delay <= 0) return;
      // setTimeout saturates above ~24.9 days, so cap each hop at 6h and re-arm.
      timer = setTimeout(schedule, Math.min(delay + 250, 21600000));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [siteContent]);

  return phase;
}

/**
 * <input type="datetime-local"> has no timezone of its own — it's just
 * "2026-09-20T18:00" and every visitor's browser was parsing that as *their own*
 * local time, so one sale ended at six different real-world moments. These two
 * helpers are the only place that boundary is crossed: the admin form displays
 * and edits in Vera's local time, but only the resulting UTC ISO string is ever
 * written to Firestore, and only UTC ISO strings are ever read back by the clock.
 */
export const localInputToUtcIso = (localValue) => {
  if (!localValue) return '';
  const d = new Date(localValue); // no zone suffix -> parsed as browser-local
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

export const utcIsoToLocalInput = (isoValue) => {
  if (!isoValue) return '';
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  // datetime-local wants "YYYY-MM-DDTHH:mm" in local time, no zone suffix.
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Short local-zone label ("GMT", "GMT+1") so the admin form can show what the
 *  chosen time actually means, since the input itself renders zone-less. */
export const localZoneLabel = () => {
  try {
    return new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value || '';
  } catch {
    return '';
  }
};

export default function useSaleWindow(siteContent) {
  const compute = useCallback(() => resolveSaleWindow(siteContent), [siteContent]);
  const [state, setState] = useState(compute);

  useEffect(() => {
    setState(compute());
    // Ticking every second keeps the seconds digit honest in the final minute;
    // the old banner showed only d/h/m and appeared frozen as a sale closed.
    const timer = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(timer);
  }, [compute]);

  return state;
}

/** "2d 14h 09m" / "14h 09m 32s" — seconds appear once the finish line is close. */
export const formatTimeLeft = ({ days, hours, minutes, seconds }) => {
  const pad = (n) => String(n).padStart(2, '0');
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  return `${minutes}m ${pad(seconds)}s`;
};

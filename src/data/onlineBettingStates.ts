import { StateCode, states } from "./states";

// Active statewide online sports betting, checked 2026-11-14. Retail-only,
// on-property-only mobile and authorized-but-not-launched markets are omitted.
// Operator coverage sources are in bookAvailability.ts. RI is independently
// legal but its lottery sportsbook is outside the app's ten-operator catalog:
// https://www.rilot.com/en-us/player-zone/faqs.html
// https://webserver.rilegislature.gov/statutes/title42/42-61.2/42-61.2-16.HTM
export const onlineBettingStateCodes: readonly StateCode[] = [
  "AZ",
  "AR",
  "CO",
  "CT",
  "DE",
  "DC",
  "FL",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MO",
  "NV",
  "NH",
  "NJ",
  "NY",
  "NC",
  "OH",
  "OR",
  "PA",
  "RI",
  "TN",
  "VT",
  "VA",
  "WV",
  "WY",
];

export const onlineBettingStates = states.filter(([code]) => onlineBettingStateCodes.includes(code));
export function isOnlineBettingState(value: unknown): value is StateCode {
  return onlineBettingStates.some(([code]) => code === value);
}

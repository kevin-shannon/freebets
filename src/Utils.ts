import { BetType, BetOption, Bet } from "./enums";

export function filterBets(data: any[], betType: { value: BetType }, books_a: string[], books_b: string[], show_live: boolean, show_push: boolean): Bet[] {
  let bets: Bet[] = [];
  const func = betType.value === BetType.ARBITRAGE ? computeEv : computeConversion;
  for (let i = 0; i < data.length; i++) {
    if (data[i]["outcomes"].length !== 2) continue;
    const best = findBestPair(new Set(books_a), new Set(books_b), data[i]["outcomes"][0]["books"], data[i]["outcomes"][1]["books"], func);
    if (best !== null) {
      if (!show_push && data[i]["outcomes"][0]["name"].includes(".0")) continue;
      if (!show_live && isInPast(data[i]["start"])) continue;
      let temp: Bet = {
        sport: data[i]["sport"],
        event: data[i]["event"],
        market: data[i]["market"],
        outcomes: [
          { name: "", odds: 0, books: [] },
          { name: "", odds: 0, books: [] },
        ],
        rate: best[1],
        date: makeReadableDate(data[i]["start"]),
      };
      for (let j = 0; j < data[i]["outcomes"].length; j++) {
        temp["outcomes"][j]["name"] = data[i]["outcomes"][j]["name"];
        temp["outcomes"][j]["odds"] = best[0][j];
        temp["outcomes"][j]["books"] = data[i]["outcomes"][j]["books"][best[0][j]];
      }
      bets.push(temp);
    }
  }
  bets.sort((a, b) => b.rate - a.rate);
  return bets;
}

export function calcBetStats(
  betOption: BetOption,
  amount_a: number,
  amount_b: number,
  odds_a: number,
  odds_b: number,
  conversion: number = 70
): {
  perc: number;
  profit: number;
  won_a: string;
  won_b: string;
  sunk: string;
  net_a: string;
  net_b: string;
  won_a_2?: string;
  won_b_2?: string;
  sunk_2?: string;
  net_a_2?: string;
  net_b_2?: string;
} {
  const dec_conversion = conversion / 100;
  const decimal_a = convertAmericanToDecimal(odds_a);
  const decimal_b = convertAmericanToDecimal(odds_b);
  let perc, profit, bet_2;
  let won_a = amount_a * decimal_a;
  let won_b = amount_b * decimal_b;
  let sunk = amount_b;
  switch (betOption.value) {
    case BetType.ARBITRAGE:
      perc = Number(((computeEv(odds_a, odds_b) - 1) * 100).toFixed(2));
      sunk += amount_a;
      profit = (perc / 100) * sunk;
      break;
    case BetType.FREEBET:
      perc = Number((computeConversion(odds_a, odds_b) * 100).toFixed(2));
      won_a -= amount_a;
      profit = (perc / 100) * amount_a;
      break;
    case BetType.RISKFREE:
      perc = Number(((decimal_a - 1 - (decimal_a - dec_conversion) / decimal_b) * 100).toFixed(2));
      sunk += amount_a;
      profit = (perc / 100) * amount_a;
      bet_2 = {
        won_a_2: formatMoneyNumber(dec_conversion * amount_a, false),
        won_b_2: formatMoneyNumber(dec_conversion * amount_a, false),
        sunk_2: formatMoneyNumber(sunk - won_b, false),
        net_a_2: formatMoneyNumber(dec_conversion * amount_a + won_b - sunk, false),
        net_b_2: formatMoneyNumber(dec_conversion * amount_a + won_b - sunk, false),
      };
      break;
    default:
      throw new Error("Unknown BetType: " + betOption.value);
  }
  const net_a = won_a - sunk;
  const net_b = won_b - sunk;

  return Object.assign(
    {},
    {
      perc: perc,
      profit: profit,
      won_a: formatMoneyNumber(won_a, false),
      won_b: formatMoneyNumber(won_b, false),
      sunk: formatMoneyNumber(sunk, false),
      net_a: formatMoneyNumber(net_a, false),
      net_b: formatMoneyNumber(net_b, false),
    },
    bet_2
  );
}

export function calcHedge(betOption: BetOption, amount_a: number, odds_a: number, odds_b: number, conversion: number | typeof NaN = 70): string {
  if (amount_a === 0 || isNaN(amount_a) || isNaN(conversion)) return "";
  const dec_conversion = conversion / 100;
  const decimal_a = convertAmericanToDecimal(odds_a);
  const decimal_b = convertAmericanToDecimal(odds_b);
  let payout = amount_a * decimal_a;
  if (betOption.value === BetType.FREEBET) {
    payout -= amount_a;
  } else if (betOption.value === BetType.RISKFREE) {
    payout -= dec_conversion * amount_a;
  }
  const perfect_hedge = payout / decimal_b;
  return String(roundHedge(perfect_hedge));
}

export function formatMoneyNumber(number: number, cents: boolean = true): string {
  const sign = number < 0 ? "-" : "";
  const absNumber = Math.abs(number);
  if (cents) {
    const integerPart = Math.floor(absNumber)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const decimalPart = (absNumber % 1).toFixed(2).slice(2);
    return `${sign}$${integerPart}.${decimalPart}`;
  } else {
    const integerPart = Math.round(absNumber)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${sign}$${integerPart}`;
  }
}

export function formatOddsNumber(number: number): string {
  return number < 0 ? number.toString() : "+" + number.toString();
}

function roundHedge(num: number): number {
  if (num < 100) {
    return Math.round(num);
  } else if (num < 500) {
    const rounded2: number = Math.round(num / 2) * 2;
    const rounded5: number = Math.round(num / 5) * 5;
    if (Math.abs(num - rounded2) < Math.abs(num - rounded5)) {
      return rounded2;
    } else {
      return rounded5;
    }
  } else if (num <= 2000) {
    const rounded: number = Math.round(num / 5) * 5;
    return rounded;
  } else {
    const rounded: number = Math.round(num / 10) * 10;
    return rounded;
  }
}

function convertAmericanToDecimal(american: number): number {
  if (american > 0) {
    return 1 + american / 100;
  } else {
    return 1 - 100 / american;
  }
}

export function computeEv(oddsA: number, oddsB: number): number {
  const a: number = convertAmericanToDecimal(oddsA);
  const b: number = convertAmericanToDecimal(oddsB);
  if (a > b) {
    return a / (a / b + 1);
  } else {
    return b / (b / a + 1);
  }
}

export function computeConversion(oddsA: number, oddsB: number): number {
  const a: number = convertAmericanToDecimal(oddsA);
  const b: number = convertAmericanToDecimal(oddsB);
  return a - 1 - (a - 1) / b;
}

function findBestPair(
  A: Set<string>,
  B: Set<string>,
  alpha: { [key: number]: string[] },
  beta: { [key: number]: string[] },
  func: (arg1: number, arg2: number) => number
): [number[], number] | null {
  let maxVal: number = -Infinity;
  let bestPair: [number, number] | null = null;

  for (const v1 in alpha) {
    for (const v2 in beta) {
      const v1hasA: boolean = alpha[v1].some((val) => A.has(val));
      const v1hasB: boolean = alpha[v1].some((val) => B.has(val));
      const v2hasA: boolean = beta[v2].some((val) => A.has(val));
      const v2hasB: boolean = beta[v2].some((val) => B.has(val));
      const v1_num: number = Number(v1);
      const v2_num: number = Number(v2);
      if ((v1hasA && v2hasB) || (v1hasB && v2hasA)) {
        let val: number | null = null;
        if (v1hasA && v2hasB && v1hasB && v2hasA) {
          val = Math.max(func(v1_num, v2_num), func(v2_num, v1_num));
        } else if (v1hasB && v2hasA) {
          val = func(v2_num, v1_num);
        } else if (v1hasA && v2hasB) {
          val = func(v1_num, v2_num);
        }
        if (val !== null && val > maxVal) {
          maxVal = val;
          bestPair = [v1_num, v2_num];
        }
      }
    }
  }

  if (bestPair === null) {
    return null;
  } else {
    return [bestPair, maxVal];
  }
}

function makeReadableDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    // Format for today: Today at XX:XX 12 hour clock
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    const formattedDate = `Today at ${hours}:${minutes} ${ampm}`;
    return formattedDate;
  } else {
    // Format for other days: Day of week, date at XX:XX 12 hour clock
    const weekdays: string[] = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];
    const dayOfWeek = weekdays[date.getDay()];
    const month = date.toLocaleString("default", { month: "long" });
    const day = date.getDate();
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    const formattedDate = `${dayOfWeek}, ${month} ${day} at ${hours}:${minutes} ${ampm}`;
    return formattedDate;
  }
}

function isInPast(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
}

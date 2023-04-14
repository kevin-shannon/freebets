import { BetType } from "./enums";

export function filterBets(data, betType, books_a, books_b, show_live, show_push) {
  let bets = [];
  const func = betType.value === BetType.ARBITRAGE ? computeEv : computeConversion;
  for (let i = 0; i < data.length; i++) {
    if (data[i]["outcomes"].length !== 2) continue;
    const best = findBestPair(new Set(books_a), new Set(books_b), data[i]["outcomes"][0]["books"], data[i]["outcomes"][1]["books"], func);
    if (best !== null) {
      if (!show_push && data[i]["outcomes"][0]["name"].includes(".0")) continue;
      if (!show_live && isInPast(data[i]["start"])) continue;
      let temp = {
        sport: data[i]["sport"],
        event: data[i]["event"],
        market: data[i]["market"],
        outcomes: [{}, {}],
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

export function calcHedge(betType, amount_a, odds_a, odds_b, conversion = 0.7) {
  if (amount_a === 0 || isNaN(amount_a)) return "";
  const decimal_a = convertAmericanToDecimal(odds_a);
  const decimal_b = convertAmericanToDecimal(odds_b);
  let payout = amount_a * decimal_a;
  if (betType.value === BetType.ARBITRAGE) {
  } else if (betType.value === BetType.FREEBET) {
    payout -= amount_a;
  } else if (betType.value === BetType.RISKFREE) {
    payout -= conversion * amount_a;
  } else {
    throw new Error(`Invalid bet type: ${betType.value}`);
  }
  const perfect_hedge = payout / decimal_b;
  return roundHedge(perfect_hedge);
}

export function calcPerc(betType, odds_a, odds_b, conversion = 0.7) {
  if (betType.value === BetType.ARBITRAGE) {
    return ((computeEv(odds_a, odds_b) - 1) * 100).toFixed(2);
  } else if (betType.value === BetType.FREEBET) {
    return (computeConversion(odds_a, odds_b) * 100).toFixed(2);
  } else if (betType.value === BetType.RISKFREE) {
    const decimal_a = convertAmericanToDecimal(odds_a);
    const decimal_b = convertAmericanToDecimal(odds_b);
    return ((decimal_a - 1 - (decimal_a - conversion) / decimal_b) * 100).toFixed(2);
  } else {
    throw new Error(`Invalid bet type: ${betType.value}`);
  }
}

export function calcProfitNum(betType, amount_a, amount_b, odds_a, odds_b, conversion = 0.7) {
  const decimal_a = convertAmericanToDecimal(odds_a);
  const decimal_b = convertAmericanToDecimal(odds_b);
  let payout_a = amount_a * decimal_a;
  let payout_b = amount_b * decimal_b;
  let sunk = amount_b;
  if (betType.value === BetType.ARBITRAGE) {
    sunk += amount_a;
  } else if (betType.value === BetType.FREEBET) {
    payout_a -= amount_a;
  } else if (betType.value === BetType.RISKFREE) {
    sunk += amount_a;
    payout_b += conversion * amount_a;
  } else {
    throw new Error(`Invalid bet type: ${betType.value}`);
  }
  const profit_a = (payout_a - sunk).toFixed(2);
  const profit_b = (payout_b - sunk).toFixed(2);
  return [profit_a, profit_b];
}

export function formatMoneyNumber(number) {
  const sign = number < 0 ? "-" : "";
  const absNumber = Math.abs(number);
  const integerPart = Math.floor(absNumber)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decimalPart = (absNumber % 1).toFixed(2).slice(2);
  return `${sign}$${integerPart}.${decimalPart}`;
}

export function formatOddsNumber(number) {
  return number < 0 ? number : "+" + number;
}

function roundHedge(num) {
  if (num < 100) {
    return Math.round(num);
  } else if (num < 500) {
    const rounded2 = Math.round(num / 2) * 2;
    const rounded5 = Math.round(num / 5) * 5;
    if (Math.abs(num - rounded2) < Math.abs(num - rounded5)) {
      return rounded2;
    } else {
      return rounded5;
    }
  } else if (num <= 2000) {
    const rounded = Math.round(num / 5) * 5;
    return rounded;
  } else {
    const rounded = Math.round(num / 10) * 10;
    return rounded;
  }
}

function convertAmericanToDecimal(american) {
  if (american > 0) {
    return 1 + american / 100;
  } else {
    return 1 - 100 / american;
  }
}

export function computeEv(oddsA, oddsB) {
  const a = convertAmericanToDecimal(oddsA);
  const b = convertAmericanToDecimal(oddsB);
  if (a > b) {
    return a / (a / b + 1);
  } else {
    return b / (b / a + 1);
  }
}

export function computeConversion(oddsA, oddsB) {
  const a = convertAmericanToDecimal(oddsA);
  const b = convertAmericanToDecimal(oddsB);
  return a - 1 - (a - 1) / b;
}

function findBestPair(A, B, alpha, beta, func) {
  let maxVal = null;
  let bestPair = null;

  for (const v1 in alpha) {
    for (const v2 in beta) {
      const v1hasA = alpha[v1].some((val) => A.has(val));
      const v1hasB = alpha[v1].some((val) => B.has(val));
      const v2hasA = beta[v2].some((val) => A.has(val));
      const v2hasB = beta[v2].some((val) => B.has(val));
      if ((v1hasA && v2hasB) || (v1hasB && v2hasA)) {
        let val;
        if (v1hasA && v2hasB && v1hasB && v2hasA) {
          val = Math.max(func(v1, v2), func(v2, v1));
        } else if (v1hasB && v2hasA) {
          val = func(v2, v1);
        } else if (v1hasA && v2hasB) {
          val = func(v1, v2);
        }
        if (maxVal === null || val > maxVal) {
          maxVal = val;
          bestPair = [v1, v2];
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

function makeReadableDate(dateString) {
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
    const weekdays = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];
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

function isInPast(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
}

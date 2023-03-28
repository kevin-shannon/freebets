export default function filterBets(data, betType, books_a, books_b) {
  let bets = [];
  const func = betType.value === "arbitrage" ? computeEv : computeConversion;
  for (let i = 0; i < data.length; i++) {
    const best = findBestPair(new Set(books_a), new Set(books_b), data[i]["outcomes"][0]["books"], data[i]["outcomes"][1]["books"], func);
    if (best !== null) {
      if (betType.value !== "arbitrage" && data[i]["market"].includes(".0")) continue;
      let temp = { sport: data[i]["sport"], event: data[i]["event"], market: data[i]["market"], outcomes: [{}, {}], rate: best[1] };
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

function convertAmericanToDecimal(american) {
  if (american > 0) {
    return 1 + american / 100;
  } else {
    return 1 - 100 / american;
  }
}

function computeEv(oddsA, oddsB) {
  const a = convertAmericanToDecimal(oddsA);
  const b = convertAmericanToDecimal(oddsB);
  if (a > b) {
    return a / (a / b + 1);
  } else {
    return b / (b / a + 1);
  }
}

function computeConversion(oddsA, oddsB) {
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

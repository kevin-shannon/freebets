import React, { SetStateAction } from "react";
import "./CalcTab.css";
import "react-orgchart/index.css";
import { Box, Typography } from "@mui/material";
import CurrencyInput from "react-currency-input-field";
import { calcHedge, formatMoneyNumber, formatOddsNumber } from "../../Utils";
import { BetOption, BetType } from "../../enums";

interface CalcTabProps {
  betOption: BetOption;
  amount_a: string;
  setAmount_a: React.Dispatch<SetStateAction<string>>;
  amount_b: string;
  setAmount_b: React.Dispatch<SetStateAction<string>>;
  conversion: string;
  setConversion: React.Dispatch<SetStateAction<string>>;
  bet_a: string;
  bet_b: string;
  odds_a: number;
  odds_b: number;
  stats: {
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
  };
}

export default function CalcTab({
  betOption,
  amount_a,
  setAmount_a,
  amount_b,
  setAmount_b,
  conversion,
  setConversion,
  bet_a,
  bet_b,
  odds_a,
  odds_b,
  stats,
}: CalcTabProps) {
  if (amount_a === undefined) setAmount_a("");

  let label_a, label_b;
  if (betOption.value === BetType.ARBITRAGE) {
    label_a = "Bet Amount";
    label_b = "Bet Amount";
  } else if (betOption.value === BetType.FREEBET) {
    label_a = "Free Bet";
    label_b = "Hedge Bet";
  } else if (betOption.value === BetType.RISKFREE) {
    label_a = "Risk Free Bet";
    label_b = "Hedge Bet";
  }

  const handleCoversionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let input = event.target.value;
    input = input.replace(/^0+(?!$)|^00/, "");
    if (/^$|^(0|[1-9][0-9]?)$/.test(input) || input === "100") {
      setConversion(input);
      setAmount_b(calcHedge(betOption, Number(amount_a), odds_a, odds_b, parseInt(input)));
    }
  };

  const handleAmountAChange = (value: string | undefined) => {
    if (value === undefined) {
      setAmount_a("");
      setAmount_b("");
    } else {
      setAmount_a(value);
      if (conversion !== "") setAmount_b(calcHedge(betOption, Number(value), odds_a, odds_b, Number(conversion)));
    }
  };

  const handleAmountBChange = (value: string | undefined) => {
    if (value === undefined) {
      setAmount_a("");
      setAmount_b("");
    } else if (betOption.value === BetType.ARBITRAGE && value !== undefined) {
      setAmount_a(calcHedge(betOption, Number(value), odds_b, odds_a, Number(conversion)));
      setAmount_b(value);
    }
  };

  return (
    <Box>
      <table className="calc-table">
        <tbody>
          <tr>
            <td className="calc-bet-name">{bet_a}</td>
            <td className="calc-bet-name">{bet_b}</td>
          </tr>
          <tr>
            <td>
              <div className="input-container">
                <div className="input-cell dynamic-cell">
                  <label className="input-label">Odds</label>
                  <input className="calc-input dynamic-cell" disabled={true} value={formatOddsNumber(odds_a)} readOnly></input>
                </div>
              </div>
            </td>
            <td>
              <div className="input-container">
                <div className="input-cell dynamic-cell">
                  <label className="input-label">Odds</label>
                  <input className="calc-input dynamic-cell" disabled={true} value={formatOddsNumber(odds_b)} readOnly></input>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div className="input-container">
                <div className="input-cell dynamic-cell">
                  <label className="input-label">{label_a}</label>
                  <CurrencyInput
                    className={amount_a === "" || amount_a === "0" ? "calc-input dynamic-cell empty" : "calc-input dynamic-cell"}
                    prefix="$"
                    allowDecimals={false}
                    allowNegativeValue={false}
                    disableAbbreviations={true}
                    value={amount_a}
                    onValueChange={handleAmountAChange}
                    maxLength={4}
                  />
                </div>
              </div>
            </td>
            <td>
              <div className="input-container">
                <div className="input-cell dynamic-cell">
                  <label className="input-label">{label_b}</label>
                  <CurrencyInput
                    className={betOption.value === BetType.ARBITRAGE ? "calc-input dynamic-cell" : "calc-input dynamic-cell hedge-input"}
                    prefix="$"
                    allowDecimals={false}
                    allowNegativeValue={false}
                    disableAbbreviations={true}
                    value={amount_b}
                    onValueChange={handleAmountBChange}
                    maxLength={4}
                    readOnly={betOption.value === BetType.ARBITRAGE ? false : true}
                  />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      {betOption.value === BetType.RISKFREE ? (
        <div className="conversion-container">
          <label className="input-label">Conversion</label>
          <div className="conversion-full-input">
            <input className="conversion-input" value={conversion} type="number" onChange={handleCoversionChange} />
            <div className="conversion-adornment">
              <span>%</span>
            </div>
          </div>
        </div>
      ) : null}
      <Box
        className={amount_a === "" || amount_a === "0" || conversion === "" ? "profit-box hidden" : "profit-box"}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
      >
        <Typography style={{ fontSize: "x-large" }}>
          <span>$ Profit ~ {formatMoneyNumber(stats.profit)}</span>
        </Typography>
        <Typography style={{ fontSize: "large" }}>
          <span>% Profit ~ {stats.perc}%</span>
        </Typography>
      </Box>
    </Box>
  );
}
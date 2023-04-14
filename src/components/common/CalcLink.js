import "./CalcLink.css";
import React, { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import { calcHedge, calcPerc, computeEv, computeConversion, formatMoneyNumber, formatOddsNumber } from "../../Utils";
import { BetType } from "../../enums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator } from "@fortawesome/free-solid-svg-icons";
import CurrencyInput from "react-currency-input-field";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  minWidth: 300,
  width: "50%",
  maxWidth: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "8px",
  p: 4,
};

export default function ModalLink({ bet, betType, mode }) {
  const [open, setOpen] = useState(false);
  const [amount_a, setAmount_a] = useState("");
  const [conversion, setConversion] = useState(70);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setAmount_a("");
    setConversion(70);
  };
  const func = betType.value === BetType.ARBITRAGE ? computeEv : computeConversion;
  const ba = Math.abs(func(bet.outcomes[0].odds, bet.outcomes[1].odds) - bet.rate);
  const ab = Math.abs(func(bet.outcomes[1].odds, bet.outcomes[0].odds) - bet.rate);
  const odds_a = ab > ba ? bet.outcomes[0].odds : bet.outcomes[1].odds;
  const odds_b = ab > ba ? bet.outcomes[1].odds : bet.outcomes[0].odds;
  const bet_a = ab > ba ? bet.outcomes[0].name : bet.outcomes[1].name;
  const bet_b = ab > ba ? bet.outcomes[1].name : bet.outcomes[0].name;
  if (amount_a === undefined) setAmount_a(0);
  const amount_b = calcHedge(betType, Number(amount_a), odds_a, odds_b, conversion / 100);
  const perc = calcPerc(betType, odds_a, odds_b, conversion / 100);
  const profit = (Number(perc) / 100) * Number(amount_a);
  let label_a, label_b;
  if (betType.value === BetType.ARBITRAGE) {
    label_a = "Bet Amount";
    label_b = "Bet Amount";
  } else if (betType.value === BetType.FREEBET) {
    label_a = "Free Bet";
    label_b = "Hedge Bet";
  } else if (betType.value === BetType.RISKFREE) {
    label_a = "Risk Free Bet";
    label_b = "Hedge Bet";
  } else {
    throw new Error(`Invalid bet type: ${betType.value}`);
  }

  const handleChange = (event) => {
    let input = event.target.value;
    input = input.replace(/^0+(?!$)|^00/, "");
    if (/^$|^(0|[1-9][0-9]?)$/.test(input) || input === "100") {
      setConversion(input);
    }
  };

  return (
    <div>
      <button className="foot-link" onClick={handleOpen}>
        {mode === 2 ? (
          <FontAwesomeIcon className="card-calc-link" size="2x" icon={faCalculator} />
        ) : (
          <FontAwesomeIcon className="slab-calc-link" size="2x" icon={faCalculator} />
        )}
      </button>
      <Modal open={open} onClose={handleClose} disableAutoFocus={true} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <Box sx={style}>
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
                        className={amount_a === "" || amount_a === 0 ? "calc-input dynamic-cell empty" : "calc-input dynamic-cell"}
                        decimalsLimit={2}
                        prefix="$"
                        disableAbbreviations={true}
                        allowNegativeValue={false}
                        maxLength={7}
                        onValueChange={setAmount_a}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="input-container">
                    <div className="input-cell dynamic-cell">
                      <label className="input-label">{label_b}</label>
                      <CurrencyInput
                        className="calc-input dynamic-cell"
                        decimalsLimit={2}
                        prefix="$"
                        allowNegativeValue={false}
                        disableAbbreviations={true}
                        value={amount_b}
                        readOnly
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          {betType.value === BetType.RISKFREE ? (
            <div className="conversion-container">
              <label className="input-label">Conversion</label>
              <div className="conversion-full-input">
                <input className="conversion-input" value={conversion} onChange={handleChange} />
                <div className="conversion-adornment">
                  <span>%</span>
                </div>
              </div>
            </div>
          ) : null}
          <Box className="profit-box" display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
            <Typography style={{ fontSize: "x-large" }}>
              <span style={{ fontFamily: "Roboto Mono, monospace" }}>$</span> <span>Profit</span>
              <span> ~ </span>
              <span>{formatMoneyNumber(profit)}</span>
            </Typography>
            <Typography style={{ fontSize: "large" }}>
              <span style={{ fontFamily: "Roboto Mono, monospace" }}>%</span> <span>Profit</span>
              <span> ~ </span>
              <span>{perc}%</span>
            </Typography>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}

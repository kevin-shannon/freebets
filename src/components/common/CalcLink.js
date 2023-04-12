import "./CalcLink.css";
import React, { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import { calcHedge, calcProfitNum, computeEv, computeConversion, formatMoneyNumber, formatOddsNumber } from "../../Utils";
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
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const func = betType.value === BetType.ARBITRAGE ? computeEv : computeConversion;
  const ba = Math.abs(func(bet.outcomes[0].odds, bet.outcomes[1].odds) - bet.rate);
  const ab = Math.abs(func(bet.outcomes[1].odds, bet.outcomes[0].odds) - bet.rate);
  const odds_a = ab > ba ? bet.outcomes[0].odds : bet.outcomes[1].odds;
  const odds_b = ab > ba ? bet.outcomes[1].odds : bet.outcomes[0].odds;
  const bet_a = ab > ba ? bet.outcomes[0].name : bet.outcomes[1].name;
  const bet_b = ab > ba ? bet.outcomes[1].name : bet.outcomes[0].name;
  const amount_b = calcHedge(betType, Number(amount_a), odds_a, odds_b);
  const profit = calcProfitNum(betType, Number(amount_a), Number(amount_b), odds_a, odds_b);

  function handleKeyDown(event) {
    if (event.key === "-" || event.key === "+" || event.key === "e" || event.key === "E" || (event.target.value === "" && event.key === ".")) {
      event.preventDefault();
    }
  }

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
                    <div className="input-cell">
                      <label className="input-label">Odds</label>
                      <input value={formatOddsNumber(odds_a)} readOnly></input>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="input-container">
                    <div className="input-cell">
                      <label className="input-label">Odds</label>
                      <input value={formatOddsNumber(odds_b)} readOnly></input>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="input-container">
                    <div className="input-cell">
                      <label className="input-label">Free Bet</label>
                      <CurrencyInput
                        decimalsLimit={2}
                        prefix="$"
                        disableAbbreviations={true}
                        allowNegativeValue={false}
                        maxLength={7}
                        onValueChange={setAmount_a}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="input-container">
                    <div className="input-cell">
                      <label className="input-label">Hedge Bet</label>
                      <CurrencyInput decimalsLimit={2} prefix="$" allowNegativeValue={false} disableAbbreviations={true} value={amount_b} readOnly />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <Box className="profit-box" display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
            <Typography>
              <span style={{ fontFamily: "Roboto Mono, monospace" }}>$</span> <span style={{ fontSize: "large" }}>Profit</span>
              <span> ~ </span>
              <span style={{ fontSize: "large" }}>{formatMoneyNumber((Number(profit[0]) + Number(profit[1])) / 2)}</span>
            </Typography>
            <Typography>
              <span style={{ fontFamily: "Roboto Mono, monospace" }}>%</span> <span style={{ fontSize: "large" }}>Profit</span>
              <span> ~ </span>
              <span style={{ fontSize: "large" }}>{(bet.rate * 100).toFixed(2)}%</span>
            </Typography>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}

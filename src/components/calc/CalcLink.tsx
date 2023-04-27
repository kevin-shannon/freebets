import React from "react";
import "./CalcLink.css";
import { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import { calcHedge, calcPerc, computeEv, computeConversion, formatMoneyNumber, formatOddsNumber, calcWonSunkNet } from "../../Utils";
import { Bet, BetOption, BetType, ScreenType, Node } from "../../enums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator } from "@fortawesome/free-solid-svg-icons";
import CurrencyInput from "react-currency-input-field";
import OrgChart from "react-orgchart";
import "react-orgchart/index.css";
import OutcomesCell from "./OutcomesCell";
import OutcomeCell from "./OutcomeCell";
import EvalCell from "./EvalCell";

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

interface ModalLinkProps {
  bet: Bet;
  betOption: BetOption;
  screenType: ScreenType;
}

export default function ModalLink({ bet, betOption, screenType }: ModalLinkProps) {
  const [open, setOpen] = useState(false);
  const [amount_a, setAmount_a] = useState("");
  const [amount_b, setAmount_b] = useState("");
  const [conversion, setConversion] = useState(70);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setAmount_a("");
    setAmount_b("");
    setConversion(70);
  };
  const func = betOption.value === BetType.ARBITRAGE ? computeEv : computeConversion;
  const ba = Math.abs(func(bet.outcomes[0].odds, bet.outcomes[1].odds) - bet.rate);
  const ab = Math.abs(func(bet.outcomes[1].odds, bet.outcomes[0].odds) - bet.rate);
  const odds_a = ab > ba ? bet.outcomes[0].odds : bet.outcomes[1].odds;
  const odds_b = ab > ba ? bet.outcomes[1].odds : bet.outcomes[0].odds;
  const bet_a = ab > ba ? bet.outcomes[0].name : bet.outcomes[1].name;
  const bet_b = ab > ba ? bet.outcomes[1].name : bet.outcomes[0].name;
  if (amount_a === undefined) setAmount_a("");
  const perc = calcPerc(betOption, odds_a, odds_b, conversion / 100);
  const profit = (Number(perc) / 100) * Number(amount_a);
  const won_sunk_net = calcWonSunkNet(betOption, Number(amount_a), Number(amount_b), odds_a, odds_b, conversion);
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
      setConversion(parseInt(input));
      setAmount_b(calcHedge(betOption, Number(amount_a), odds_a, odds_b, conversion / 100));
    }
  };

  const handleAmountAChange = (value: string | undefined) => {
    if (value !== undefined) {
      setAmount_a(value);
      setAmount_b(calcHedge(betOption, Number(value), odds_a, odds_b, conversion / 100));
    }
  };

  const handleAmountBChange = (value: string | undefined) => {
    if (betOption.value === BetType.ARBITRAGE && value !== undefined) {
      setAmount_a(calcHedge(betOption, Number(value), odds_b, odds_a, conversion / 100));
      setAmount_b(value);
    }
  };

  let org = {
    bet_a: bet_a,
    bet_b: bet_b,
    amount_a: amount_a,
    amount_b: amount_b,
    children: [
      {
        name: bet_a,
        children: [{}],
      },
      {
        name: bet_b,
        children: [{}],
      },
    ],
  };

  const ScenarioNode = ({ node }: {node: Node}) => {
    switch(node.type) {
      case "OutcomesNode":
        return <OutcomesCell bet_a={node.bet_a} amount_a={node.amount_a} bet_b={node.bet_b} amount_b={node.amount_b} />;
      case "OutcomeNode":
        return <OutcomeCell name={node.name} />;
      case "EvalNode":
        return <EvalCell won={node.won} sunk={node.sunk} net={node.net} bonus={node.bonus} />;
      default:
        return null;
    }
  }

  if (betOption.value === BetType.ARBITRAGE) {
    org.children[0].children[0] = {
      type: "EvalCell",
      won: won_sunk_net.won_a,
      sunk: won_sunk_net.sunk,
      net: won_sunk_net.net_a,
    };
    org.children[1].children[0] = {
      type: "EvalCell",
      won: won_sunk_net.won_b,
      sunk: won_sunk_net.sunk,
      net: won_sunk_net.net_b,
    };
  } else if (betOption.value === BetType.FREEBET) {
  } else if (betOption.value === BetType.RISKFREE) {
  }

  return (
    <div className="calc-button-container">
      <button className="foot-link" onClick={handleOpen}>
        {screenType === "small" ? (
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
                        className={amount_a === "" || amount_a === "0" ? "calc-input dynamic-cell empty" : "calc-input dynamic-cell"}
                        decimalsLimit={2}
                        prefix="$"
                        allowNegativeValue={false}
                        disableAbbreviations={true}
                        value={amount_a}
                        onValueChange={handleAmountAChange}
                        maxLength={7}
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
                        decimalsLimit={2}
                        prefix="$"
                        allowNegativeValue={false}
                        disableAbbreviations={true}
                        value={amount_b}
                        onValueChange={handleAmountBChange}
                        maxLength={7}
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
            className={amount_a === "" || amount_a === "0" ? "profit-box hidden" : "profit-box"}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <Typography style={{ fontSize: "x-large" }}>
              <span>$ Profit ~ {formatMoneyNumber(profit)}</span>
            </Typography>
            <Typography style={{ fontSize: "large" }}>
              <span>% Profit ~ {perc}%</span>
            </Typography>
          </Box>
          <OrgChart tree={org} NodeComponent={ScenarioNode} />
        </Box>
      </Modal>
    </div>
  );
}

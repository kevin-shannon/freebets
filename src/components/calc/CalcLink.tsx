import { useState } from "react";
import "./CalcLink.css";
import "react-orgchart/index.css";
import { Bet, BetOption, ScreenType, BetType } from "../../enums";
import { ReactComponent as Sitemap } from "../../icons/sitemap.svg";
import { ReactComponent as Calculator } from "../../icons/calculator.svg";
import { computeEv, computeConversion, calcBetStats } from "../../Utils";
import CalcTab from "./CalcTab";
import ScenarioTab from "./ScenarioTab";
import { Tab, TabList, Tabs, Modal, ModalClose } from "@mui/joy";
import Sheet from "@mui/joy/Sheet";

const style = {
  width: "clamp(300px, 90vw, 500px)",
  margin: "auto",
  height: "fit-content",
  "& .MuiModal-backdrop": {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
};

const sheetStyle = {
  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)",
  borderRadius: "20px",
  p: "12px",
  width: "clamp(300px, 90vw-24px, 500px)",
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
  const [conversion, setConversion] = useState("70");
  const [activeTab, setActiveTab] = useState(0);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setAmount_a("");
    setAmount_b("");
    setConversion("70");
    setActiveTab(0);
  };

  let odds_a, odds_b, bet_a, bet_b;
  const func = betOption.value === BetType.ARBITRAGE ? computeEv : computeConversion;
  if (Math.abs(func(bet.outcomes[0].odds, bet.outcomes[1].odds) - bet.rate) > Math.abs(func(bet.outcomes[1].odds, bet.outcomes[0].odds) - bet.rate)) {
    odds_a = bet.outcomes[1].odds;
    odds_b = bet.outcomes[0].odds;
    bet_a = bet.outcomes[1].name;
    bet_b = bet.outcomes[0].name;
  } else {
    odds_a = bet.outcomes[0].odds;
    odds_b = bet.outcomes[1].odds;
    bet_a = bet.outcomes[0].name;
    bet_b = bet.outcomes[1].name;
  }
  const stats = calcBetStats(betOption, Number(amount_a), Number(amount_b), odds_a, odds_b, Number(conversion));

  const handleTabSelect = (_event: any, index: any) => {
    setActiveTab(index);
  };

  return (
    <div className="calc-button-container">
      <button className="foot-link" onClick={handleOpen}>
        {screenType === "small" ? <Calculator className="card-calc-link" /> : <Calculator className="slab-calc-link" />}
      </button>
      <Modal open={open} onClose={handleClose} disableAutoFocus={true} sx={style}>
        <Sheet sx={sheetStyle}>
          <ModalClose />
          {activeTab === 0 && (
            <CalcTab
              betOption={betOption}
              amount_a={amount_a}
              setAmount_a={setAmount_a}
              amount_b={amount_b}
              setAmount_b={setAmount_b}
              conversion={conversion}
              setConversion={setConversion}
              bet_a={bet_a}
              bet_b={bet_b}
              odds_a={odds_a}
              odds_b={odds_b}
              stats={stats}
            />
          )}
          {activeTab === 1 && <ScenarioTab betOption={betOption} amount_a={amount_a} amount_b={amount_b} bet_a={bet_a} bet_b={bet_b} stats={stats} />}
          <Tabs className="calc-tabs" aria-label="Icon tabs" defaultValue={0} onChange={handleTabSelect} size="md">
            <TabList>
              <Tab>
                <Calculator className="tab-icon" />
              </Tab>
              {amount_a !== "" && amount_b !== "" ? (
                <Tab>
                  <Sitemap className="tab-icon" />
                </Tab>
              ) : (
                <Tab disabled sx={{ opacity: "50%" }}>
                  <Sitemap className="tab-icon" />
                </Tab>
              )}
            </TabList>
          </Tabs>
        </Sheet>
      </Modal>
    </div>
  );
}

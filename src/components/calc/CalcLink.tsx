import { useState, useRef, useEffect } from "react";
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
import SwipeableViews from "react-swipeable-views";

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
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setAmount_a("");
    setAmount_b("");
    setConversion("70");
    setActiveTab(0);
  };
  const fixCalcHeights = () => {
    if (div1Ref.current && div2Ref.current) div2Ref.current.style.height = `${div1Ref.current.clientHeight}px`;
  };

  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fixCalcHeights();
  }, []);

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
    fixCalcHeights();
  };

  return (
    <div className="calc-button-container">
      <button className="foot-link" onClick={handleOpen}>
        {screenType === "small" ? <Calculator className="card-calc-link" /> : <Calculator className="slab-calc-link" />}
      </button>
      <Modal open={open} onClose={handleClose} disableAutoFocus={true} sx={style} keepMounted={true}>
        <Sheet sx={sheetStyle}>
          <ModalClose />
          <div className="calc-title-container">
            <h3 className="calc-title-event">{bet.event}</h3>
            <h2 className="calc-title-market">{bet.market}</h2>
          </div>
          <SwipeableViews
            index={activeTab}
            onChangeIndex={handleTabSelect}
            containerStyle={{
              transition: "transform 0.35s cubic-bezier(0.15, 0.3, 0.25, 1) 0s",
            }}
          >
            <div className="calc-content" ref={div1Ref}>
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
            </div>
            <div className="calc-content" ref={div2Ref}>
              <ScenarioTab betOption={betOption} amount_a={amount_a} amount_b={amount_b} bet_a={bet_a} bet_b={bet_b} stats={stats} />
            </div>
          </SwipeableViews>
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

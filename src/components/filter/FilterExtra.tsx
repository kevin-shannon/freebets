import "./FilterExtra.css";
import React from "react";
import Switch from "../common/Switch";
import { ReactComponent as Info } from "../../icons/info.svg";
import { ReactComponent as Chevron } from "../../icons/chevron-down.svg";
import { Tooltip } from "react-tooltip";
import OddsInput from "./OddsInput";

export default function FilterExtra() {
  const [checked, setChecked] = React.useState(false);

  const handleToggle = () => {
    setChecked(!checked);
  };

  return (
    <div className="filter-b">
      <div className={`filter-a ${checked ? "checked" : ""}`}>
        <div className="filter-extra">
          <div className="filter-col">
            <div className="filter-cell">
              <div className="optional-label">
                <label className="input-helper" htmlFor="min-odds-input">
                  Min Odds
                </label>
                <span className="optional-tag">(optional)</span>
              </div>
              <OddsInput sign={"-"} />
            </div>
            <div className="filter-cell">
              <div className="optional-label">
                <label className="input-helper" htmlFor="max-odds-input">
                  Max Odds
                </label>
                <span className="optional-tag">(optional)</span>
              </div>
              <OddsInput sign={"+"} />
            </div>
          </div>
          <div
            className="filter-col"
            style={{
              marginTop: "16px",
            }}
          >
            <div className="filter-cell" style={{ flexDirection: "row", alignItems: "center" }}>
              <Switch label={"Live Bets"} />
              <span
                className="info-span"
                data-tooltip-id="live-tooltip"
                data-tooltip-html="Live bets have fast moving<br /> odds and are inheritly more <br />risky. Recommend: Off"
              >
                <Info className="info-circle" />
              </span>
              <Tooltip id="live-tooltip" style={{ backgroundColor: "rgb(65 62 73)", color: "#fff", opacity: 1, borderRadius: "8px" }} place="top" />
            </div>
            <div className="filter-cell" style={{ flexDirection: "row", alignItems: "center" }}>
              <Switch label={"Push Bets"} />
              <span
                className="info-span"
                data-tooltip-id="push-tooltip"
                data-tooltip-html="Push bets are bets have a <br /> chance of neither bet hitting,<br /> Risk-Free/Free bets will not <br />be refunded. Recommend: Off"
              >
                <Info className="info-circle" />
              </span>
              <Tooltip id="push-tooltip" style={{ backgroundColor: "rgb(65 62 73)", color: "#fff", opacity: 1, borderRadius: "8px" }} place="right" />
            </div>
            <div className="filter-cell" style={{ flexDirection: "row", alignItems: "center" }}>
              <Switch label={"Only Today"} />
              <span className="info-span" data-tooltip-id="today-tooltip" data-tooltip-html="Only shows bets that resolve <br /> today. Time is money!">
                <Info className="info-circle" />
              </span>
              <Tooltip id="today-tooltip" style={{ backgroundColor: "rgb(65 62 73)", color: "#fff", opacity: 1, borderRadius: "8px" }} place="bottom" />
            </div>
          </div>
        </div>
      </div>
      <button className="show-more-less-button" onClick={handleToggle}>
        <div className="show-more-less-container">
          {checked ? "Show less" : "Show more"} <Chevron className={`chevron ${checked ? "checked" : ""}`} />
        </div>
      </button>
    </div>
  );
}

import "./FilterExtra.css";
import React, { useId, useState } from "react";
import Switch from "../common/Switch";
import { ReactComponent as Chevron } from "../../icons/chevron-down.svg";
import OddsInput from "./OddsInput";
import { AmericanOdds } from "../../enums";

interface FilterExtraProps {
  maxOdds: AmericanOdds;
  setMaxOdds: React.Dispatch<React.SetStateAction<AmericanOdds>>;
  minOdds: AmericanOdds;
  setMinOdds: React.Dispatch<React.SetStateAction<AmericanOdds>>;
  showLive: boolean;
  setShowLive: React.Dispatch<React.SetStateAction<boolean>>;
  showPush: boolean;
  setShowPush: React.Dispatch<React.SetStateAction<boolean>>;
  showToday: boolean;
  setShowToday: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function FilterExtra({
  minOdds,
  maxOdds,
  showLive,
  showPush,
  showToday,
  setMinOdds,
  setMaxOdds,
  setShowLive,
  setShowPush,
  setShowToday,
}: FilterExtraProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const active = [minOdds, maxOdds, showLive, showPush, showToday].filter(Boolean).length;
  return (
    <div className="filter-more">
      <button
        type="button"
        className="show-more-less-button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Fewer filters" : "More filters"}
        {active > 0 && <span className="filter-count">{active}</span>}
        <Chevron aria-hidden="true" className={expanded ? "is-expanded" : ""} />
      </button>
      <div id={panelId} hidden={!expanded}>
        <div className="filter-extra">
          <div className="odds-range">
            <div className="filter-cell">
              <label className="input-helper" htmlFor="min-odds-input">
                Minimum odds <span>(American)</span>
              </label>
              <OddsInput id="min-odds-input" sign="-" value={minOdds} setValue={setMinOdds} />
            </div>
            <div className="filter-cell">
              <label className="input-helper" htmlFor="max-odds-input">
                Maximum odds <span>(American)</span>
              </label>
              <OddsInput id="max-odds-input" sign="+" value={maxOdds} setValue={setMaxOdds} />
            </div>
          </div>
          <div className="filter-switches">
            <Switch label="Include started games" checked={showLive} setChecked={setShowLive} />
            <Switch label="Include push lines" checked={showPush} setChecked={setShowPush} />
            <Switch label="Today only" checked={showToday} setChecked={setShowToday} />
          </div>
        </div>
        <p className="filter-help">
          Started games may have outdated pregame odds. Push lines can end with a tied result.
        </p>
      </div>
    </div>
  );
}

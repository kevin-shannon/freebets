import "./OddsFormatToggle.css";
import { usePreferences } from "../common/etc/Preferences";

const choices = [
  { value: "american", label: "American", example: "+150" },
  { value: "decimal", label: "Decimal", example: "2.50" },
  { value: "probability", label: "Probability", example: "40%" },
] as const;
export default function OddsFormatToggle() {
  const { oddsFormat, setOddsFormat } = usePreferences();
  return (
    <fieldset className="preference-group">
      <legend>Odds format</legend>
      <div className="segmented-control">
        {choices.map(({ value, label, example }) => (
          <label className="segment" key={value}>
            <input
              type="radio"
              name="odds-format"
              value={value}
              checked={oddsFormat === value}
              onChange={() => setOddsFormat(value)}
            />
            <span className="odds-format-choice">
              {label}
              <small>{example}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

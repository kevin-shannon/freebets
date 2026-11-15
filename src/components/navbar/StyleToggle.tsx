import "./StyleToggle.css";
import { ReactComponent as Moon } from "../../icons/moon-stars.svg";
import { ReactComponent as Sun } from "../../icons/sun.svg";
import { ReactComponent as System } from "../../icons/system-brightness.svg";
import { usePreferences } from "../common/etc/Preferences";

const choices = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: System },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;
export default function StyleToggle() {
  const { themePreference, setThemePreference } = usePreferences();
  return (
    <fieldset className="preference-group">
      <legend>Appearance</legend>
      <div className="segmented-control">
        {choices.map(({ value, label, Icon }) => (
          <label className="segment" key={value}>
            <input
              type="radio"
              name="appearance"
              value={value}
              checked={themePreference === value}
              onChange={() => setThemePreference(value)}
            />
            <span>
              <Icon aria-hidden="true" />
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

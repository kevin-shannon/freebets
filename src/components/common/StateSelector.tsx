import { useId } from "react";
import Select, { FormatOptionLabelMeta, SingleValue, StylesConfig } from "react-select";
import { StateCode } from "../../data/states";
import { onlineBettingStates } from "../../data/onlineBettingStates";
import { singleSelectStyle } from "./etc/SelectStyle";

type StateOption = { value: StateCode | ""; label: string };
const stateOptions: StateOption[] = [
  { value: "", label: "All states" },
  ...onlineBettingStates.map(([value, label]) => ({ value, label })),
];

export interface StateSelectorProps {
  state: StateCode | "";
  onStateChange: (state: StateCode | "") => void;
}

export default function StateSelector({
  state,
  onStateChange,
  compact = false,
}: StateSelectorProps & { compact?: boolean }) {
  const id = useId();
  const styles: StylesConfig<StateOption, false> = {
    ...singleSelectStyle,
    control: (base, props) => ({ ...singleSelectStyle.control!(base, props), minHeight: compact ? 38 : 44 }),
    valueContainer: (base, props) => ({
      ...singleSelectStyle.valueContainer!(base, props),
      padding: compact ? "2px 8px" : "2px 12px",
    }),
    dropdownIndicator: (base, props) => ({
      ...singleSelectStyle.dropdownIndicator!(base, props),
      padding: compact ? 6 : 10,
    }),
    menu: (base, props) => ({
      ...singleSelectStyle.menu!(base, props),
      width: compact ? 240 : "100%",
      left: 0,
      right: "auto",
    }),
  };
  return (
    <div className={`state-selector${compact ? " state-selector-compact" : ""}`}>
      <label htmlFor={id} className={compact ? "sr-only" : undefined}>
        Your state
      </label>
      <Select<StateOption, false>
        inputId={id}
        instanceId={id}
        value={state ? stateOptions.find((option) => option.value === state) : null}
        aria-describedby={compact ? undefined : `${id}-help`}
        placeholder={compact ? "All" : "All states"}
        options={stateOptions}
        styles={styles}
        formatOptionLabel={(option: StateOption, meta: FormatOptionLabelMeta<StateOption>) =>
          compact && meta.context === "value" ? option.value : option.label
        }
        isSearchable={false}
        maxMenuHeight={240}
        menuPlacement="auto"
        onChange={(option: SingleValue<StateOption>) => onStateChange(option?.value ?? "")}
      />
      {!compact && <p id={`${id}-help`}>Shows online sportsbooks available in your selected state.</p>}
    </div>
  );
}

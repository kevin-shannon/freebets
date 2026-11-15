import { StylesConfig } from "react-select";

const common: StylesConfig<any, any> = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 9,
    backgroundColor: "var(--betcard-background)",
    borderColor: state.isFocused ? "var(--focus-ring)" : "var(--low-contrast-border)",
    boxShadow: state.isFocused ? "0 0 0 1px var(--focus-ring)" : "none",
    cursor: "pointer",
    ":hover": { borderColor: state.isFocused ? "var(--focus-ring)" : "var(--low-contrast-border-highlight)" },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--dropdown-menu-background)",
    border: "1px solid var(--low-contrast-border)",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "var(--dialog-shadow)",
    zIndex: 30,
  }),
  menuList: (base) => ({ ...base, padding: 4 }),
  valueContainer: (base) => ({ ...base, padding: "2px 12px", fontSize: 13, color: "var(--high-contrast-text)" }),
  singleValue: (base) => ({ ...base, color: "var(--high-contrast-text)" }),
  placeholder: (base) => ({ ...base, color: "var(--low-contrast-text)" }),
  input: (base) => ({ ...base, color: "var(--high-contrast-text)" }),
  option: (base, state) => ({
    ...base,
    borderRadius: 6,
    backgroundColor: state.isSelected || state.isFocused ? "var(--button-hover)" : "transparent",
    color: "var(--high-contrast-text)",
    fontSize: 13,
    cursor: "pointer",
    padding: "10px 12px",
    ":active": { backgroundColor: "var(--button-active)" },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "var(--low-contrast-text)",
    padding: 10,
    ":hover": { color: "var(--high-contrast-text)" },
  }),
  indicatorSeparator: () => ({ display: "none" }),
};
export const singleSelectStyle = common as StylesConfig<any, false>;
export const multiSelectStyle = common as StylesConfig<any, true>;

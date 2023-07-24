interface SingleSelectStyle {
  control: (base: any, state: any) => any;
  menuList: (base: any) => any;
  singleValue: (base: any) => any;
  option: (base: any, state: any) => any;
}

export const singleSelectStyle: SingleSelectStyle = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#00000000",
    "&:hover": {
      border: state.isFocused ? base.border : "1px solid hsl(0, 0%, 70%)",
    },
    border: state.isFocused ? "1px solid #fa5b67" : "1px solid var(--low-contrast-border)",
    boxShadow: state.isFocused ? "0 0 0 1px #fa5b67" : base.boxShadow,
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: "var(--dropdown-menu-background)",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--high-contrast-text)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#fa5b67" : null,
    "&:active": {
      backgroundColor: state.isSelected ? "#fa5b67" : "#fa5b6755",
      color: state.isSelected ? "#ffffff" : "var(--high-contrast-text)",
    },
    "&:hover:not(:active)": {
      backgroundColor: state.isSelected ? "#fa5b67" : "#fa5b6725",
    },
  }),
};

interface MultiSelectStyle {
  control: (base: any, state: any) => any;
  menuList: (base: any) => any;
  option: (base: any, _: any) => any;
}

export const multiSelectStyle: MultiSelectStyle = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#00000000",
    "&:hover": {
      border: state.isFocused ? base.border : "1px solid hsl(0, 0%, 70%)",
    },
    border: state.isFocused ? "1px solid #fa5b67" : "1px solid var(--low-contrast-border)",
    boxShadow: state.isFocused ? "0 0 0 1px #fa5b67" : base.boxShadow,
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: "var(--dropdown-menu-background)",
  }),
  option: (base, _) => ({
    ...base,
    backgroundColor: null,
    color: null,
    "&:hover": {
      backgroundColor: "rgba(250, 91, 103, .15)",
    },
  }),
};

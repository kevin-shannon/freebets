interface SingleSelectStyle {
  control: (base: any, state: any) => any;
  menuList: (base: any) => any;
  option: (base: any, state: any) => any;
}

export const singleSelectStyle: SingleSelectStyle = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#fafafa",
    "&:hover": {
      border: state.isFocused ? base.border : "1px solid hsl(0, 0%, 70%)",
    },
    border: state.isFocused ? "1px solid #fa5b67" : base.border,
    boxShadow: state.isFocused ? "0 0 0 1px #fa5b67" : base.boxShadow,
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: "#fafafa",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#fa5b67" : null,
    "&:active": {
      backgroundColor: state.isSelected ? "#fa5b67" : "#fa5b6755",
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
    backgroundColor: "#fafafa",
    "&:hover": {
      border: state.isFocused ? base.border : "1px solid hsl(0, 0%, 70%)",
    },
    border: state.isFocused ? "1px solid #fa5b67" : base.border,
    boxShadow: state.isFocused ? "0 0 0 1px #fa5b67" : base.boxShadow,
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: "#fafafa",
  }),
  option: (base, _) => ({
    ...base,
    backgroundColor: null,
    color: null,
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
  }),
};

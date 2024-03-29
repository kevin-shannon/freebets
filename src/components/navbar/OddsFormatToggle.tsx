import "./OddsFormatToggle.css";
import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const children = [
  <ToggleButton className="toggle-button style" disableRipple={true} value="american" key="left">
    <div className="odd-format-option col1-content">
      <span>American</span>
      <span>+150</span>
    </div>
  </ToggleButton>,
  <ToggleButton className="toggle-button style" disableRipple={true} value="probability" key="right">
    <div className="odd-format-option col2-content">
      <span>Probability</span>
      <span>40%</span>
    </div>
  </ToggleButton>,
  <ToggleButton className="toggle-button style" disableRipple={true} value="decimal" key="center">
    <div className="odd-format-option col3-content">
      <span>Decimal</span>
      <span>2.5</span>
    </div>
  </ToggleButton>,
];

export default function StyleToggle() {
  const [style, setStyle] = React.useState("american");

  const handleChange = (_: React.MouseEvent<HTMLElement>, newStyle: string) => {
    setStyle(newStyle);
  };
  return (
    <div className="styles-block">
      <label className="menu-setting-label">ODDS FORMAT</label>
      <ToggleButtonGroup
        value={style}
        exclusive
        onChange={handleChange}
        sx={{
          "& .MuiToggleButton-root.Mui-selected": {
            backgroundColor: "#32c85536;",
            color: "var(--slider-green)",
            fill: "var(--slider-green)",
            borderColor: "#098a27",
          },
          "& .MuiToggleButton-root.Mui-selected:hover": {
            backgroundColor: "#32c85536;",
            color: "var(--slider-green)",
            fill: "var(--slider-green)",
            borderColor: "#098a27",
          },
          "& .MuiToggleButton-root": {
            color: "var(--slider-text)",
            fill: "var(--slider-text)",
            borderColor: "#CFD9DE",
          },
        }}
      >
        {children}
      </ToggleButtonGroup>
    </div>
  );
}

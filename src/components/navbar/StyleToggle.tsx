import "./StyleToggle.css";
import React from "react";
import { ReactComponent as MoonStars } from "../../icons/moon-stars.svg";
import { ReactComponent as Sun } from "../../icons/sun.svg";
import { ReactComponent as SystemBrightness } from "../../icons/system-brightness.svg";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const children = [
  <ToggleButton className="toggle-button style" disableRipple={true} value="light" key="left">
    <Sun className="style-icon" /> Light
  </ToggleButton>,
  <ToggleButton className="toggle-button style" disableRipple={true} value="system" key="center">
    <SystemBrightness className="style-icon" /> System
  </ToggleButton>,
  <ToggleButton className="toggle-button style" disableRipple={true} value="dark" key="right">
    <MoonStars className="style-icon" /> Dark
  </ToggleButton>,
];

export default function StyleToggle() {
  const [style, setStyle] = React.useState("system");

  const handleChange = (_: React.MouseEvent<HTMLElement>, newStyle: string) => {
    setStyle(newStyle);
  };
  return (
    <div className="styles-block">
      <label className="menu-setting-label">MODE</label>
      <ToggleButtonGroup
        value={style}
        exclusive
        onChange={handleChange}
        sx={{
          "& .MuiToggleButton-root.Mui-selected": {
            backgroundColor: "#32c85536;",
            color: "#339636",
            fill: "#339636",
            borderColor: "#098a27",
          },
          "& .MuiToggleButton-root": {
            color: "#4d534f",
            fill: "#606461",
            borderColor: "#CFD9DE",
          },
          "& .MuiToggleButton-root:hover": {
            backgroundColor: "#00000008",
            color: "#4d534f",
            fill: "#606461",
          },
          "& .MuiToggleButton-root.Mui-selected:hover": {
            backgroundColor: "#24ae4442;",
            color: "#339636",
            fill: "#339636",
            borderColor: "#098a27",
          },
        }}
      >
        {children}
      </ToggleButtonGroup>
    </div>
  );
}

import "./StyleToggle.css";
import React, { useContext, useEffect } from "react";
import { ReactComponent as MoonStars } from "../../icons/moon-stars.svg";
import { ReactComponent as Sun } from "../../icons/sun.svg";
import { ReactComponent as SystemBrightness } from "../../icons/system-brightness.svg";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { ThemeContext } from "../layout/App";
import useLocalStorageState from "../common/etc/useLocalStorageState";

const children = [
  <ToggleButton className="toggle-button style" disableRipple={true} value="light" key="left">
    <div className="style-option col1-content">
      <Sun className="style-icon" /> Light
    </div>
  </ToggleButton>,
  <ToggleButton className="toggle-button style" disableRipple={true} value="system" key="center">
    <div className="style-option col2-content">
      <SystemBrightness className="style-icon" /> System
    </div>
  </ToggleButton>,
  <ToggleButton className="toggle-button style" disableRipple={true} value="dark" key="right">
    <div className="style-option col3-content">
      <MoonStars className="style-icon" /> Dark
    </div>
  </ToggleButton>,
];

export default function StyleToggle() {
  const [style, setStyle] = useLocalStorageState("style", "system");
  const { setTheme } = useContext(ThemeContext);

  useEffect(() => {
    const setThemeBasedOnStyle = (newStyle: string) => {
      if (newStyle === "system") {
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
          setTheme("dark");
        } else {
          setTheme("light");
        }
      } else {
        setTheme(newStyle);
      }
    };

    setThemeBasedOnStyle(style);
  }, [style, setTheme]);

  const handleChange = (_: React.MouseEvent<HTMLElement>, newStyle: string) => {
    if (newStyle !== null) {
      setStyle(newStyle);
    }
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

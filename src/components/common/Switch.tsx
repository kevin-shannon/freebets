import React from "react";
import "./Switch.css";

interface SwitchInterface {
  label: string;
}

export default function Switch({ label }: SwitchInterface) {
  const [checked, setChecked] = React.useState(false);

  const handleToggle = () => {
    setChecked(!checked);
  };

  return (
    <div className={`switch-container ${checked ? "checked" : ""}`} onClick={handleToggle}>
      <div className="switch">
        <div className="slider"></div>
      </div>
      <span className="swith-label">{label}</span>
    </div>
  );
}

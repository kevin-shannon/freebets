import React, { useState, KeyboardEvent } from "react";
import "./Switch.css";

interface SwitchInterface {
  label: string;
}

export default function Switch({ label }: SwitchInterface) {
  const [checked, setChecked] = useState(false);

  const handleToggle = () => {
    setChecked(!checked);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`switch-container ${checked ? "checked" : ""}`} onClick={handleToggle} onKeyDown={handleKeyDown}>
      <div className="switch" tabIndex={0}>
        <div className="slider"></div>
      </div>
      <span className="switch-label">{label}</span>
    </div>
  );
}

import React, { KeyboardEvent } from "react";
import "./Switch.css";

interface SwitchInterface {
  label: string;
  checked: boolean;
  setChecked: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Switch({ label, checked, setChecked }: SwitchInterface) {
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

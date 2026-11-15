import React from "react";
import "./Switch.css";

interface SwitchProps {
  label: string;
  checked: boolean;
  setChecked: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function Switch({ label, checked, setChecked }: SwitchProps) {
  return (
    <label className="switch-container">
      <input type="checkbox" role="switch" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
      <span className="switch-track" aria-hidden="true">
        <span />
      </span>
      <span className="switch-label">{label}</span>
    </label>
  );
}

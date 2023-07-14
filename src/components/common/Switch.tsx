import React from "react";
import "./Switch.css";

export default function Switch() {
  const [checked, setChecked] = React.useState(false);

  const handleToggle = () => {
    setChecked(!checked);
  };

  return (
    <div className={`switch ${checked ? "checked" : ""}`} onClick={handleToggle}>
      <div className="slider"></div>
    </div>
  );
}

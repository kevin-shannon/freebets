import "./StyleTabs.css";
import { useState } from "react";
import { ReactComponent as MoonStars } from "../../icons/moon-stars.svg";
import { ReactComponent as Sun } from "../../icons/sun.svg";
import { ReactComponent as SystemBrightness } from "../../icons/system-brightness.svg";

export default function StyleTabs() {
  const [selectedTab, setSelectedTab] = useState(1); // State to track the selected tab

  const handleTabClick = (tab: number): void => {
    setSelectedTab(tab);
  };
  return (
    <div className="styles-block">
      <label className="menu-setting-label">MODE</label>
      <div className="tabs-container">
        <div className="tabs">
          <button className={`tab ${selectedTab === 1 ? "active" : ""}`} onClick={() => handleTabClick(1)}>
            <Sun className="style-icon" /> Light
          </button>
          <button className={`tab ${selectedTab === 2 ? "active" : ""}`} onClick={() => handleTabClick(2)}>
            <SystemBrightness className="style-icon" /> System
          </button>
          <button className={`tab ${selectedTab === 3 ? "active" : ""}`} onClick={() => handleTabClick(3)}>
            <MoonStars className="style-icon" /> Dark
          </button>
        </div>
      </div>
    </div>
  );
}

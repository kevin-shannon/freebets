import "./HamburgerMenu.css";
import { useState } from "react";
import { ReactComponent as Bars } from "../../icons/bars.svg";

interface HamburgerMenuProps {
  hamburgerActive: boolean;
  setHamburgerActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function HamburgerMenu({ hamburgerActive, setHamburgerActive }: HamburgerMenuProps) {
  const [isSlideVisible, setIsSlideVisible] = useState(false);

  const toggleSlide = () => {
    setIsSlideVisible(!isSlideVisible);
    setHamburgerActive(!hamburgerActive);
  };

  return (
    <div className="hamburger-content">
      <input id="togglenav" className="menu-trigger hidden" type="checkbox" />
      <label htmlFor="togglenav" onClick={toggleSlide} className="burger-wrapper">
        <div className="hamburger"></div>
      </label>
      <div className="sliding-drawer">
        <div className="sliding-shelf">
          <div className={`sliding-div ${isSlideVisible ? "visible" : ""}`}></div>
        </div>
      </div>
    </div>
  );
}

import "./HamburgerMenu.css";

interface HamburgerMenuProps {
  hamburgerActive: boolean;
  setHamburgerActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function HamburgerMenu({ hamburgerActive, setHamburgerActive }: HamburgerMenuProps) {
  const toggleMenu = () => {
    setHamburgerActive(!hamburgerActive);
  };

  return (
    <div className={`hamburger-container ${hamburgerActive ? "active" : ""}`}>
      <div className="burger-wrapper" onClick={toggleMenu}>
        <div className="hamburger"></div>
      </div>
      <div className="sliding-drawer">
        <div className="sliding-shelf">
          <div className={`sliding-div ${hamburgerActive ? "visible" : ""}`}></div>
        </div>
      </div>
    </div>
  );
}

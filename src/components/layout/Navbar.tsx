import "./Navbar.css";
import { useEffect, useState } from "react";
import HamburgerMenu from "./HamburgerMenu";

interface NavbarProps {
  hamburgerActive: boolean;
  setHamburgerActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Navbar({ hamburgerActive, setHamburgerActive }: NavbarProps) {
  const [hasBoxShadow, setHasBoxShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 0;
      setHasBoxShadow(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav className={`sticky-navbar${hasBoxShadow ? " has-box-shadow" : ""}`}>
      <div className="nav-container">
        <div className="logo-container">
          <img src="/freebets/FreebetsLogo.svg" height="44px" />
        </div>
        <div className="links-container">
          <div className="nav-link link-active">Bets</div>
          <div className="nav-link">Tools</div>
          <div className="nav-link">Guides</div>
        </div>
        <div className="hamburger-container">
          <HamburgerMenu hamburgerActive={hamburgerActive} setHamburgerActive={setHamburgerActive} />
        </div>
      </div>
    </nav>
  );
}

import "./Navbar.css";
import HamburgerMenu from "./HamburgerMenu";
import { Page } from "../../navigation";

export default function Navbar({ page }: { page: Page }) {
  return (
    <header className="sticky-navbar">
      <nav className="nav-container" aria-label="Main navigation">
        <a className="brand" href="#/" aria-label="Freebets home">
          <img src={`${process.env.PUBLIC_URL}/FreebetsLogo.svg`} width="34" height="34" alt="" />
          <span>
            freebets<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="links-container">
          {(["bets", "tools", "learn"] as const).map((destination) => (
            <a
              key={destination}
              className={`nav-link ${page === destination ? "link-active" : ""}`}
              aria-current={page === destination ? "page" : undefined}
              href={`#/${destination}`}
            >
              {destination.charAt(0).toUpperCase() + destination.slice(1)}
            </a>
          ))}
        </div>
        <HamburgerMenu />
      </nav>
    </header>
  );
}

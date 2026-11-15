import { useState } from "react";
import "./HamburgerMenu.css";
import StyleToggle from "./StyleToggle";
import OddsFormatToggle from "./OddsFormatToggle";
import Dialog from "../common/Dialog";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={`menu-button ${open ? "is-open" : ""}`}
        type="button"
        aria-label="Open preferences"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="menu-button-label">Preferences</span>
        <span className="hamburger" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Make it yours" className="preferences-dialog">
        <StyleToggle />
        <OddsFormatToggle />
        <p className="preferences-note">Your preferences are saved on this device.</p>
      </Dialog>
    </>
  );
}

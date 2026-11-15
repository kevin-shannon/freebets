import { useState } from "react";
import Dialog from "./Dialog";

export default function ModalLink({ linkName, content }: { linkName: string; content: () => JSX.Element }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="foot-link" onClick={() => setOpen(true)}>
        {linkName}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={linkName}>
        {content()}
      </Dialog>
    </>
  );
}

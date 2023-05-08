import { useState } from "react";
import { Modal, ModalClose, Sheet } from "@mui/joy";

const modalStyle = {
  width: "clamp(300px, 90vw, 500px)",
  margin: "auto",
  height: "fit-content",
  "& .MuiModal-backdrop": {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
};

const sheetStyle = {
  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)",
  borderRadius: "20px",
  p: "24px",
};

interface ModalLinkProps {
  linkName: string;
  content: () => JSX.Element;
}

export default function ModalLink({ linkName, content }: ModalLinkProps) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <button className="foot-link" onClick={handleOpen}>
        {linkName}
      </button>
      <Modal
        open={open}
        sx={modalStyle}
        onClose={handleClose}
        disableAutoFocus={true}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Sheet sx={sheetStyle}>
          <ModalClose />
          {content()}
        </Sheet>
      </Modal>
    </div>
  );
}

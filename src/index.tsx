import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/layout/App";
import "react-tooltip/dist/react-tooltip.css";

const rootElement = document.getElementById("root");
if (rootElement !== null) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

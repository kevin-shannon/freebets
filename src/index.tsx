import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/layout/App";
import "react-tooltip/dist/react-tooltip.css";
import { NextUIProvider } from "@nextui-org/react";

const rootElement = document.getElementById("root");
if (rootElement !== null) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <NextUIProvider>
        <App />
      </NextUIProvider>
    </React.StrictMode>
  );
}

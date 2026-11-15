import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/layout/App";
import { PreferencesProvider } from "./components/common/etc/Preferences";
import CalculatorProvider from "./components/calc/CalculatorProvider";

const rootElement = document.getElementById("root");
if (rootElement !== null) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <PreferencesProvider>
        <CalculatorProvider>
          <App />
        </CalculatorProvider>
      </PreferencesProvider>
    </React.StrictMode>,
  );
}

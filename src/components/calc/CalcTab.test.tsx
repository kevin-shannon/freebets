import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CalcTab from "./CalcTab";
import { PreferencesProvider } from "../common/etc/Preferences";
import { BetType } from "../../enums";
import { calcBetStats } from "../../Utils";

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }),
  });
});

function Calculator({ type }: { type: BetType }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [conversion, setConversion] = useState("70");
  const option = { value: type, label: type };
  return (
    <PreferencesProvider>
      <CalcTab
        betOption={option}
        amount_a={a}
        setAmount_a={setA}
        amount_b={b}
        setAmount_b={setB}
        conversion={conversion}
        setConversion={setConversion}
        bet_a="Home"
        bet_b="Away"
        odds_a={150}
        odds_b={-200}
        books_a={[]}
        books_b={[]}
        stats={calcBetStats(option, Number(a), Number(b), 150, -200)}
      />
    </PreferencesProvider>
  );
}

test("free bet calculates a read-only hedge from the promotion amount", () => {
  render(<Calculator type={BetType.FREEBET} />);
  fireEvent.change(screen.getByLabelText("Free bet amount"), { target: { value: "100" } });
  expect(screen.getByLabelText("Calculated hedge")).toHaveValue("$100");
  expect(screen.getByLabelText("Calculated hedge")).toHaveAttribute("readonly");
  expect(screen.getByText("Estimated profit")).toBeInTheDocument();
});

test("arbitrage lets either stake update the other", () => {
  render(<Calculator type={BetType.ARBITRAGE} />);
  expect(screen.getByLabelText("Second stake")).not.toHaveAttribute("readonly");
  fireEvent.change(screen.getByLabelText("Second stake"), { target: { value: "100" } });
  expect(screen.getByLabelText("First stake")).toHaveValue("$60");
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import App from "./App";
import CalculatorProvider from "../calc/CalculatorProvider";
import { PreferencesProvider } from "../common/etc/Preferences";

jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn() } }));
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  window.history.replaceState(null, "", "#/bets");
  Object.defineProperty(window, "scrollTo", { writable: true, value: jest.fn() });
  mockedAxios.get.mockImplementation((url: string) =>
    Promise.resolve({
      data: url.includes("scrape-status.json")
        ? { generatedAt: new Date().toISOString(), region: "mo", state: "ok", books: {} }
        : [],
    }),
  );
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }),
  });
  // jsdom does not implement native modal dialogs.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

test("home saves a state preference and page navigation preserves Bets controls", async () => {
  window.history.replaceState(null, "", "#/");
  await act(async () => {
    render(
      <PreferencesProvider>
        <CalculatorProvider>
          <App />
        </CalculatorProvider>
      </PreferencesProvider>,
    );
  });
  expect(screen.getByRole("heading", { name: /A clearer view of the odds/ })).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Your state" }), { key: "ArrowDown" });
  fireEvent.click(screen.getByRole("option", { name: "Missouri", exact: true }));
  expect(localStorage.getItem("selectedState")).toBe('"MO"');
  const navigate = (page: string) => {
    window.history.pushState(null, "", `#/${page}`);
    fireEvent(window, new HashChangeEvent("hashchange"));
  };
  navigate("bets");
  expect(screen.getByText("MO", { exact: true })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "More filters" }));
  fireEvent.click(screen.getByRole("switch", { name: "Today only" }));
  navigate("learn");
  expect(screen.getByRole("heading", { name: "Learn", exact: true })).toBeInTheDocument();
  navigate("bets");
  expect(screen.getByRole("switch", { name: "Today only" })).toBeChecked();
  expect(screen.getByRole("button", { name: /^Fewer filters/ })).toHaveAttribute("aria-expanded", "true");
  navigate("");
  expect(screen.getByText("Missouri", { exact: true })).toBeVisible();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

test("background refreshes preserve the open calculator when its market disappears or the feed fails", async () => {
  const quote = {
    sport: "nba",
    event: "Home vs Away",
    market: "Moneyline",
    start: new Date(Date.now() + 3600000).toISOString(),
    outcomes: [
      { name: "Home", books: { "150": ["caesars"] } },
      { name: "Away", books: { "-200": ["fanduel"] } },
    ],
  };
  let quotes = [quote];
  let fail = false;
  mockedAxios.get.mockImplementation((url: string) =>
    fail
      ? Promise.reject(new Error("Feed unavailable"))
      : Promise.resolve({
          data: url.includes("scrape-status.json")
            ? { generatedAt: new Date().toISOString(), region: "mo", state: "ok", books: {} }
            : quotes,
        }),
  );

  await act(async () => {
    render(
      <PreferencesProvider>
        <CalculatorProvider>
          <App />
        </CalculatorProvider>
      </PreferencesProvider>,
    );
  });
  fireEvent.click(screen.getByRole("button", { name: "Calculate Home vs Away, Moneyline" }));
  fireEvent.change(screen.getByLabelText("First stake"), { target: { value: "123" } });
  const hedge = screen.getByLabelText("Second stake").getAttribute("value");
  fireEvent.click(screen.getByRole("tab", { name: "Outcomes" }));

  quotes = [];
  await act(async () => {
    jest.advanceTimersByTime(60000);
  });
  expect(screen.getByRole("heading", { name: "No matching markets" })).toBeInTheDocument();
  expect(screen.getByRole("dialog", { name: "Bet calculator" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Outcomes" })).toHaveAttribute("aria-selected", "true");

  fail = true;
  await act(async () => {
    jest.advanceTimersByTime(60000);
  });
  expect(screen.getByRole("dialog", { name: "Bet calculator" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Stakes" }));
  expect(screen.getByLabelText("First stake")).toHaveValue("$123");
  expect(screen.getByLabelText("Second stake")).toHaveValue(hedge);
});

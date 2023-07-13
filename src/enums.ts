export enum BetType {
  ARBITRAGE = "arbitrage",
  FREEBET = "freebet",
  RISKFREE = "riskfree",
  PLAYTHROUGH = "playthrough",
}

export enum BookType {
  ALL = "all",
  BETMGM = "betmgm",
  CAESARS = "caesars",
  DRAFTKINGS = "draftkings",
  FANDUEL = "fanduel",
  POINTSBET = "pointsbet",
  SUPERBOOK = "superbook",
  UNIBET = "unibet",
}

export enum SportType {
  ALL = "all",
  BASKETBALL = "basketball",
  BASEBALL = "baseball",
  HOCKEY = "hockey",
  FOOTBALL = "football",
  TENNIS = "tennis",
}

export type ScreenType = "small" | "medium" | "large";

export type GenericOption<T> = {
  value: T;
  label: string;
};

export type BetOption = GenericOption<BetType>;
export type BookOption = GenericOption<BookType>;
export type SportOption = GenericOption<SportType>;

export interface Bet {
  sport: string;
  event: string;
  market: string;
  outcomes: [{ name: string; odds: number; books: string[] }, { name: string; odds: number; books: any }];
  rate: number;
  date: string;
}

export interface OutcomesNode {
  type: "OutcomesNode";
  betLabel: string;
  bet_a: string;
  bet_b: string;
  amount_a: string;
  amount_b: string;
  children: OutcomeNode[];
}

export interface OutcomeNode {
  type: "OutcomeNode";
  name: string;
  children: EvalNode[];
}

export interface EvalNode {
  type: "EvalNode";
  won: number;
  sunk: number;
  net: number;
  bonus?: string;
  children?: OutcomesNode[];
}

export type Node = OutcomesNode | OutcomeNode | EvalNode;

export type Money = number;

export type Odds = number;

export enum BetType {
  ARBITRAGE = "arbitrage",
  FREEBET = "freebet",
  RISKFREE = "riskfree",
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
  NBA = "nba",
  MLB = "mlb",
  NHL = "nhl",
  NFL = "nfl",
  COLLEGE_BASKETBALL = "college basketball",
  COLLEGE_FOOTBALL = "college football",
  TENNIS = "tennis",
}

export type ScreenType = "small" | "medium" | "large";

export type BetOption = {
  value: BetType;
  label: string;
};

export type BookOption = {
  value: BookType;
  label: string;
};

export type SportOption = {
  value: SportType;
  label: string;
};

export type Option = {
  value: string;
  label: string;
};

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

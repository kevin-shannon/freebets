import { Node, BetOption, BetType } from "../../enums";
import { formatMoneyNumber } from "../../Utils";
import OrgChart from "react-orgchart";
import OutcomesCell from "./cells/OutcomesCell";
import OutcomeCell from "./cells/OutcomeCell";
import EvalCell from "./cells/EvalCell";

interface ScenarioTabProps {
  betOption: BetOption;
  amount_a: string;
  amount_b: string;
  bet_a: string;
  bet_b: string;
  stats: {
    perc: number;
    profit: number;
    won_a: string;
    won_b: string;
    sunk: string;
    net_a: string;
    net_b: string;
    won_a_2?: string;
    won_b_2?: string;
    sunk_2?: string;
    net_a_2?: string;
    net_b_2?: string;
  };
}

export default function ScenarioTab({ betOption, amount_a, amount_b, bet_a, bet_b, stats }: ScenarioTabProps) {
  let org = {
    type: "OutcomesNode",
    bet_a: bet_a,
    bet_b: bet_b,
    amount_a: amount_a,
    amount_b: amount_b,
    children: [
      {
        type: "OutcomeNode",
        name: bet_a,
        children: [{}],
      },
      {
        type: "OutcomeNode",
        name: bet_b,
        children: [{}],
      },
    ],
  };

  const ScenarioNode = ({ node }: { node: Node }) => {
    switch (node.type) {
      case "OutcomesNode":
        return <OutcomesCell bet_a={node.bet_a} amount_a={node.amount_a} bet_b={node.bet_b} amount_b={node.amount_b} />;
      case "OutcomeNode":
        return <OutcomeCell name={node.name} />;
      case "EvalNode":
        return <EvalCell won={node.won} sunk={node.sunk} net={node.net} bonus={node.bonus} />;
      default:
        return null;
    }
  };

  if (betOption.value === BetType.ARBITRAGE) {
    org.children[0].children[0] = {
      type: "EvalNode",
      won: stats.won_a,
      sunk: stats.sunk,
      net: stats.net_a,
    };
    org.children[1].children[0] = {
      type: "EvalNode",
      won: stats.won_b,
      sunk: stats.sunk,
      net: stats.net_b,
    };
  } else if (betOption.value === BetType.FREEBET) {
    org.children[0].children[0] = {
      type: "EvalNode",
      won: stats.won_a,
      sunk: stats.sunk,
      net: stats.net_a,
    };
    org.children[1].children[0] = {
      type: "EvalNode",
      won: stats.won_b,
      sunk: stats.sunk,
      net: stats.net_b,
    };
  } else if (betOption.value === BetType.RISKFREE) {
    org.children[0].children[0] = {
      type: "EvalNode",
      won: stats.won_a,
      sunk: stats.sunk,
      net: stats.net_a,
    };
    org.children[1].children[0] = {
      type: "EvalNode",
      won: stats.won_b,
      sunk: stats.sunk,
      net: stats.net_b,
      bonus: formatMoneyNumber(Number(amount_a), false),
      children: [
        {
          type: "OutcomesNode",
          bet_a: "Outcome A",
          bet_b: "Outcome B",
          amount_a: amount_a,
          amount_b: "$X",
          children: [
            {
              type: "OutcomeNode",
              name: "Outcome A",
              children: [
                {
                  type: "EvalNode",
                  won: stats.won_b_2,
                  sunk: stats.sunk_2,
                  net: stats.net_b_2,
                },
              ],
            },
            {
              type: "OutcomeNode",
              name: "Outcome B",
              children: [
                {
                  type: "EvalNode",
                  won: stats.won_b_2,
                  sunk: stats.sunk_2,
                  net: stats.net_b_2,
                },
              ],
            },
          ],
        },
      ],
    };
  }

  return <OrgChart tree={org} NodeComponent={ScenarioNode} />;
}

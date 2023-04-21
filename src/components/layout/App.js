import "./App.css";
import React, { useState, useEffect } from "react";
import FilterBar from "../filter/FilterBar";
import BetTable from "../list/BetTable";
import Footer from "./Footer";
import { filterBets } from "../../Utils.js";
import { book_options_all, bet_type_options } from "../../Options";
import axios from "axios";
import "typeface-roboto";
import "typeface-roboto-mono";
import OrgChart from "react-orgchart";
import "react-orgchart/index.css";
import OutcomesCell from "../calc/OutcomesCell";
import EvalCell from "../calc/EvalCell";

function readyBookList(book) {
  let arr = book.map((ob) => ob.value);
  const indexToRemove = arr.indexOf("all");
  if (indexToRemove !== -1) {
    arr.splice(indexToRemove, 1);
  }
  return arr;
}

const initechOrg = {
  type: "OutcomesCell",
  name: "Outcomes",
  children: [
    {
      type: "OutcomeLabel",
      name: "Over 9.5",
      children: [
        {
          type: "EvalCell",
          name: "Winnings",
        },
      ],
    },
    {
      type: "OutcomeLabel",
      name: "Under 9.5",
      children: [
        {
          type: "EvalCell",
          name: "Winnings",
          children: [
            {
              type: "OutcomesCell",
              name: "Outcomes",
              children: [
                {
                  type: "OutcomeLabel",
                  name: "Outcome A",
                  children: [
                    {
                      type: "EvalCell",
                      name: "Winnings",
                    },
                  ],
                },
                {
                  type: "OutcomeLabel",
                  name: "Outcome B",
                  children: [
                    {
                      type: "EvalCell",
                      name: "Winnings",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const MyNodeComponent = ({ node }) => {
  if (node.type === "OutcomesCell") return <OutcomesCell betA={"Over 9.5"} betB={"Under 9.5"} amountA={"$1,000"} amountB={"$4,990"} />;
  else if (node.type === "EvalCell") return <EvalCell won={"$5,200"} sunk={"$5,990"} net={"-$262"} bonus={"$1,000 FB"} />;
  else if (node.type === "OutcomeLabel") return <span>{node.name}</span>;
  return null;
};

function App() {
  const [betType, setBetType] = useState(bet_type_options[1]);
  const [bookA, setBookA] = useState(book_options_all);
  const [bookB, setBookB] = useState(book_options_all);
  const [showLive, setShowLive] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("https://stanleys-bucket.s3.us-east-2.amazonaws.com/output.json")
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const bets = filterBets(data, betType, readyBookList(bookA), readyBookList(bookB), showLive, showPush);

  return (
    <div className="site">
      <div className="content">
        <FilterBar
          betType={betType}
          onBetTypeChange={setBetType}
          bookA={bookA}
          onBookAChange={setBookA}
          bookB={bookB}
          onBookBChange={setBookB}
          setShowLive={setShowLive}
          setShowPush={setShowPush}
        />
        {!bookA.length || !bookB.length ? (
          <div class="select-books-message-container">
            <span class="select-some-books">Select some books</span>
          </div>
        ) : (
          <BetTable betsPerPage={10} bets={bets} betType={betType} />
        )}
      </div>
      <OrgChart tree={initechOrg} NodeComponent={MyNodeComponent} />
      <Footer />
    </div>
  );
}

export default App;

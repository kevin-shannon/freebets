import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import Stack from "@mui/material/Stack";
import "./Footer.css";
import ModalLink from "./ModalLink";

const disclaimerContent = (
  <p>
    The information provided on our website is for informational purposes only. We make no guarantee as to the accuracy or completeness of the information
    provided. We are not responsible for any losses that users may incur as a result of using the information on our site. Users should carefully consider their
    betting decisions and understand that all bets carry inherent risks. Please note that our website is not a betting site and we do not offer any gambling
    services.
  </p>
);

const aboutContent = (
  <p>
    Sportsbooks offer attractive sign-up promotions to bring in new customers. These promotions can be taken advantage of with smart betting. By placing bets on
    the same event at different sportsbooks, we can guarantee a payout no matter what the outcome. The amounts bet on both books will be such that their payouts
    are equal. Typically, promotions come in the form of Risk-Free Bets, Free Bets, or a Deposit Match. For Risk-Free Bets and Free Bets, the evaluation
    criteria to maximize is Conversion %. For Deposit Match, the evaluation criteria to maximize is the Expected Value weighted by the "shortness" of the bet.
    It is important to read the terms of the promotion you wish to utilize so you can realize the maximum value of the offer and fully grasp the associated
    risks.
  </p>
);

const howItWorksContent = (
  <p>
    Every minute, odds are pulled by a script running in an AWS Lambda instance. For each bet, we compare the odds of all books and pick the best odds. Finally,
    we sort bets by some evaluation criteria, either Expected Value or Conversion %.
  </p>
);

export default function Footer() {
  return (
    <footer>
      <div className="footer-container">
        <Stack direction="row" spacing={3}>
          <ModalLink linkName="About" content={aboutContent} />
          <ModalLink linkName="Disclaimer" content={disclaimerContent} />
          <ModalLink linkName="How it works" content={howItWorksContent} />
          <a href="https://github.com/kevin-shannon/freebets">
            <FontAwesomeIcon className="foot-link" size="xl" id="octo" icon={faGithub} />
          </a>
        </Stack>
      </div>
    </footer>
  );
}

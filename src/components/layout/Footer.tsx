import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import Stack from "@mui/material/Stack";
import "./Footer.css";
import ModalLink from "../common/ModalLink";

function AboutContent() {
  return (
    <>
      <h2>About</h2>
      <p>
        Sportsbooks offer attractive sign-up promotions to bring in new customers. These promotions can be taken advantage of through the strategy of{" "}
        <a href="https://en.wikipedia.org/wiki/Matched_betting">Matched Betting</a>. By placing bets on the same event at different sportsbooks, we can
        guarantee a payout regardless of the outcome. The amounts bet on both books will be such that their payouts are equal. Typically, promotions come in the
        form of Risk-Free Bets, Free Bets, or a Deposit Match. For Risk-Free Bets and Free Bets, the evaluation criteria to maximize is Conversion %. For
        Deposit Match, the evaluation criteria to maximize is the Expected Value weighted by the "shortness" of the bet. It is important to read the terms of
        the promotion you wish to utilize so you can realize the maximum value of the offer and fully grasp the associated risks.
      </p>
    </>
  );
}

function DisclaimerContent() {
  return (
    <>
      <h2>Disclaimer</h2>
      <p>
        The information provided on our website is for informational purposes only. We make no guarantee as to the accuracy or completeness of the information
        provided. We are not responsible for any losses that users may incur as a result of using the information on our site. Users should carefully consider
        their betting decisions and understand that all bets carry inherent risks. Please note that our website is not a betting site and we do not offer any
        gambling services. If you or someone you know has a gambling problem and wants help, call 1-800 GAMBLER
      </p>
    </>
  );
}

function MissionContent() {
  return (
    <>
      <h2>Mission</h2>
      <p>
        This site is not the first of its kind. There are many other similar services, but they are all behind paywalls. I was motivated to create this site
        when I was trying to promo farm myself and found that to get the most value out of my promotions, I would have to pay one of these services a cut of my
        winnings to find the best bets. I knew that it didn't take a crazy amount of computing power to do what they were doing, and anyone with a little bit of
        know-how could hobble together something similar. So that's exactly what I did.
      </p>
    </>
  );
}

export default function Footer() {
  return (
    <footer>
      <div className="footer-container">
        <Stack direction="row" spacing={3}>
          <ModalLink linkName="About" content={AboutContent} />
          <ModalLink linkName="Disclaimer" content={DisclaimerContent} />
          <ModalLink linkName="Mission" content={MissionContent} />
          <a href="https://github.com/kevin-shannon/freebets">
            <FontAwesomeIcon className="foot-link" size="xl" id="octo" icon={faGithub} />
          </a>
        </Stack>
      </div>
    </footer>
  );
}

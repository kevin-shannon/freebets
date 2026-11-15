"""Experimental MO NBA pipe feed, verified against a user browser capture.

Not enabled in scheduled collection: direct feed access currently returns 403.
Other states/leagues need their own captured routes before enabling them.
"""
from collections import defaultdict
from datetime import datetime, timezone
from fractions import Fraction
import os
import re

from http_client import FeedError
from markets import add_market, event_info, line_number

NBA_PAGE = "#AC#B18#C20604387#D48#E1453#F10#"
MARKETS = {"M1453": ("Spread", "spread"), "M1454": ("Total", "total"), "M960": ("Money", "moneyline")}


def fractional_to_american(value):
    if value in {"EVS", "EVEN"}:
        return 100
    if not re.fullmatch(r"\d+/\d+", value or ""):
        raise ValueError("Invalid fractional odds")
    ratio = Fraction(value)
    if ratio <= 0:
        raise ValueError("Invalid fractional odds")
    price = 100 * ratio if ratio >= 1 else -100 / ratio
    # Round halves away from zero, without binary floating point ties.
    magnitude = abs(price)
    rounded = (2 * magnitude.numerator + magnitude.denominator) // (2 * magnitude.denominator)
    return rounded if price > 0 else -rounded


def records(text):
    if not isinstance(text, str) or not text.startswith("F|CL;"):
        raise FeedError("bet365 response is not a complete pipe feed", "schema_changed")
    result = []
    for chunk in text.split("|")[1:]:
        if not chunk:
            continue
        kind, *fields = chunk.split(";")
        row = {}
        for field in fields:
            if "=" in field:
                key, value = field.split("=", 1)
                row[key] = value
        result.append((kind, row))
    return result


def parse_markets(text, sport="nba", client=None):
    if sport != "nba":
        raise FeedError("bet365 only has a verified NBA capture", "unsupported")
    rows = records(text)
    if not any(kind == "CL" and row.get("ID") == "18" for kind, row in rows) or not any(
        kind == "EV" and row.get("L3") == "NBA" for kind, row in rows
    ):
        raise FeedError("bet365 response is not the captured NBA league layout", "schema_changed")
    events, selections = {}, defaultdict(list)
    market, event_table, game_lines = None, False, False
    saw_game_lines = False
    for kind, row in rows:
        if kind == "MG":
            game_lines = row.get("SY") == "cmx" and row.get("ID") == "1453"
            saw_game_lines = saw_game_lines or game_lines
            market, event_table = None, False
        elif kind == "MA":
            event_table = game_lines and row.get("ID") == "M0"
            expected = MARKETS.get(row.get("ID")) if game_lines else None
            market = expected[1] if expected and row.get("NA") == expected[0] else None
        elif kind == "PA" and event_table and row.get("FD"):
            try:
                if row.get("FS") != "0" or row.get("MP") != "0":
                    continue
                away, home = row["NA"], row["N2"]
                if row["FD"] != f"{away} @ {home}" or not re.fullmatch(r"PC\d+", row["ID"]):
                    raise ValueError("Unrecognized event identity")
                start = datetime.strptime(row["BC"], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
                name, start = event_info(f"{away} @ {home}", start.isoformat(), sport)
                events[row["FI"]] = (name, start, away, home, row["ID"][2:])
            except (KeyError, ValueError, TypeError) as error:
                if client:
                    client.warn(f"Skipped bet365 event: {error}")
        elif kind == "PA" and market:
            # FI can be market-specific. OI points to the actual event, e.g.
            # total FI=204594885 and money FI=204594884 both use OI=204594883.
            event_id = row.get("OI", row.get("FI"))
            if event_id:
                selections[(event_id, market)].append(row)
    if not saw_game_lines:
        raise FeedError("bet365 response has no captured game-lines block", "schema_changed")
    formatted = {}
    for (event_id, kind), pair in selections.items():
        if event_id not in events:
            continue
        name, start, away, home, away_selection = events[event_id]
        try:
            if len(pair) != 2:
                raise ValueError("Market does not have exactly two selections")
            if any(row.get("FS") != "0" or row.get("OS") != "1" for row in pair):
                continue
            if kind == "spread" and pair[0].get("ID") != away_selection:
                raise ValueError("Spread order does not match the event's away selection")
            outcomes = []
            for index, row in enumerate(pair):
                outcome = {"name": (away, home)[index], "odds": fractional_to_american(row.get("OD"))}
                if kind == "spread":
                    outcome["line"] = line_number(row["HA"])
                    if outcome["line"] != line_number(row["HD"]):
                        raise ValueError("Spread display and numeric handicap disagree")
                elif kind == "total":
                    match = re.fullmatch(r"([OU])\s+([\d.]+)", row.get("HD", ""))
                    if not match:
                        raise ValueError("Total has no Over/Under identity")
                    outcome["name"] = "Over" if match[1] == "O" else "Under"
                    outcome["line"] = line_number(row["HA"])
                    if outcome["line"] != line_number(match[2]):
                        raise ValueError("Total display and numeric line disagree")
                outcomes.append(outcome)
            if not add_market(formatted, sport, name, start, kind, outcomes):
                raise ValueError("Market sides or lines do not match")
        except (KeyError, ValueError, TypeError, ZeroDivisionError) as error:
            if client:
                client.warn(f"Skipped bet365 {kind}: {error}")
    return formatted


def fetch_sport(sport, client):
    if sport != "nba" or getattr(client, "bet365_region", client.region) != "mo":
        raise FeedError("bet365 currently has only a verified MO NBA route", "unsupported")
    if os.getenv("BET365_ENABLED", "").lower() == "true" and not client.bet365_relay_url:
        raise FeedError("BET365_ENABLED requires BET365_RELAY_URL for the browser publisher source", "configuration_error")
    url = "https://www.mo.bet365.com/contentdata/matchmarketscontentapi/markets"
    # Passing pd through params encodes # as %23; a literal # in a URL starts
    # a fragment and would truncate the query sent to the server.
    text = client.get_text(url, params={
        "lid": "32", "zid": "0", "pd": NBA_PAGE, "cid": "198", "cgid": "3", "ctid": "198",
    }, headers={"Accept": "*/*", "Referer": "https://www.mo.bet365.com/"})
    return parse_markets(text, sport, client)

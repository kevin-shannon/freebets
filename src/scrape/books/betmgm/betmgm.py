"""BetMGM's CDS feed, discovered through the public sports client config."""
import re

from http_client import FeedError
from markets import add_market, event_info, trailing_line

COMPETITIONS = {"nhl": (12, 34), "mlb": (23, 75), "nba": (7, 6004)}


def parse_fixtures(payload, sport, client=None):
    if not isinstance(payload, dict) or not isinstance(payload.get("fixtures"), list):
        raise FeedError("BetMGM response has no fixtures list", "schema_changed")
    formatted = {}
    for fixture in payload["fixtures"]:
        if fixture.get("isOpenForBetting") is False or fixture.get("stage") != "PreMatch":
            continue
        try:
            event, start = event_info(fixture["name"]["value"], fixture["startDate"], sport)
        except Exception as error:
            # Futures and player-special fixtures are intentionally excluded.
            if " at " in fixture.get("name", {}).get("value", "") and client:
                client.warn(f"Skipped event: {error}")
            continue
        markets = fixture.get("optionMarkets", []) + fixture.get("games", [])
        for market in markets:
            if market.get("status", "Visible") != "Visible":
                continue
            label = market.get("name", {}).get("value", "")
            if label in {"Moneyline", "Money Line"}:
                kind, team = "moneyline", None
            elif re.fullmatch(r"(?:Totals|Total Goals|Total Runs)(?: \(including (?:overtime|OT)(?: and shootouts?)?\))?", label, re.I):
                kind, team = "total", None
            elif re.fullmatch(r"(?:Spread|Run Line(?: Spread)?|Puck Line)(?: \(including overtime(?: and shootout)?\))?", label, re.I):
                kind, team = "spread", None
            elif re.fullmatch(r".+: Total (?:points|runs|goals)", label, re.I):
                kind, team = "team_total", label.split(":")[0]
            else:
                continue
            options = market.get("options", market.get("results", []))
            if any(option.get("status", "Visible") != "Visible" for option in options):
                continue
            try:
                selections = []
                for option in options:
                    name = option["name"]["value"]
                    selection = {"name": name, "odds": option.get("price", option)["americanOdds"]}
                    if kind == "spread":
                        selection["line"] = option["attr"] if "attr" in option else trailing_line(name)
                    elif kind in {"total", "team_total"}:
                        selection["line"] = market["attr"] if "attr" in market else trailing_line(name)
                    selections.append(selection)
                add_market(formatted, sport, event, start, kind, selections, team)
            except (KeyError, ValueError, TypeError) as error:
                if client:
                    client.warn(f"Skipped {label}: {error}")
    return formatted


def fetch_sport(sport, client):
    host = f"https://www.{client.region}.betmgm.com"
    config = client.cached_json("betmgm_config", host + "/en/api/clientconfig", headers={
        "x-bwin-sports-api": "prod", "x-from-product": "host-app",
    })
    try:
        connection = config["msConnection"]
        api = connection["cdsApiUrl"].rstrip("/")
        access_id = connection["pushAccessId"]
        if not api.startswith("https://"):
            raise ValueError("Invalid CDS host")
    except (KeyError, TypeError, ValueError) as error:
        raise FeedError("BetMGM client config no longer contains CDS connection details", "schema_changed") from error
    sport_id, competition_id = COMPETITIONS[sport]
    payload = client.get_json(api + "/bettingoffer/fixtures", params={
        "x-bwin-accessid": access_id, "lang": "en-us", "country": "US", "usercountry": "US",
        "state": "Latest", "offerMapping": "All", "sportIds": sport_id,
        "competitionIds": competition_id, "fixtureTypes": "Standard",
    })
    if payload.get("totalCount", 0) > len(payload.get("fixtures", [])):
        client.warn("BetMGM returned a truncated fixture list; coverage is partial")
    return parse_fixtures(payload, sport, client)

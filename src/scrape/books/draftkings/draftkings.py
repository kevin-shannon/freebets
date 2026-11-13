"""DraftKings public control-data/Stadium APIs; live access may be denied.

NBA fields are validated against a browser response supplied by the user.
Live HTTP 403 responses are reported as blocked, never as an empty schedule.
"""
import re
from collections import defaultdict

from http_client import FeedError
from markets import add_market, event_info

LEAGUES = {"nhl": 42133, "mlb": 84240, "nba": 42648}
# NBA request captured in the user's browser and confirmed in its CMS template.
# Subcategory IDs are league-specific; do not reuse 4511 for NHL or MLB.
CONTROL_SUBCATEGORIES = {"nba": "4511"}
LABELS = {
    "moneyline": {"Moneyline", "Money Line"},
    "spread": {"Spread", "Puck Line", "Run Line", "Spread Alternate", "Run Line Alternate", "Alternate Spread", "Alternate Puck Line", "Alternate Run Line"},
    "total": {"Total", "Total Points", "Total Goals", "Total Runs", "Total Alternate", "Alternate Total", "Alternate Total Points", "Alternate Total Goals", "Alternate Total Runs"},
}


def parse_league(payload, sport, client=None):
    if not isinstance(payload, dict) or any(not isinstance(payload.get(k), list) for k in ("events", "markets", "selections")):
        raise FeedError("DraftKings response has no events/markets/selections arrays", "schema_changed")
    events = {}
    for event in payload["events"]:
        if event.get("eventParticipantType") not in {None, "TwoTeam"}:
            continue  # Offseason league responses contain MultiTeam futures.
        if event.get("status") != "NOT_STARTED":
            continue
        if str(event.get("leagueId", LEAGUES[sport])) != str(LEAGUES[sport]):
            continue
        try:
            events[str(event["id"])] = event_info(event["name"], event["startEventDate"], sport)
        except (KeyError, ValueError, TypeError) as error:
            if client:
                client.warn(f"Skipped DraftKings event {event.get('id')}: {error}")
            continue
    selections_by_market = defaultdict(list)
    for selection in payload["selections"]:
        selections_by_market[str(selection.get("marketId"))].append(selection)
    formatted = {}
    for market in payload["markets"]:
        if market.get("isSuspended") or str(market.get("eventId")) not in events:
            continue
        label = market.get("name", "")
        kind = next((kind for kind, labels in LABELS.items() if label in labels), None)
        team = None
        if kind is None:
            match = re.fullmatch(r"(.+?)(?::)? Team Total(?: Points| Runs| Goals)?", label)
            if not match:
                continue
            kind, team = "team_total", match.group(1)
        grouped = defaultdict(list)
        try:
            for selection in selections_by_market[str(market["id"])]:
                if selection.get("isSuspended") or selection.get("hidden"):
                    continue
                item = {"name": selection["label"], "odds": selection["displayOdds"]["american"]}
                if kind in {"total", "team_total", "spread"}:
                    item["line"] = selection["points"]
                    group = abs(float(item["line"])) if kind == "spread" else float(item["line"])
                else:
                    group = None
                grouped[group].append(item)
            event, start = events[str(market["eventId"])]
            for selections in grouped.values():
                add_market(formatted, sport, event, start, kind, selections, team)
        except (KeyError, TypeError, ValueError) as error:
            if client:
                client.warn(f"Skipped {label}: {error}")
    return formatted


def fetch_sport(sport, client):
    if sport in CONTROL_SUBCATEGORIES:
        league_id = str(LEAGUES[sport])
        subcategory_id = CONTROL_SUBCATEGORIES[sport]
        url = (
            f"https://sportsbook-nash.draftkings.com/sites/US-{client.region.upper()}-SB"
            "/api/sportscontent/controldata/league/leagueSubcategory/v1/markets"
        )
        # Pass OData expressions as parameter values so $, quotes, slashes and
        # spaces are encoded exactly once by requests, never by the shell.
        payload = client.get_json(url, params={
            "isBatchable": "false",
            "templateVars": league_id,
            "eventsQuery": (
                f"$filter=leagueId eq '{league_id}' AND "
                f"clientMetadata/Subcategories/any(s: s/Id eq '{subcategory_id}')"
            ),
            "marketsQuery": (
                f"$filter=clientMetadata/subCategoryId eq '{subcategory_id}' AND "
                "tags/all(t: t ne 'SportcastBetBuilder')"
            ),
            "include": "Events",
            "entity": "events",
        })
        # The user's successful browser capture confirms the same three arrays
        # as Stadium. HTTP access is still a separate requirement.
        return parse_league(payload, sport, client)
    base = f"https://sportsbook-nash.draftkings.com/api/sportscontent/dkus{client.region}/v1/leagues/{LEAGUES[sport]}"
    payload = client.get_json(base)
    # Category IDs are discovered, not hardcoded from the discontinued v5 API.
    for category in payload.get("categories", []):
        if category.get("name") in {"Game Lines", "Alt Lines", "Alternate Lines", "Team Totals"}:
            try:
                detail = client.get_json(base + f"/categories/{category['id']}")
                for key in ("events", "markets", "selections"):
                    by_id = {str(item["id"]): item for item in payload.get(key, [])}
                    by_id.update({str(item["id"]): item for item in detail.get(key, [])})
                    payload[key] = list(by_id.values())
            except FeedError as error:
                client.warn(str(error))
    return parse_league(payload, sport, client)

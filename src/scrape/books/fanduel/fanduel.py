"""FanDuel's public attachments API (main and alternate full-game lines)."""
import re
from collections import defaultdict

from http_client import FeedError
from markets import add_market, event_info, trailing_line

PUBLIC_KEY = "FhMFpcPWXMeyZxOx"
LABELS = {
    "moneyline": {"Moneyline", "Moneyline - Inc. OT", "Moneyline (Including Overtime)"},
    "total": {"Total Points", "Total Goals", "Total Runs", "Alternate Total Points", "Alternate Total Goals", "Alternate Total Runs"},
    "spread": {"Spread", "Puck Line", "Run Line", "Alternate Puck Line", "Alternate Run Lines", "Alternate Run Line", "Alternative Spreads", "Alternate Spread", "Alternate Spreads"},
}


def parse_attachments(payload, sport, client=None):
    try:
        attachments = payload["attachments"]
        competitions = attachments["competitions"]
        raw_events = attachments["events"]
        markets = attachments["markets"]
    except (KeyError, TypeError) as error:
        raise FeedError("FanDuel response has no competition/event/market attachments", "schema_changed") from error
    league_names = {sport.upper(), "NHL - Matches"} if sport == "nhl" else {sport.upper()}
    competition_ids = {str(key) for key, value in competitions.items() if value.get("name") in league_names}
    ids = {}
    for key, event in raw_events.items():
        if str(event.get("competitionId")) not in competition_ids:
            continue
        try:
            ids[str(key)] = event_info(event["name"], event["openDate"], sport)
        except Exception:
            continue  # League attachments also contain season futures and awards.
    formatted = {}
    for market in markets.values():
        if market.get("marketStatus") != "OPEN" or market.get("inPlay"):
            continue
        event_id = str(market.get("eventId"))
        if event_id not in ids:
            continue
        label = market.get("marketName", "")
        kind = next((kind for kind, labels in LABELS.items() if label in labels), None)
        if kind is None:
            continue
        runners = market.get("runners", [])
        if any(runner.get("runnerStatus") != "ACTIVE" for runner in runners):
            continue
        grouped = defaultdict(list)
        try:
            for runner in runners:
                name = runner["runnerName"]
                selection = {"name": name, "odds": runner["winRunnerOdds"]["americanDisplayOdds"]["americanOdds"]}
                if kind in {"spread", "total"}:
                    # Main lines use handicap; alternate runners embed it in the label.
                    embedded = re.search(r"[+\-−]?\d+(?:\.\d+)?\)?$", name.strip())
                    line = trailing_line(name) if embedded else runner["handicap"]
                    selection["line"] = line
                    group = abs(float(line)) if kind == "spread" else float(line)
                else:
                    group = None
                grouped[group].append(selection)
            event, start = ids[event_id]
            for selections in grouped.values():
                add_market(formatted, sport, event, start, kind, selections)
        except (KeyError, ValueError, TypeError) as error:
            if client:
                client.warn(f"Skipped {label}: {error}")
    return formatted


def fetch_sport(sport, client):
    url = f"https://sbapi.{client.region}.sportsbook.fanduel.com/api/content-managed-page"
    payload = client.get_json(url, params={"page": "CUSTOM", "customPageId": sport, "_ak": PUBLIC_KEY})
    return parse_attachments(payload, sport, client)

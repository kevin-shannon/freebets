"""Caesars v4 schedule and event detail API, as used by its public web client."""
import uuid

from http_client import FeedError
from markets import add_market, event_info

COMPETITIONS = {
    "nhl": ("icehockey", "b7b715a9-c7e8-4c47-af0a-77385b525e09"),
    "mlb": ("baseball", "04f90892-3afa-4e84-acce-5b89f151063d"),
    "nba": ("basketball", "5806c896-4eec-4de1-874f-afed93114b8c"),
}
LABELS = {
    "moneyline": {"Money Line", "Moneyline"},
    "spread": {"Spread", "Run Line", "Puck Line", "Alternative Puck Line Handicap", "Alternative Spread", "Alternative Run Line"},
    "total": {"Total Points", "Total Goals", "Total Runs", "Alternative Total Goals", "Alternative Total Points", "Alternative Total Runs"},
}


def request_headers(client):
    """Public client metadata. No bearer token or browser WAF token is needed."""
    if "caesars_device_id" not in client.cache:
        client.cache["caesars_device_id"] = str(uuid.uuid4())
    return {
        "Content-Type": "application/json",
        "X-Platform-Type": "W",
        "X-Platform": "rn-web",
        "X-App-Version": "10.7.7",
        "X-Unique-Device-Id": client.cache["caesars_device_id"],
    }


def parse_event(payload, sport, client=None):
    if not isinstance(payload, dict) or not isinstance(payload.get("event"), dict):
        raise FeedError("Caesars v4 response has no event object", "schema_changed")
    event = payload["event"]
    if event.get("display") is False or event.get("active") is False or event.get("started"):
        return {}
    try:
        name, start = event_info(event["name"], event["startTime"], sport)
    except Exception:
        return {}
    if not isinstance(event.get("keyMarketGroups"), list):
        raise FeedError("Caesars v4 event has no keyMarketGroups", "schema_changed")
    formatted = {}
    for group in event["keyMarketGroups"]:
        if group.get("isOddsBoost"):
            continue
        for market in group.get("markets", []):
            if market.get("active") is False or market.get("display") is False or market.get("placeholder"):
                continue
            label = (market.get("name") or market.get("templateName") or "").replace("|", "")
            kind = next((kind for kind, labels in LABELS.items() if label in labels), None)
            if kind is None:
                continue
            selections = market.get("selections", [])
            if any(s.get("active") is False or s.get("display") is False for s in selections):
                continue
            try:
                outcomes = []
                for selection in selections:
                    item = {"name": selection["name"].replace("|", ""), "odds": selection["price"]["a"]}
                    if kind == "spread":
                        # The v4 client treats market.line as the HOME handicap.
                        if selection.get("type") not in {"home", "away"}:
                            raise ValueError("Spread selection has no home/away type")
                        item["line"] = float(market["line"]) * (-1 if selection["type"] == "away" else 1)
                    elif kind == "total":
                        item["line"] = market["line"]
                    outcomes.append(item)
                add_market(formatted, sport, name, start, kind, outcomes)
            except (KeyError, TypeError, ValueError) as error:
                if client:
                    client.warn(f"Skipped {label}: {error}")
    return formatted


def fetch_sport(sport, client):
    base = f"https://api.americanwagering.com/regions/us/locations/{client.region}/brands/czr/sb/v4"
    sport_id, competition_id = COMPETITIONS[sport]
    headers = request_headers(client)
    schedule = client.get_json(base + f"/sports/{sport_id}/schedule", params={"competitionId": competition_id}, headers=headers)
    if not isinstance(schedule, list):
        raise FeedError("Caesars v4 schedule is not an array", "schema_changed")
    formatted, errors = {}, []
    for event in schedule:
        if not event.get("eventId") or event.get("started"):
            continue
        try:
            payload = client.get_json(base + f"/events/{event['eventId']}", params={"useEventPayloadWithTabNav": "true"}, headers=headers)
            parsed = parse_event(payload, sport, client)
            for name, starts in parsed.items():
                formatted.setdefault(name, {}).update(starts)
        except FeedError as error:
            errors.append(error)
            client.warn(str(error))
    if errors and not formatted:
        raise errors[0]
    return formatted

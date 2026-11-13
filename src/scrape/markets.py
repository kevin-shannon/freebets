"""Normalize only complete, full-game two-way markets across sportsbooks."""
import math
import re
from datetime import datetime, timezone

from utils import convert_team_event_name, standardize_team_name


def parse_start(value):
    # DraftKings emits seven fractional digits; normalize to microseconds so
    # older local Python versions can parse the same feed as Lambda.
    value = re.sub(
        r"\.(\d+)(?=Z$|[+-]\d{2}:\d{2}$|$)",
        lambda match: "." + match.group(1)[:6].ljust(6, "0"),
        value,
    )
    start = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if start.tzinfo is None:
        raise ValueError("Start time has no timezone")
    return start.astimezone(timezone.utc).replace(tzinfo=None)


def american_odds(value):
    if isinstance(value, bool):
        raise ValueError("Invalid odds")
    text = str(value).replace("−", "-").strip()
    if text.upper() in {"EVEN", "EVS"}:
        return 100
    odds = float(text)
    if not math.isfinite(odds) or not odds.is_integer() or abs(odds) < 100:
        raise ValueError("Invalid American odds")
    return int(odds)


def line_number(value):
    number = float(str(value).replace("−", "-"))
    if not math.isfinite(number):
        raise ValueError("Invalid line")
    return 0.0 if number == 0 else number


def trailing_line(label):
    match = re.search(r"([+\-−]?\d+(?:\.\d+)?)\)?\s*$", label)
    if not match:
        raise ValueError(f"No line in {label}")
    return line_number(match.group(1))


def event_info(name, start, sport):
    return convert_team_event_name(name.replace("|", ""), sport), parse_start(start)


def add_market(events, sport, event, start, kind, selections, team=None):
    """Selections contain name, odds and (for spreads/totals) line.

    Validate both sides before saving anything, so suspended or mismatched lines
    cannot create a fictitious hedge. A zero spread uses a stable team ordering.
    """
    if len(selections) != 2:
        return False
    teams = event.split(" vs ")
    outcomes = []
    for selection in selections:
        odds = american_odds(selection["odds"])
        if kind in {"moneyline", "spread"}:
            name = standardize_team_name(selection["name"], sport)
            if name not in teams:
                return False
        else:
            match = re.match(r"^(Over|Under)\b", selection["name"], re.I)
            if not match:
                return False
            name = match.group(1).title()
        if kind == "spread":
            line = line_number(selection["line"])
            name = f"{name} {line:+.1f}" if line > 0 else f"{name} {line:.1f}"
        outcomes.append({"name": name, "odds": odds})
    if outcomes[0]["name"] == outcomes[1]["name"]:
        return False
    if kind == "moneyline":
        market = "Moneyline"
    elif kind == "spread":
        lines = [line_number(s["line"]) for s in selections]
        if lines[0] != -lines[1]:
            return False
        favorite = next((i for i, value in enumerate(lines) if value < 0), None)
        if favorite is None:
            market = f"Spread: {teams[0]}: 0.0"
        else:
            name = standardize_team_name(selections[favorite]["name"], sport)
            market = f"Spread: {name}: {lines[favorite]:.1f}"
    elif kind in {"total", "team_total"}:
        lines = [line_number(s["line"]) for s in selections]
        if lines[0] != lines[1] or lines[0] < 0:
            return False
        if kind == "team_total":
            team = standardize_team_name(team, sport)
            if team not in teams:
                return False
            market = f"Team Total: {team}: {lines[0]:.1f}"
        else:
            market = f"Total: {lines[0]:.1f}"
    else:
        raise ValueError(f"Unsupported market kind: {kind}")
    offers = events.setdefault(event, {}).setdefault(start, {"offers": {}})["offers"]
    offers[market] = sorted(outcomes, key=lambda outcome: outcome["name"])
    return True

"""Collect public sportsbook odds locally or on each Lambda invocation."""
import argparse
import json
import os
import tempfile
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from books.betmgm.betmgm import fetch_sport as fetch_betmgm
from books.caesars.caesars import fetch_sport as fetch_caesars
from books.draftkings.draftkings import fetch_sport as fetch_draftkings
from books.fanduel.fanduel import fetch_sport as fetch_fanduel
from http_client import FeedClient, FeedError
from markets import american_odds

ROOT = Path(__file__).resolve().parents[2]
FETCHERS = {"betmgm": fetch_betmgm, "caesars": fetch_caesars, "draftkings": fetch_draftkings, "fanduel": fetch_fanduel}
SPORTS = ("nhl", "mlb", "nba")


def utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def counts(events):
    return {
        "events": sum(1 for starts in events.values() for item in starts.values() if item["offers"]),
        "markets": sum(len(item["offers"]) for starts in events.values() for item in starts.values()),
    }


def collect(books=None, sports=SPORTS, region=None):
    books = list(FETCHERS) if books is None else list(books)
    region = region or os.getenv("SPORTSBOOK_REGION", "nj")
    client = FeedClient(region)
    data, statuses = {}, {}
    try:
        for book in books:
            if book not in FETCHERS:
                raise ValueError(f"Unknown sportsbook: {book}")
            data[book], sport_statuses = {}, {}
            for sport in sports:
                client.warnings = []
                try:
                    events = FETCHERS[book](sport, client)
                    data[book][sport] = events
                    totals = counts(events)
                    state = "partial" if client.warnings else "ok" if totals["markets"] else "no_events"
                    sport_statuses[sport] = {"state": state, **totals}
                    if client.warnings:
                        sport_statuses[sport]["warnings"] = client.warnings[:20]
                except Exception as error:
                    data[book][sport] = {}
                    sport_statuses[sport] = {
                        "state": error.state if isinstance(error, FeedError) else "error",
                        "message": str(error), "events": 0, "markets": 0,
                    }
                status = sport_statuses[sport]
                print(f"{book:12} {sport:3} {status['state']:19} {status['events']:3} events, {status['markets']:4} markets", flush=True)
                if status.get("message"):
                    print("  " + status["message"], flush=True)
            total_events = sum(s["events"] for s in sport_statuses.values())
            total_markets = sum(s["markets"] for s in sport_statuses.values())
            states = {s["state"] for s in sport_statuses.values()}
            if states <= {"ok", "no_events"}:
                state = "ok" if total_markets else "no_events"
            elif total_markets:
                state = "partial"
            else:
                state = next(iter(states)) if len(states) == 1 else "error"
            statuses[book] = {"state": state, "events": total_events, "markets": total_markets, "sports": sport_statuses}
    finally:
        client.close()
    rows = aggregate(data)
    failed = any(status["state"] not in {"ok", "no_events"} for status in statuses.values())
    report = {
        "generatedAt": utc_now(), "region": client.region,
        "state": ("partial" if failed else "ok") if rows else "failed" if failed else "no_events",
        "marketCount": len(rows), "books": statuses,
    }
    return rows, report


def make_market_simple(market):
    return market.split(":")[0]


def make_outcome_simple(market, outcome):
    if market == "Moneyline" or market.startswith("Spread:"):
        return outcome["name"]
    if market.startswith("Team Total:"):
        _, team, line = market.split(":")
        return f'{team.strip()} {outcome["name"]} {line.strip()}'
    if market.startswith("Total:"):
        return f'{outcome["name"]} {market.split(":")[1].strip()}'
    raise ValueError(f"Unknown market: {market}")


def is_same_start(datetime1, datetime2):
    # NHL feeds disagree by eight minutes (broadcast start versus puck drop).
    return datetime1 is not None and datetime2 is not None and abs(datetime1 - datetime2) <= timedelta(minutes=10)


def aggregate(data):
    bets, event_starts = {}, {}
    for book, sports in data.items():
        for sport, events in (sports or {}).items():
            for event, starts in (events or {}).items():
                for start, item in starts.items():
                    if not isinstance(start, datetime):
                        continue  # Unknown start times cannot safely be matched across books.
                    known = event_starts.setdefault((sport, event), [])
                    canonical = next((other for other in known if is_same_start(start, other)), None)
                    if canonical is None:
                        known.append(start)
                        canonical = start
                    start_string = canonical.strftime("%Y-%m-%dT%H:%M:%SZ")
                    for market, outcomes in item.get("offers", {}).items():
                        if len(outcomes) != 2:
                            continue
                        try:
                            normalized = [(make_outcome_simple(market, o), american_odds(o["odds"])) for o in outcomes]
                        except (KeyError, ValueError, TypeError):
                            continue
                        if normalized[0][0] == normalized[1][0]:
                            continue
                        # Include outcome identities so incompatible two-way markets stay separate.
                        key = (sport, event, start_string, market, tuple(sorted(name for name, odds in normalized)))
                        if key not in bets:
                            bets[key] = {
                                "sport": sport, "event": event, "market": make_market_simple(market), "start": start_string,
                                "outcomes": [{"name": name, "books": {}} for name in sorted(name for name, odds in normalized)],
                            }
                        by_name = {o["name"]: o for o in bets[key]["outcomes"]}
                        for name, odds in normalized:
                            books = by_name[name]["books"].setdefault(odds, [])
                            if book not in books:
                                books.append(book)
    return sorted(bets.values(), key=lambda bet: (bet["start"], bet["sport"], bet["event"], bet["market"]))


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, delete=False) as stream:
            temporary = Path(stream.name)
            json.dump(value, stream, ensure_ascii=False, allow_nan=False)
            stream.write("\n")
        temporary.replace(path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def local(books=None, sports=SPORTS, region=None, output=None, status_output=None):
    rows, report = collect(books, sports, region)
    # Keep the last file for diagnosis, but mark total failures in the status file.
    if report["state"] != "failed":
        write_json(output or ROOT / "public/output.json", rows)
    write_json(status_output or ROOT / "public/scrape-status.json", report)
    return report


def lambda_handler(event, context):
    # Network requests happen on EVERY invocation, including warm Lambda invocations.
    import boto3
    rows, report = collect()
    s3 = boto3.client("s3")
    bucket = os.getenv("OUTPUT_BUCKET", "stanleys-bucket")
    common = {"Bucket": bucket, "ContentType": "application/json", "CacheControl": "no-cache", "ACL": "public-read"}
    if report["state"] != "failed":
        s3.put_object(Key="output.json", Body=json.dumps(rows), **common)
    s3.put_object(Key="scrape-status.json", Body=json.dumps(report), **common)
    if report["state"] == "failed":
        raise RuntimeError("All sportsbook feeds failed; previous output.json preserved. See scrape-status.json.")
    return {"state": report["state"], "markets": len(rows)}


def cli():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("local", "check"))
    parser.add_argument("--books", nargs="+", choices=tuple(FETCHERS))
    parser.add_argument("--sports", nargs="+", choices=SPORTS, default=SPORTS)
    parser.add_argument("--region", default=os.getenv("SPORTSBOOK_REGION", "nj"))
    parser.add_argument("--output", type=Path)
    parser.add_argument("--status-output", type=Path)
    parser.add_argument("--watch", action="store_true", help="Refresh local files repeatedly")
    parser.add_argument("--interval", type=int, default=60, help="Seconds between refreshes (minimum 30)")
    args = parser.parse_args()
    if args.watch and args.command != "local":
        parser.error("--watch is only supported with local")
    if args.interval < 30:
        parser.error("--interval must be at least 30 seconds")
    try:
        while True:
            if args.command == "local":
                report = local(args.books, args.sports, args.region, args.output, args.status_output)
            else:
                _, report = collect(args.books, args.sports, args.region)
                if args.status_output:
                    write_json(args.status_output, report)
            print(f"{report['state']}: {report['marketCount']} normalized markets", flush=True)
            if not args.watch:
                return 1 if report["state"] in {"failed", "partial"} else 0
            time.sleep(args.interval)
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    raise SystemExit(cli())

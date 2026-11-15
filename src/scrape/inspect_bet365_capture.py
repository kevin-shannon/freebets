"""Validate pipe text supplied on stdin; emit normalized public odds only.

This command performs no network requests and never reads browser credentials.
"""
import json
import argparse
import sys
from pathlib import Path
from types import SimpleNamespace

from books.bet365.bet365 import parse_markets
from http_client import FeedError
from main import aggregate, counts, write_json


def inspect_capture(text):
    warnings = []
    events = parse_markets(text, client=SimpleNamespace(warn=warnings.append))
    rows = aggregate({"bet365": {"nba": events}})
    return {
        "state": "partial" if warnings else "ok" if rows else "no_events",
        **counts(events), "normalizedMarkets": len(rows),
        "warningCount": len(warnings), "rows": rows,
    }


def cli():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, help="Saved public response; otherwise read stdin")
    parser.add_argument("--output", type=Path, help="Write normalized odds here and print counts only")
    args = parser.parse_args()
    try:
        stream = args.file.open("rb") if args.file else sys.stdin.buffer
        try:
            raw = stream.read(8 * 1024 * 1024 + 1)
        finally:
            if args.file:
                stream.close()
        if len(raw) > 8 * 1024 * 1024:
            raise ValueError("Capture exceeds 8 MiB")
        result = inspect_capture(raw.decode("utf-8-sig"))
    except (FeedError, ValueError, UnicodeError, OSError):
        print(json.dumps({"state": "invalid_feed", "rows": []}))
        return 1
    if args.output:
        write_json(args.output, result["rows"])
        result = {key: value for key, value in result.items() if key != "rows"}
    print(json.dumps(result, allow_nan=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(cli())

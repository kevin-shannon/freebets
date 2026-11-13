"""Verify a synchronous Lambda invocation without failing on usable partial feeds."""
import argparse
import json
import os
from pathlib import Path


def assess_collection(metadata, result):
    if not isinstance(metadata, dict) or metadata.get("StatusCode") != 200 or metadata.get("FunctionError"):
        raise ValueError("Lambda invocation failed; check the invocation response.")
    if not isinstance(result, dict):
        raise ValueError("Lambda returned an invalid collection response.")
    state, markets = result.get("state"), result.get("markets")
    if type(markets) is not int or markets < 0:
        raise ValueError("Lambda returned an invalid market count.")
    if state == "no_events" and markets == 0:
        return "notice", "Lambda deployed and collected successfully; no eligible events are available."
    if state == "ok" and markets > 0:
        return "notice", f"Lambda deployed and collected {markets} markets with complete coverage."
    if state == "partial" and markets > 0:
        return "warning", (
            f"Lambda deployed and collected {markets} markets with partial sportsbook coverage. "
            "One or more feeds are unavailable; see scrape-status.json for per-book errors."
        )
    raise ValueError(f"Live collection failed or returned inconsistent results (state={state!r}, markets={markets}).")


def annotation(level, message):
    escaped = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    print(f"::{level}::{escaped}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("metadata", type=Path)
    parser.add_argument("result", type=Path)
    args = parser.parse_args()
    try:
        metadata = json.loads(args.metadata.read_text(encoding="utf-8"))
        result = json.loads(args.result.read_text(encoding="utf-8"))
        print(json.dumps(result, indent=2))
        level, message = assess_collection(metadata, result)
    except (OSError, ValueError) as error:
        annotation("error", str(error))
        return 1
    annotation(level, message)
    if os.getenv("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as stream:
            stream.write(f"### Live collection\n\n{message}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Run a loopback-only browser capture relay for local end-to-end testing."""
import argparse
import logging
from pathlib import Path
import secrets
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from caesars_relay.server import make_server


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8788)
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("Use a port between 1024 and 65535")
    folder = ROOT / ".local/bet365-publisher"
    folder.mkdir(parents=True, exist_ok=True)
    token_file = folder / "relay-token.txt"
    try:
        with token_file.open("x", encoding="ascii") as stream:
            stream.write(secrets.token_urlsafe(48))
    except FileExistsError:
        pass
    server = make_server(("127.0.0.1", args.port), token_file.read_text(encoding="ascii").strip(),
                         enable_bet365=True, bet365_source="browser")
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    print(f"Local browser relay: http://127.0.0.1:{args.port}", flush=True)
    print(f"Relay token is in {token_file} (copy into the extension; do not paste in chat).", flush=True)
    print("Capture TTL: 120 seconds. No public feed or AWS setting is changed.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

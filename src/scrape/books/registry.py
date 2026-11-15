"""Explicitly enabled adapters, shared by local checks and Lambda collection.

Each adapter lives at books/<id>/<id>.py and exports fetch_sport(sport, client).
Keep experimental adapters out of CONNECTED_BOOKS until their real responses
and failure behavior have been verified. Discovery must not enable feeds merely
because a directory exists.
"""
from importlib import import_module

CONNECTED_BOOKS = ("betmgm", "caesars", "draftkings", "fanduel")
EXPERIMENTAL_BOOKS = ("bet365",)


def registered_fetchers(books=CONNECTED_BOOKS):
    return {
        book: import_module(f"books.{book}.{book}").fetch_sport
        for book in books
    }

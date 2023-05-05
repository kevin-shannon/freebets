from .nhl import generate_superbook_nhl_formatted_events
from .mlb import generate_superbook_mlb_formatted_events
from .nba import generate_superbook_nba_formatted_events


def generate_superbook():
    return {
        'nhl': generate_superbook_nhl_formatted_events(),
        'mlb': generate_superbook_mlb_formatted_events(),
        'nba': generate_superbook_nba_formatted_events(),
    }
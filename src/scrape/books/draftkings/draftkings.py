from .nhl import generate_draftkings_nhl_formatted_events
from .mlb import generate_draftkings_mlb_formatted_events


def generate_draftkings():
    return {
        'nhl': generate_draftkings_nhl_formatted_events(),
        'mlb': generate_draftkings_mlb_formatted_events(),
    }

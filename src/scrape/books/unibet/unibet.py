from .nhl import generate_unibet_nhl_formatted_events
from .mlb import generate_unibet_mlb_formatted_events


def generate_unibet():
    return {
        'nhl': generate_unibet_nhl_formatted_events(),
        'mlb': generate_unibet_mlb_formatted_events(),
    }
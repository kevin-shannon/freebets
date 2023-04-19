from .nhl import generate_caesars_nhl_formatted_events
from .mlb import generate_caesars_mlb_formatted_events


def generate_caesars():
    return {
        'nhl': generate_caesars_nhl_formatted_events(),
        'mlb': generate_caesars_mlb_formatted_events(),
    }
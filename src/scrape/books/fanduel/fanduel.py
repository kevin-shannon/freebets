from .nhl import generate_fanduel_nhl_formatted_events
from .mlb import generate_fanduel_mlb_formatted_events
from .nba import generate_fanduel_nba_formatted_events


def generate_fanduel():
    return {
        'nhl': generate_fanduel_nhl_formatted_events(),
        'mlb': generate_fanduel_mlb_formatted_events(),
        'nba': generate_fanduel_nba_formatted_events(),
    }

    
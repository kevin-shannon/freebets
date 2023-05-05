from .nhl import generate_betmgm_nhl_formatted_events
from .mlb import generate_betmgm_mlb_formatted_events
from .nba import generate_betmgm_nba_formatted_events


def generate_betmgm():
    return {
        'nhl': generate_betmgm_nhl_formatted_events(),
        'mlb': generate_betmgm_mlb_formatted_events(),
        'nba': generate_betmgm_nba_formatted_events(),
    }
from .nhl import generate_pointsbet_nhl_formatted_events
from .mlb import generate_pointsbet_mlb_formatted_events
from .nba import generate_pointsbet_nba_formatted_events


def generate_pointsbet():
    return {
        'nhl': generate_pointsbet_nhl_formatted_events(),
        'mlb': generate_pointsbet_mlb_formatted_events(),
        'nba': generate_pointsbet_nba_formatted_events(),
    }
import requests
from utils import convert_event_name_nhl, convert_team_name_nhl, convert_decimal_to_american

def generate_pointsbet():
    return {
        'nhl': generate_pointsbet_nhl_formatted_events()
    }

# POINTSBET
# NHL
def generate_pointsbet_nhl_formatted_events():
    url = 'https://api.nj.pointsbet.com/api/v2/competitions/4/events/featured?includeLive=false&page=1'
    res = requests.get(url).json()
    formatted_events = {}
    for event in res['events']:
        event_name = convert_event_name_nhl(event['name'])
        for market in event['specialFixedOddsMarkets']:
            if market['eventName'] == 'Moneyline':
                if float(market['outcomes'][0]['price']) == 1 or float(market['outcomes'][1]['price']) == 1:
                    continue
                formatted_events[event_name] = {'Moneyline': [{'name': convert_team_name_nhl(outcome['name']), 'odds': convert_decimal_to_american(float(outcome['price']))} for outcome in market['outcomes']]}
    return formatted_events
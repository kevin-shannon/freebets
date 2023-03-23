import requests
from utils import convert_event_name_nhl, convert_team_name_nhl, convert_market_name, convert_decimal_to_american

def generate_superbook():
    return {
        'nhl': generate_superbook_nhl_formatted_events()
    }

# SUPERBOOK
# NHL
def generate_superbook_nhl_formatted_events():
    url = 'https://nj.superbook.com/cache/psmg/UK/52180.1.json'
    res = requests.get(url).json()
    formatted_events = {}
    for event in res['events']:
        event_name = convert_event_name_nhl(event['eventname'])
        for market in event['markets']:
            market_name = convert_market_name(market['name'])
            if market_name == 'Moneyline':
                formatted_events[event_name] = {market_name : [{'name': convert_team_name_nhl(outcome['name']), 'odds': convert_decimal_to_american(float(outcome['price']))} for outcome in market['selections']]}
    return formatted_events
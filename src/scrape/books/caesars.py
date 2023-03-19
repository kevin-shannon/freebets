import requests
from utils import convert_event_name_nhl, convert_market_name, convert_team_name_nhl, construct_spread_market_name, construct_total_market_name, convert_outcome_name, convert_spread_nhl

def generate_caesars():
    return {
        'nhl': generate_caesars_nhl_formatted_events()
    }

# CAESARS
# NHL
def generate_caesars_nhl_formatted_events():
    url = 'https://api.americanwagering.com/regions/us/locations/mi/brands/czr/sb/v3/sports/icehockey/events/schedule/?competitionIds=b7b715a9-c7e8-4c47-af0a-77385b525e09'
    res = requests.get(url).json()
    formatted_events = {}
    events = res['competitions'][0]['events']
    for event in events:
        event_name = convert_event_name_nhl(event['name'])
        for market in event['markets']:
            market_name = convert_market_name(market['name'])
            if market_name == 'Moneyline':
                formatted_events[event_name] = {market_name: [{'name': convert_team_name_nhl(outcome['name']), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]}
        url = f'https://www.williamhill.com/us/mi/bet/api/v3/events/{event["id"]}'
        res = requests.get(url).json()
        for market in res['markets']:
            # Totals
            if 'Alternative Total Goals' in market['name']:
                market_name = construct_total_market_name(market['line'])
                formatted_events[event_name][market_name] = [{'name': convert_outcome_name(outcome['name']), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]
            # Spreads
            if 'Alternative Puck Line Handicap' in market['name']:
                line = float(market['line'])
                if line < 0:
                    team = convert_team_name_nhl(market['selections'][1]['name'])
                else:
                    team = convert_team_name_nhl(market['selections'][0]['name'])
                    line = -line
                market_name = construct_spread_market_name(team, line)
                formatted_events[event_name][market_name] = [{'name': convert_spread_nhl(outcome['name'], market_name), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]
    return formatted_events
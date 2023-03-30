import requests
from datetime import datetime

from utils import construct_spread_market_name
from utils import construct_total_market_name
from utils import convert_event_name_nhl
from utils import convert_outcome_name
from utils import convert_spread_nhl
from utils import convert_team_name_nhl

MONEYLINE = '|Money Line|'
TOTAL = '|Alternative Total Goals|'
SPREAD = '|Alternative Puck Line Handicap|'

def generate_caesars():
    return {
        'nhl': generate_caesars_nhl_formatted_events()
    }

# CAESARS
# NHL
def generate_caesars_nhl_formatted_events():
    formatted_events = {}
    url = 'https://api.americanwagering.com/regions/us/locations/mi/brands/czr/sb/v3/sports/icehockey/events/schedule/?competitionIds=b7b715a9-c7e8-4c47-af0a-77385b525e09'
    try:
        res = requests.get(url).json()
    except:
        print('error getting url')
        return formatted_events
    try:
        events = res['competitions'][0]['events']
    except:
        print('error parsing events')  
        return formatted_events
    for event in events:
        try:
            event_name = convert_event_name_nhl(event['name'])
        except:
            print('error converting event name')
            continue
        formatted_events[event_name] = {'offers': {}}
        try:
            formatted_events[event_name]['start'] = datetime.strptime(event['startTime'], '%Y-%m-%dT%H:%M:%SZ')
        except ValueError:
            print('error parsing date time')
            formatted_events[event_name]['start'] = None
        url = f'https://www.williamhill.com/us/mi/bet/api/v3/events/{event["id"]}'
        try:
            res = requests.get(url).json()
        except:
            print('error getting url')
            continue
        try:
            markets = res['markets']
        except:
            print('error getting markets')
            continue
        for market in markets:
            try:
                label = market['name']
            except:
                print('error getting label')
                continue
            # Moneyline
            if label == MONEYLINE:
                try:
                    market_name = 'Moneyline'
                    formatted_events[event_name]['offers'][market_name] = [{'name': convert_team_name_nhl(outcome['name']), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]
                except:
                    print('something went wrong adding moneyline market')
            # Totals
            elif label == TOTAL:
                try:
                    market_name = construct_total_market_name(market['line'])
                    formatted_events[event_name]['offers'][market_name] = [{'name': convert_outcome_name(outcome['name']), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]
                except:
                    print('something went wrong adding total market')
            # Spreads
            elif label == SPREAD:
                try:
                    line = float(market['line'])
                    if line < 0:
                        team = convert_team_name_nhl(market['selections'][1]['name'])
                    else:
                        team = convert_team_name_nhl(market['selections'][0]['name'])
                        line = -line
                    market_name = construct_spread_market_name(team, line)
                    formatted_events[event_name]['offers'][market_name] = [{'name': convert_spread_nhl(outcome['name'], market_name), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]
                except:
                    print('something went wrong adding spread market')
    return formatted_events
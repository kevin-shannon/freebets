import requests
from datetime import datetime

from utils import construct_spread_market_name
from utils import construct_team_spread_from_market_name
from utils import construct_total_market_name
from utils import convert_team_event_name
from utils import standardize_over_under
from utils import standardize_team_name


MONEYLINE = '|Money Line|'
TOTAL = '|Total Points|'
SPREAD = '|Spread|'

def generate_caesars_nba_formatted_events():
    formatted_events = {}
    sport = 'nba'
    url = 'https://api.americanwagering.com/regions/us/locations/mi/brands/czr/sb/v3/sports/basketball/events/schedule/?competitionIds=5806c896-4eec-4de1-874f-afed93114b8c'
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
            event_name = convert_team_event_name(event['name'].replace('|', ''), sport)
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
                    formatted_events[event_name]['offers'][market_name] = [{'name': standardize_team_name(outcome['name'], sport), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]
                except:
                    print('something went wrong adding moneyline market')
            # Totals
            elif label == TOTAL:
                try:
                    market_name = construct_total_market_name(market['line'])
                    formatted_events[event_name]['offers'][market_name] = [{'name': standardize_over_under(outcome['name']), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]
                except:
                    print('something went wrong adding total market')
            # Spreads
            elif label == SPREAD:
                try:
                    line = float(market['line'])
                    if line < 0:
                        team = standardize_team_name(market['selections'][1]['name'], sport)
                    else:
                        team = standardize_team_name(market['selections'][0]['name'], sport)
                        line = -line
                    market_name = construct_spread_market_name(team, line, sport)
                    formatted_events[event_name]['offers'][market_name] = [{'name': construct_team_spread_from_market_name(outcome['name'], market_name, sport), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]
                except:
                    print('something went wrong adding spread market')
    return formatted_events
import re
import requests
from datetime import datetime

from utils import construct_spread_market_name
from utils import construct_team_spread_from_market_name
from utils import construct_total_market_name
from utils import convert_team_event_name
from utils import standardize_over_under
from utils import standardize_team_name


nhl = {
    'sport': 'nhl',
    'url': 'https://api.americanwagering.com/regions/us/locations/mi/brands/czr/sb/v3/sports/icehockey/events/schedule/?competitionIds=b7b715a9-c7e8-4c47-af0a-77385b525e09',
    'market_labels': {"MONEYLINE": r'^\|Money Line\|', "TOTAL": r'^\|Alternative Total Goals\|$', "SPREAD": r'^\|Alternative Puck Line Handicap\|$'}
}

mlb = {
    'sport': 'mlb',
    'url': 'https://api.americanwagering.com/regions/us/locations/mi/brands/czr/sb/v3/sports/baseball/events/schedule/?competitionIds=04f90892-3afa-4e84-acce-5b89f151063d',
    'market_labels': {"MONEYLINE": r'^\|Money Line\|$', "TOTAL": r'^\|Total Runs\|$', "SPREAD": r'^\|Run Line\|$'}
}

nba = {
    'sport': 'nba', 
    'url': 'https://api.americanwagering.com/regions/us/locations/mi/brands/czr/sb/v3/sports/basketball/events/schedule/?competitionIds=5806c896-4eec-4de1-874f-afed93114b8c', 
    'market_labels': {"MONEYLINE": r'^\|Money Line\|$', "TOTAL": r'^\|Total Points\|$', "SPREAD": r'^\|Spread\|$'}
}

def generate_caesars():
    return {
        'nhl': generate_caesars_formatted_events(**nhl),
        'mlb': generate_caesars_formatted_events(**mlb),
        'nba': generate_caesars_formatted_events(**nba),
    }

def generate_caesars_formatted_events(url, sport, market_labels):
    formatted_events = {}
    headers = {'Cache-Control': 'no-cache', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
    try:
        res = requests.get(url, headers=headers).json()
    except:
        print('error getting api.americanwagering.com')
        return formatted_events
    try:
        if len(res['competitions']) == 0:
            print(f'{sport} has no competitions')
            return formatted_events

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
        try:
            start = datetime.strptime(event['startTime'], '%Y-%m-%dT%H:%M:%SZ')
        except ValueError:
            print('error parsing date time')
            start = None
        if event_name not in formatted_events:
            formatted_events[event_name] = {}
        formatted_events[event_name][start] = {'offers': {}}
        url = f'https://api.americanwagering.com/regions/us/locations/il/brands/czr/sb/v3/events/{event["id"]}'
        try:
            res = requests.get(url, headers=headers).json()
        except:
            print('error getting williamhill.com')
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
            if re.match(market_labels["MONEYLINE"], label):
                try:
                    formatted_events[event_name][start]['offers']['Moneyline'] = [{'name': standardize_team_name(outcome['name'], sport), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]
                except:
                    print('something went wrong adding moneyline market')
            # Totals
            elif re.match(market_labels["TOTAL"], label):
                try:
                    market_name = construct_total_market_name(market['line'])
                    formatted_events[event_name][start]['offers'][market_name] = [{'name': standardize_over_under(outcome['name']), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]
                except:
                    print('something went wrong adding total market')
            # Spreads
            elif re.match(market_labels["SPREAD"], label):
                try:
                    line = float(market['line'])
                    if line < 0:
                        team = standardize_team_name(market['selections'][1]['name'], sport)
                    else:
                        team = standardize_team_name(market['selections'][0]['name'], sport)
                        line = -line
                    market_name = construct_spread_market_name(team, line, sport)
                    formatted_events[event_name][start]['offers'][market_name] = [{'name': construct_team_spread_from_market_name(outcome['name'], market_name, sport), 'odds': int(outcome['price']['a'])} for outcome in market['selections']]
                except:
                    print('something went wrong adding spread market')
    return formatted_events
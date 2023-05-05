import re
import requests
from datetime import datetime

from utils import convert_decimal_to_american
from utils import convert_team_event_name
from utils import standardize_team_name


nhl = {
    'sport': 'nhl',
    'url': 'https://api.nj.pointsbet.com/api/v2/competitions/4/events/featured?includeLive=false&page=1',
    'market_labels': {"MONEYLINE": r'^Moneyline$'}
}

mlb = {
    'sport': 'mlb',
    'url': 'https://api.nj.pointsbet.com/api/v2/competitions/5767/events/featured?includeLive=false&page=1',
    'market_labels': {"MONEYLINE": r'^Moneyline$'}
}

nba = {
    'sport': 'nba', 
    'url': 'https://api.nj.pointsbet.com/api/v2/competitions/105/events/featured?includeLive=false&page=1', 
    'market_labels': {"MONEYLINE": r'^Moneyline$'}
}

def generate_pointsbet():
    return {
        'nhl': generate_pointsbet_formatted_events(**nhl),
        'mlb': generate_pointsbet_formatted_events(**mlb),
        'nba': generate_pointsbet_formatted_events(**nba),
    }

def generate_pointsbet_formatted_events(url, sport, market_labels):
    formatted_events = {}
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
    try:
        res = requests.get(url, headers=headers).json()
    except:
        print('print error getting url')
        return formatted_events
    try:
        events = res['events']
    except:
        print('error getting events')
        return formatted_events
    for event in events:
        try:
            event_name = convert_team_event_name(event['name'], sport)
        except:
            print('error could not find event')
            continue
        formatted_events[event_name] = {'offers': {}}
        try:
            formatted_events[event_name]['start'] = datetime.strptime(event['startsAt'], '%Y-%m-%dT%H:%M:%SZ')
        except ValueError:
            print('error parsing date time')
            formatted_events[event_name]['start'] = None
        try:
            markets = event['specialFixedOddsMarkets']
        except:
            print('could not find markets')
            continue
        for market in markets:
            try:
                label = market['eventName']
            except:
                print('error could not find label')
                continue
            # Moneyline
            if re.match(market_labels["MONEYLINE"], label):
                try:
                    if float(market['outcomes'][0]['price']) == 1 or float(market['outcomes'][1]['price']) == 1:
                        continue
                    formatted_events[event_name]['offers']['Moneyline'] = [{'name': standardize_team_name(outcome['name'], sport), 'odds': convert_decimal_to_american(float(outcome['price']))} for outcome in market['outcomes']]
                except:
                    print('something went wrong adding market moneyline')
    return formatted_events
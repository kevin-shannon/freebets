import re
import requests
from datetime import datetime, timedelta

from utils import convert_decimal_to_american
from utils import convert_team_event_name
from utils import standardize_team_name


nhl = {
    'sport': 'nhl',
    'url': 'https://nj.superbook.com/cache/psmg/UK/52180.1.json',
    'market_labels': {"MONEYLINE": r'^Moneyline$'}
}

mlb = {
    'sport': 'mlb',
    'url': 'https://nj.superbook.com/cache/psmg/UK/55267.1.json',
    'market_labels': {"MONEYLINE": r'^Moneyline$'}
}

nba = {
    'sport': 'nba', 
    'url': 'https://nj.superbook.com/cache/psmg/UK/55443.1.json', 
    'market_labels': {"MONEYLINE": r'^Moneyline$'}
}

def generate_superbook():
    return {
        'nhl': generate_superbook_formatted_events(**nhl),
        'mlb': generate_superbook_formatted_events(**mlb),
        'nba': generate_superbook_formatted_events(**nba),
    }

def generate_superbook_formatted_events(url, sport, market_labels):
    formatted_events = {}
    try:
        res = requests.get(url).json()
    except:
        print('error getting url')
        return formatted_events
    try:
        events = res['events']
    except:
        print('error getting events')
    for event in events:
        try:
            event_name = convert_team_event_name(event['eventname'], sport)
        except:
            print('error getting event name')
            continue
        try:
            start = datetime.strptime(event['tsstart'], '%Y-%m-%dT%H:%M:%S') + timedelta(hours=4)
        except ValueError:
            print('error parsing date time')
            start = None
        if event_name not in formatted_events:
            formatted_events[event_name] = {}
        formatted_events[event_name][start] = {'offers': {}}
        try:
            markets = event['markets']
        except:
            print('error getting markets')
            continue
        for market in markets:
            try:
                label = market['name']
            except:
                print('error getting label')
                continue
            if re.match(market_labels["MONEYLINE"], label):
                try:
                    formatted_events[event_name][start]['offers']['Moneyline'] = [{'name': standardize_team_name(outcome['name'], sport), 'odds': convert_decimal_to_american(float(outcome['price']))} for outcome in market['selections']]
                except:
                    print('something went wrong adding market moneyline')
    return formatted_events
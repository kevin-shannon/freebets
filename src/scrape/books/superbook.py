import requests
from datetime import datetime

from utils import convert_decimal_to_american
from utils import convert_team_event_name
from utils import standardize_team_name


def generate_superbook():
    return {
        'nhl': generate_superbook_nhl_formatted_events()
    }

# SUPERBOOK
# NHL
def generate_superbook_nhl_formatted_events():
    formatted_events = {}
    sport = 'nhl'
    url = 'https://nj.superbook.com/cache/psmg/UK/52180.1.json'
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
        formatted_events[event_name] = {'offers': {}}
        try:
            formatted_events[event_name]['start'] = datetime.strptime(event['tsstart'], '%Y-%m-%dT%H:%M:%S')
        except ValueError:
            print('error parsing date time')
            formatted_events[event_name]['start'] = None
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
            if label == 'Moneyline':
                try:
                    formatted_events[event_name]['offers']['Moneyline'] = [{'name': standardize_team_name(outcome['name'], sport), 'odds': convert_decimal_to_american(float(outcome['price']))} for outcome in market['selections']]
                except:
                    print('something went wrong adding market moneyline')
    return formatted_events



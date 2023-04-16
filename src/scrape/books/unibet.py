import requests
from datetime import datetime

from utils import construct_spread_market_name
from utils import construct_team_spread_from_market_name
from utils import construct_team_total_market_name
from utils import construct_total_market_name
from utils import convert_team_event_name
from utils import standardize_team_name


MONEYLINE = 'Moneyline - Inc. OT and Shootout'
TOTAL = 'Total Goals - Including Overtime'
SPREAD = 'Handicap - Including Overtime'

def generate_unibet():
    return {
        'nhl': generate_unibet_nhl_formatted_events()
    }

# UNIBET
# NHL
def generate_unibet_nhl_formatted_events():
    formatted_events = {}
    sport = 'nhl'
    url = 'https://eu-offering-api.kambicdn.com/offering/v2018/ubusva/listView/ice_hockey/nhl/all/all/matches.json?lang=en_US&market=US-VA&useCombined=true&useCombinedLive=true'
    try:
        res = requests.get(url).json()
    except:
        print('error getting url')
        return formatted_events
    try:
        events = res['events']
    except:
        print('error parsing events')
        return formatted_events
    for event in events:
        try:
            event_name = convert_team_event_name(event['event']['name'], sport)
            event_id = event['event']['id']
        except:
            print('error parsing event info')
            continue
        formatted_events[event_name] = {'offers': {}}
        try:
            formatted_events[event_name]['start'] = datetime.strptime(event['event']['start'], '%Y-%m-%dT%H:%M:%SZ')
        except ValueError:
            print('error parsing date time')
            formatted_events[event_name]['start'] = None

        url = f'https://eu-offering-api.kambicdn.com/offering/v2018/ubusva/betoffer/event/{event_id}.json'
        try:
            res = requests.get(url).json()
        except:
            print('error getting url')
            continue
        try:
            offers = res['betOffers']
        except:
            print('error missing betOffers')
            continue
        for offer in offers:
            try:
                label = offer['criterion']['label']
            except:
                print('missing label')
                continue
            # Moneyline
            if label == MONEYLINE:
                try:
                    formatted_events[event_name]['offers']['Moneyline'] = [{'name': standardize_team_name(outcome['label'], sport), 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding moneyline market')
            # Totals
            if TOTAL in label:
                try:
                    market_name = construct_total_market_name(float(offer['outcomes'][0]['line'])/1000)
                    formatted_events[event_name]['offers'][market_name] = [{'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding total market')
            # Spreads
            if SPREAD in label:
                try:
                    line = float(offer['outcomes'][0]['line'])/1000
                    if line < 0:
                        team = offer['outcomes'][0]['label']
                    else:
                        team = offer['outcomes'][1]['label']
                        line = -line
                    market_name = construct_spread_market_name(team, line, sport)
                    formatted_events[event_name][market_name] = [{'name': construct_team_spread_from_market_name(outcome['label'], market_name, sport), 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding spread market')
            # Team Totals
            if 'Total Goals by' in label and 'Including Overtime' in label:
                try:
                    team = standardize_team_name(offer['criterion']['label'].replace('Total Goals by', '').replace('- Including Overtime and Penalty Shootout', ''), sport)
                    line = float(offer['outcomes'][0]['line'])/1000
                    market_name = construct_team_total_market_name(team, line, sport)
                    formatted_events[event_name][market_name] = [{'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding team total market')
    return formatted_events
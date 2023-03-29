import requests
from datetime import datetime

from utils import construct_spread_market_name
from utils import construct_team_total_market_name
from utils import construct_total_market_name
from utils import convert_event_name_nhl
from utils import convert_spread_nhl
from utils import convert_team_name_nhl


MONEYLINE = 'Moneyline - Inc. OT and Shootout'
TOTAL = 'Total Goals - Including Overtime and Penalty Shootout'
SPREAD = 'Handicap - Including Overtime and Penalty Shootout'

def generate_unibet():
    return {
        'nhl': generate_unibet_nhl_formatted_events()
    }

# UNIBET
# NHL
def generate_unibet_nhl_formatted_events():
    formatted_events = {}
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
            event_name = convert_event_name_nhl(event['event']['name'])
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
                    formatted_events[event_name]['offers']['Moneyline'] = [{'name': convert_team_name_nhl(outcome['label']), 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding moneyline market')
            # Totals
            if label == TOTAL:
                try:
                    market_name = construct_total_market_name(float(offer['outcomes'][0]['line'])/1000)
                    formatted_events[event_name]['offers'][market_name] = [{'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding total market')
            # Spreads
            if label == SPREAD:
                try:
                    line = float(offer['outcomes'][0]['line'])/1000
                    if line < 0:
                        team = offer['outcomes'][0]['label']
                    else:
                        team = offer['outcomes'][1]['label']
                        line = -line
                    market_name = construct_spread_market_name(team, line)
                    formatted_events[event_name][market_name] = [{'name': convert_spread_nhl(outcome['label'], market_name), 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding spread market')
            # Team Totals
            if 'Total Goals by' in label and 'Including Overtime and Penalty Shootout' in label:
                try:
                    team = convert_team_name_nhl(offer['criterion']['label'].replace('Total Goals by', '').replace('- Including Overtime and Penalty Shootout', ''))
                    line = float(offer['outcomes'][0]['line'])/1000
                    market_name = construct_team_total_market_name(team, line)
                    formatted_events[event_name][market_name] = [{'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding team total market')
    return formatted_events
import re
import requests
from datetime import datetime

from utils import construct_spread_market_name
from utils import construct_team_spread_from_market_name
from utils import construct_team_total_market_name
from utils import construct_total_market_name
from utils import convert_team_event_name
from utils import standardize_team_name


nhl = {
    'sport': 'nhl',
    'url': 'https://eu-offering-api.kambicdn.com/offering/v2018/ubusva/listView/ice_hockey/nhl/all/all/matches.json?lang=en_US&market=US-VA&useCombined=true&useCombinedLive=true',
    'market_labels': {"MONEYLINE": r'^Moneyline - Inc. OT', "TOTAL": r'^Total Goals - Including Overtime', "SPREAD": r'^Handicap - Including Overtime', "TEAM_TOTAL": r'^Total Goals by .* Including Overtime'}
}

mlb = {
    'sport': 'mlb',
    'url': 'https://eu-offering-api.kambicdn.com/offering/v2018/ubusva/listView/baseball/mlb/all/all/matches.json?lang=en_US&market=US-VA&useCombined=true&useCombinedLive=true',
    'market_labels': {"MONEYLINE": r'^Moneyline$', "TOTAL": r'^Total Runs$', "SPREAD": r'^Run Line$', "TEAM_TOTAL": r'^Total Runs by .*'}
}

nba = {
    'sport': 'nba', 
    'url': 'https://eu-offering-api.kambicdn.com/offering/v2018/ubusva/listView/basketball/nba/all/all/matches.json?lang=en_US&market=US-VA&useCombined=true&useCombinedLive=true', 
    'market_labels': {"MONEYLINE": r'^Moneyline$', "TOTAL": r'^Total Points - Including Overtime$', "SPREAD": r'^Handicap - Including Overtime$', "TEAM_TOTAL": r'^Total Points by .* Including Overtime$'}
}

def generate_unibet():
    return {
        'nhl': generate_unibet_formatted_events(**nhl),
        'mlb': generate_unibet_formatted_events(**mlb),
        'nba': generate_unibet_formatted_events(**nba),
    }

def generate_unibet_formatted_events(url, sport, market_labels):
    '''
    Generates formatted events data for unibet nba bets. First, request is to gather all events. All other requests are to gather odds data for each event.
    Parameters
    ----------
        url : str
            url of API to get all events of that sport
        sport : str
            sport identifier
        market_labels : dict of str
            regex patterns of labels for each market
    Returns
    -------
    formatted_events : dict
        formatted events data for unibet nba bets
    '''
    formatted_events = {}
    try:
        res = requests.get(url).json()
    except Exception as e:
        print('error getting url', e)
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
        try:
            start = datetime.strptime(event['event']['start'], '%Y-%m-%dT%H:%M:%SZ')
        except ValueError:
            print('error parsing date time')
            start = None
        if event_name not in formatted_events:
            formatted_events[event_name] = {}
        formatted_events[event_name][start] = {'offers': {}}

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
            if re.match(market_labels["MONEYLINE"], label):
                try:
                    formatted_events[event_name][start]['offers']['Moneyline'] = [{'name': standardize_team_name(outcome['label'], sport), 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding moneyline market')
            # Totals
            if re.match(market_labels["TOTAL"], label):
                try:
                    market_name = construct_total_market_name(float(offer['outcomes'][0]['line'])/1000)
                    formatted_events[event_name][start]['offers'][market_name] = [{'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding total market')
            # Spreads
            if re.match(market_labels["SPREAD"], label):
                try:
                    line = float(offer['outcomes'][0]['line'])/1000
                    if line < 0:
                        team = offer['outcomes'][0]['label']
                    else:
                        team = offer['outcomes'][1]['label']
                        line = -line
                    market_name = construct_spread_market_name(team, line, sport)
                    formatted_events[event_name][start]['offers'][market_name] = [{'name': construct_team_spread_from_market_name(outcome['label'], market_name, sport), 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding spread market')
            # Team Totals
            if re.match(market_labels["TEAM_TOTAL"], label):
                try:
                    team = standardize_team_name(offer['criterion']['label'], sport)
                    line = float(offer['outcomes'][0]['line'])/1000
                    market_name = construct_team_total_market_name(team, line, sport)
                    formatted_events[event_name][start]['offers'][market_name] = [{'name': outcome['label'], 'odds': int(outcome['oddsAmerican'])} for outcome in offer['outcomes']]
                except:
                    print('something went wrong adding team total market')
    return formatted_events
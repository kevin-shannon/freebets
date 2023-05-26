import re
import requests
from datetime import datetime

from utils import build_team_spread_market_name
from utils import construct_total_market_name
from utils import convert_team_event_name
from utils import standardize_team_name
from utils import standardize_team_spread


nhl = {
    'sport': 'nhl',
    'url': 'https://sbapi.nj.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=nhl&_ak=FhMFpcPWXMeyZxOx',
    'market_labels': {"MONEYLINE": r'^Moneyline - Inc. OT', "TOTAL": r'^Alternate Total Goals$', "SPREAD": r'^Alternate Puck Line$'},
    'compititon_name': 'NHL - Matches',
}

mlb = {
    'sport': 'mlb',
    'url': 'https://sbapi.nj.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=mlb&_ak=FhMFpcPWXMeyZxOx',
    'market_labels': {"MONEYLINE": r'^Moneyline$', "TOTAL": r'^Alternate Total Runs$', "SPREAD": r'^Alternate Run Lines$'},
    'compititon_name': 'MLB',
}

nba = {
    'sport': 'nba', 
    'url': 'https://sbapi.nj.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=nba&_ak=FhMFpcPWXMeyZxOx', 
    'market_labels': {"MONEYLINE": r'^Moneyline$', "TOTAL": r'^Alternate Total Points$', "SPREAD": r'^Alternative Spreads$'},
    'compititon_name': 'NBA',
}

def generate_fanduel():
    return {
        'nhl': generate_fanduel_formatted_events(**nhl),
        'mlb': generate_fanduel_formatted_events(**mlb),
        'nba': generate_fanduel_formatted_events(**nba),
    }

def generate_fanduel_formatted_events(url, sport, market_labels, compititon_name):
    id_to_name_time = {}
    formatted_events = {}
    headers = {'Cache-Control': 'no-cache'}
    try:
        res = requests.get(url, headers=headers).json()
    except:
        print('error getting url')
        return formatted_events
    try:
        competitions = res['attachments']['competitions']
    except:
        print('error getting competitions')
    else:
        for id, competition in competitions.items():
            if competition.get('name') == compititon_name:
                competition_id = int(id)
                break
        else:
            print('error finding competition id', sport)
            return formatted_events
    try:
        events = res['attachments']['events']
    except:
        print('error getting events')
        return formatted_events
    for event_id, event in events.items():
        if event.get('competitionId') == competition_id:
            try:
                event_name = convert_team_event_name(event['name'], sport)
            except:
                print('error parsing team event name')
                continue
            try:
                start = datetime.strptime(re.sub('\.\d*', '', event['openDate']), '%Y-%m-%dT%H:%M:%SZ')
            except ValueError:
                print('error parsing date time')
                start = None
            id_to_name_time[event_id] = (event_name, start)
            if event_name not in formatted_events:
                formatted_events[event_name] = {}
            formatted_events[event_name][start] = {'offers': {}}
    for event_id in id_to_name_time:
        url = f'https://sbapi.nj.sportsbook.fanduel.com/api/event-page?_ak=FhMFpcPWXMeyZxOx&eventId={event_id}'
        try:
            res = requests.get(url, headers=headers).json()
        except:
            print('error getting url')
            continue
        try:
            markets = res['attachments']['markets']
        except:
            print('error getting markets')
            continue
        for market in markets.values():
            try:
                label = market['marketName']
                runners = market['runners']
            except:
                print('error getting event info')
                continue
            # Moneyline
            if re.match(market_labels["MONEYLINE"], label):
                try:
                    event_name, start = id_to_name_time[str(market['eventId'])]
                    outcomes = [{'name': standardize_team_name(outcome['runnerName'], sport), 'odds': int(outcome['winRunnerOdds']['americanDisplayOdds']['americanOdds'])} for outcome in runners]
                    formatted_events[event_name][start]['offers']['Moneyline'] = outcomes
                except:
                    print('something went wrong adding market moneyline')
            # Totals
            elif re.match(market_labels["TOTAL"], label):
                for runner in runners:
                    try:
                        event_name, start = id_to_name_time[str(market['eventId'])]
                        bet_name, line = runner['runnerName'].split(' ')
                        market_name = construct_total_market_name(line)
                        outcome = {'name': bet_name, 'odds': int(runner['winRunnerOdds']['americanDisplayOdds']['americanOdds'])}
                        if market_name in formatted_events[event_name][start]['offers']:
                            formatted_events[event_name][start]['offers'][market_name].append(outcome)
                        else:
                            formatted_events[event_name][start]['offers'][market_name] = [outcome]
                    except:
                        print('something went wrong adding market total')
            # Spread
            elif re.match(market_labels["SPREAD"], label):
                try:
                    event_name, start = id_to_name_time[str(market['eventId'])]
                    teams = event_name.split(' vs ')
                except:
                    print('error getting event info')
                    continue
                for runner in runners:
                    try:
                        spread = standardize_team_spread(runner['runnerName'], sport)
                        market_name = build_team_spread_market_name(teams, spread, sport)
                        outcome = {'name': spread, 'odds': int(runner['winRunnerOdds']['americanDisplayOdds']['americanOdds'])}
                        if market_name in formatted_events[event_name][start]['offers']:
                            formatted_events[event_name][start]['offers'][market_name].append(outcome)
                        else:
                            formatted_events[event_name][start]['offers'][market_name] = [outcome]
                    except:
                        print('something went wrong adding market spread')
    return formatted_events
    
    
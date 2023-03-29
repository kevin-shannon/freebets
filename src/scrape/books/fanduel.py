import re
import requests
from datetime import datetime

from utils import build_spread_market_name
from utils import construct_total_market_name
from utils import convert_event_name_nhl
from utils import convert_team_name_nhl
from utils import convert_spread_nhl


MONEYLINE = 'Moneyline'
TOTAL = 'Alternate Total Goals'
SPREAD = 'Alternate Puck Line'

def generate_fanduel():
    return {
        'nhl': generate_fanduel_nhl_formatted_events()
    }

# FANDUEL
# NHL
def generate_fanduel_nhl_formatted_events():
    id_to_name = {}
    formatted_events = {}
    url = 'https://sbapi.nj.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=nhl&_ak=FhMFpcPWXMeyZxOx'
    try:
        res = requests.get(url).json()
    except:
        print('error getting url')
        return formatted_events
    competition_id = 12550521
    try:
        competitions = res['attachments']['competitions']
    except:
        print('error getting competitions')
    else:
        for id, competition in competitions.items():
            if competition.get('name') == 'NHL Games' or competition.get('name') == 'NHL - Matches':
                competition_id = int(id)
                break
    try:
        events = res['attachments']['events']
    except:
        print('error getting events')
        return formatted_events
    for event_id, event in events.items():
        if event.get('competitionId') == competition_id:
            event_name = convert_event_name_nhl(event['name'])
            id_to_name[event_id] = event_name
            formatted_events[event_name] = {'offers': {}}
            try:
                formatted_events[event_name]['start'] = datetime.strptime(re.sub('\.\d*', '', event['openDate']), '%Y-%m-%dT%H:%M:%SZ')
            except ValueError:
                print('error parsing date time')
                formatted_events[event_name]['start'] = None
    for event_id in id_to_name:
        url = f'https://sbapi.nj.sportsbook.fanduel.com/api/event-page?_ak=FhMFpcPWXMeyZxOx&eventId={event_id}'
        try:
            res = requests.get(url).json()
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
            if label == MONEYLINE:
                try:
                    event_name = id_to_name[str(market['eventId'])]
                    outcomes = [{'name': convert_team_name_nhl(outcome['runnerName']), 'odds': int(outcome['winRunnerOdds']['americanDisplayOdds']['americanOdds'])} for outcome in runners]
                    formatted_events[event_name]['offers']['Moneyline'] = outcomes
                except:
                    print('something went wrong adding market moneyline')
            # Totals
            elif label == TOTAL:
                for runner in runners:
                    try:
                        event_name = id_to_name[str(market['eventId'])]
                        bet_name, line = runner['runnerName'].split(' ')
                        market_name = construct_total_market_name(line)
                        outcome = {'name': bet_name, 'odds': int(runner['winRunnerOdds']['americanDisplayOdds']['americanOdds'])}
                        if market_name in formatted_events[event_name]['offers']:
                            formatted_events[event_name]['offers'][market_name].append(outcome)
                        else:
                            formatted_events[event_name]['offers'][market_name] = [outcome]
                    except:
                        print('something went wrong adding market total')
            # Spread
            elif label == SPREAD:
                try:
                    event_name = id_to_name[str(market['eventId'])]
                    teams = event_name.split(' vs ')
                except:
                    print('error getting event info')
                    continue
                for runner in runners:
                    try:
                        spread = convert_spread_nhl(runner['runnerName'])
                        market_name = build_spread_market_name(teams, spread)
                        outcome = {'name': spread, 'odds': int(runner['winRunnerOdds']['americanDisplayOdds']['americanOdds'])}
                        if market_name in formatted_events[event_name]['offers']:
                            formatted_events[event_name]['offers'][market_name].append(outcome)
                        else:
                            formatted_events[event_name]['offers'][market_name] = [outcome]
                    except:
                        print('something went wrong adding market spread')
    return formatted_events
    
    
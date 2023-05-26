import re
import requests
from datetime import datetime

from utils import construct_spread_market_name
from utils import construct_team_total_market_name
from utils import construct_total_market_name
from utils import generate_team_event_name
from utils import standardize_over_under
from utils import standardize_team_name
from utils import standardize_team_spread


nhl = {
    'sport': 'nhl',
    'url': 'https://sports.dc.betmgm.com/en/sports/api/widget?layoutSize=Large&page=CompetitionLobby&sportId=12&regionId=9&competitionId=34',
    'market_labels': {"MONEYLINE": r'^Money Line$', "TOTAL": r'^Totals \(including overtime', "SPREAD": r'^Spread \(including overtime', "TEAM_TOTAL": r'^How many total runs will the .* score\? \(including overtime'}
}

mlb = {
    'sport': 'mlb',
    'url': 'https://sports.dc.betmgm.com/en/sports/api/widget?layoutSize=Large&page=CompetitionLobby&sportId=23&regionId=9&competitionId=75',
    'market_labels': {"MONEYLINE": r'^Money Line$', "TOTAL": r'^Totals$', "SPREAD": r'^Run Line Spread$', "TEAM_TOTAL": r'^How many total runs will the .* score\?$'}
}

nba = {
    'sport': 'nba', 
    'url': 'https://sports.dc.betmgm.com/en/sports/api/widget?layoutSize=Large&page=CompetitionLobby&sportId=7&regionId=9&competitionId=6004', 
    'market_labels': {"MONEYLINE": r'^Money Line$', "TOTAL": r'^Totals$', "SPREAD": r'^Run Line Spread$', "TEAM_TOTAL": r'^How many points will the .* score\?$'}
}

def generate_betmgm():
    return {
        'nhl': generate_betmgm_formatted_events(**nhl),
        'mlb': generate_betmgm_formatted_events(**mlb),
        'nba': generate_betmgm_formatted_events(**nba),
    }

def generate_betmgm_formatted_events(url, sport, market_labels):
    formatted_events = {}
    id_to_name_time = {}
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
               'Cache-Control': 'no-cache'}
    xbwin_id = 'YTBiYWQ3ZjItMjBlZi00ODU2LWFmNjMtMTQzYjAzOGUxNDM2'
    try:
        res = requests.get(url, headers=headers).json()
    except:
        print('error getting url')
        return formatted_events
    try:
        events = res['widgets'][2]['payload']['items'][0]['activeChildren'][0]['payload']['fixtures']
    except:
        print('error parsing events')
        return formatted_events
    for event in events:
        try:
            event_name = generate_team_event_name(event['participants'][0]['name']['value'], event['participants'][1]['name']['value'], sport)
        except:
            print('error parsing event name')
        else:
            try:
                start = datetime.strptime(event['startDate'], '%Y-%m-%dT%H:%M:%SZ')
            except ValueError:
                print('error parsing date time')
                start = None
            try:
                id_to_name_time[event['id']] = (event_name, start)
            except:
                print('error parsing event id')
            if event_name not in formatted_events:
                formatted_events[event_name] = {}
            formatted_events[event_name][start] = {'offers': {}}

    for fixtureId, (event_name, start) in id_to_name_time.items():
        url = f'https://sports.dc.betmgm.com/cds-api/bettingoffer/fixture-view?x-bwin-accessid={xbwin_id}&lang=en-us&country=US&offerMapping=All&scoreboardMode=Full&fixtureIds={fixtureId}'
        try:
            res = requests.get(url, headers=headers).json()
        except:
            print('error getting url')
            continue
        try:
            games = res['fixture']['games']
        except:
            print('error getting games')
        for game in games:
            try:
                label = game['name']['value']
            except:
                print('error getting label')
                continue
            # Moneyline
            if re.match(market_labels["MONEYLINE"], label):
                try:
                    formatted_events[event_name][start]['offers']['Moneyline'] = [{'name': standardize_team_name(outcome['name']['value'], sport), 'odds': int(outcome['americanOdds'])} for outcome in game['results']]
                except:
                    print('something went wrong adding market moneyline')
            # Totals
            if re.match(market_labels["TOTAL"], label):
                try:
                    line = float(game['attr'])
                    market_name = construct_total_market_name(line)
                    formatted_events[event_name][start]['offers'][market_name] = [{'name': standardize_over_under(outcome['totalsPrefix']), 'odds': int(outcome['americanOdds'])} for outcome in game['results']]
                except:
                    print('something went wrong adding market total')
            # Spreads
            if re.match(market_labels["SPREAD"], label):
                try:
                    line = float(game['results'][0]['name']['value'].strip().split(' ')[-1])
                    if line < 0:
                        team = ' '.join(game['results'][0]['name']['value'].strip().split(' ')[:-1])
                    else:
                        team = ' '.join(game['results'][1]['name']['value'].strip().split(' ')[:-1])
                        line = -line
                    market_name = construct_spread_market_name(team, line, sport)
                    formatted_events[event_name][start]['offers'][market_name] = [{'name': standardize_team_spread(outcome['name']['value'].strip(), sport), 'odds': int(outcome['americanOdds'])} for outcome in game['results']]
                except:
                    print('something went wrong adding market spread')
            # Team Totals
            if re.match(market_labels["TEAM_TOTAL"], label):
                try:
                    team = standardize_team_name(label, sport)
                    line =  float(game['attr'])
                    market_name = construct_team_total_market_name(team, line, sport)
                    formatted_events[event_name][start]['offers'][market_name] = [{'name': standardize_over_under(outcome['name']['value']), 'odds': int(outcome['americanOdds'])} for outcome in game['results']]
                except:
                    print('something went wrong adding market team total')    
    return formatted_events
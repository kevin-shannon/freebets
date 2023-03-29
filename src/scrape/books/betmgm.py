import requests
from datetime import datetime

from utils import construct_spread_market_name
from utils import construct_team_total_market_name
from utils import construct_total_market_name
from utils import convert_outcome_name
from utils import convert_spread_nhl
from utils import convert_team_name_nhl
from utils import generate_event_name

MONEYLINE = 'Money Line'
TOTAL = 'Totals (including overtime and shoot-outs)'
SPREAD = 'Spread (including overtime and shoot-outs)'

def generate_betmgm():
    return {
        'nhl': generate_betmgm_nhl_formatted_events()
    }

# BETMGM
# NHL
def generate_betmgm_nhl_formatted_events():
    formatted_events = {}
    id_to_name = {}
    url = 'https://sports.dc.betmgm.com/en/sports/api/widget?layoutSize=Large&page=CompetitionLobby&sportId=12&regionId=9&competitionId=34'
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
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
            event_name = generate_event_name(event['participants'][0]['name']['value'], event['participants'][1]['name']['value'])
            id_to_name[event['id']] = event_name
        except:
            print('error parsing event name')
        else:
            formatted_events[event_name] = {'offers': {}}
            try:
                formatted_events[event_name]['start'] = datetime.strptime(event['startDate'], '%Y-%m-%dT%H:%M:%SZ')
            except ValueError:
                print('error parsing date time')
                formatted_events[event_name]['start'] = None

    for fixtureId, event_name in id_to_name.items():
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
            if label == MONEYLINE:
                try:
                    formatted_events[event_name]['offers'][market_name] = [{'name': convert_team_name_nhl(outcome['name']['value']), 'odds': int(outcome['americanOdds'])} for outcome in game['results']]
                except:
                    print('something went wrong adding market')
            # Team Totals
            if 'How many goals will' in label and '(including overtime and shoot-outs)' in label:
                try:
                    team = label.replace('How many goals will the ', '').replace(' score? (including overtime and shoot-outs)', '')
                    line =  game['attr']
                    market_name = construct_team_total_market_name(team, line)
                    formatted_events[event_name]['offers'][market_name] = [{'name': convert_outcome_name(outcome['totalsPrefix']), 'odds': int(outcome['americanOdds'])} for outcome in game['results']]
                except:
                    print('something went wrong adding market')
            # Totals
            if label == TOTAL:
                try:
                    line =  game['attr']
                    market_name = construct_total_market_name(line)
                    formatted_events[event_name]['offers'][market_name] = [{'name': convert_outcome_name(outcome['totalsPrefix']), 'odds': int(outcome['americanOdds'])} for outcome in game['results']]
                except:
                    print('something went wrong adding market')
            # Spreads
            if label == SPREAD:
                try:
                    line = float(game['results'][0]['name']['value'].split(' ')[-1])
                    if line < 0:
                        team = ' '.join(game['results'][0]['name']['value'].split(' ')[:-1])
                    else:
                        team = ' '.join(game['results'][1]['name']['value'].split(' ')[:-1])
                        line = -line
                    market_name = construct_spread_market_name(team, line)
                    formatted_events[event_name]['offers'][market_name] = [{'name': convert_spread_nhl(outcome['name']['value']), 'odds': int(outcome['americanOdds'])} for outcome in game['results']]
                except:
                    print('something went wrong adding market')                    
    return formatted_events